-- 0003 — taxonomy and the shop-side catalogue.
--
-- Created in Milestone 1 even though the shop side is Milestone 4 work
-- (see docs/DECISIONS.md): garments.product_id references products, and
-- price_points needs its partitioning in place before it has rows, not after.
-- Nothing writes to these tables in M1 except the fixture catalogue.

-- Every category maps to exactly one layer slot (spec §4.1).
-- `full` occupies top + bottom; `accessory` is repeatable within an outfit.
create type public.layer_slot as enum
  ('base', 'top', 'mid', 'outer', 'bottom', 'full', 'shoes', 'accessory');

create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references public.categories (id) on delete restrict,
  slug         text not null unique,
  display_name text not null,
  layer_slot   public.layer_slot not null,
  -- Coarse bucket used to look up the user's size. Null for things with no size.
  size_group   text,
  gender       text not null default 'men' check (gender in ('men', 'women', 'unisex')),
  sort_order   smallint not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
select public.apply_touch_trigger('public.categories');
create index categories_layer_slot_idx on public.categories (layer_slot);

create table public.brands (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  aliases    text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
select public.apply_touch_trigger('public.brands');
-- Product resolution step 2 is brand + fuzzy title (spec §5.2); both need trigrams.
create index brands_name_trgm_idx on public.brands using gin (name gin_trgm_ops);

create table public.retailers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  domain            text not null unique,
  affiliate_network text,
  commission_pct    numeric(5, 2),
  ships_to          text[] not null default '{}',
  -- { "free_over_cents": 5000, "flat_cents": 495, "eu_vat_included": true, ... }
  delivery_rules    jsonb not null default '{}'::jsonb,
  -- Whether this retailer permits price/stock refresh by direct fetch (spec §5.1).
  scrape_allowed    boolean not null default false,
  trust_score       smallint not null default 50 check (trust_score between 0 and 100),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
select public.apply_touch_trigger('public.retailers');

create table public.products (
  id              uuid primary key default gen_random_uuid(),
  brand_id        uuid references public.brands (id) on delete restrict,
  canonical_title text not null,
  category_id     uuid references public.categories (id) on delete restrict,
  colour          text,
  material        text,
  description     text,
  image_url       text,
  image_embedding vector(512),
  gender          text not null default 'men' check (gender in ('men', 'women', 'unisex')),
  first_seen_at   timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
select public.apply_touch_trigger('public.products');
create index products_title_trgm_idx on public.products using gin (canonical_title gin_trgm_ops);
create index products_brand_category_idx on public.products (brand_id, category_id);

create table public.product_variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size_label  text not null,
  size_region text not null default 'EU',
  colourway   text,
  gtin        text,
  mpn         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (product_id, size_label, size_region, colourway)
);
select public.apply_touch_trigger('public.product_variants');
-- GTIN/MPN exact match is resolution step 1 and the only reliable one.
create index product_variants_gtin_idx on public.product_variants (gtin) where gtin is not null;
create index product_variants_mpn_idx on public.product_variants (mpn) where mpn is not null;

create table public.offers (
  id                   uuid primary key default gen_random_uuid(),
  variant_id           uuid not null references public.product_variants (id) on delete cascade,
  retailer_id          uuid not null references public.retailers (id) on delete cascade,
  url                  text not null,
  affiliate_url        text,
  price_cents          integer not null check (price_cents >= 0),
  currency             text not null default 'EUR',
  in_stock             boolean not null default true,
  delivery_cents       integer not null default 0 check (delivery_cents >= 0),
  duty_estimate_cents  integer not null default 0 check (duty_estimate_cents >= 0),
  ships_to             text[] not null default '{}',
  last_checked_at      timestamptz not null default now(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (variant_id, retailer_id)
);
select public.apply_touch_trigger('public.offers');
create index offers_variant_stock_price_idx on public.offers (variant_id, in_stock, price_cents);

-- Landed price (spec §5.3). A generated column rather than application code so
-- that ranking by it is an index-able sort and cannot drift between callers.
-- Note this is the *retailer-side* landed price; duty is per-destination and is
-- recomputed for the requesting user's country in the query layer.
alter table public.offers
  add column landed_price_cents integer
  generated always as (price_cents + delivery_cents + duty_estimate_cents) stored;
create index offers_landed_price_idx on public.offers (variant_id, landed_price_cents)
  where in_stock;

-- Append-only, partitioned monthly (spec §2 index requirements, §5.3).
create table public.price_points (
  id          uuid not null default gen_random_uuid(),
  offer_id    uuid not null references public.offers (id) on delete cascade,
  price_cents integer not null check (price_cents >= 0),
  in_stock    boolean not null,
  observed_at timestamptz not null default now(),
  primary key (id, observed_at)
) partition by range (observed_at);

create index price_points_offer_observed_idx on public.price_points (offer_id, observed_at desc);

-- Partition management. Called by a cron job so partitions exist before writes
-- land in them; an INSERT with no matching partition is a hard error.
create or replace function public.ensure_price_point_partition(for_month date)
returns void
language plpgsql
as $$
declare
  start_at date := date_trunc('month', for_month)::date;
  end_at   date := (date_trunc('month', for_month) + interval '1 month')::date;
  part     text := format('price_points_%s', to_char(start_at, 'YYYY_MM'));
begin
  if not exists (select 1 from pg_class where relname = part) then
    execute format(
      'create table public.%I partition of public.price_points
         for values from (%L) to (%L)',
      part, start_at, end_at
    );

    -- A partition does NOT inherit the parent's row security: relrowsecurity is
    -- false on it, and querying the partition directly bypasses the parent's
    -- policies entirely. Spec §1 says RLS on every table with no exceptions, so
    -- each partition gets it explicitly as it is created — otherwise the answer
    -- to "is RLS on everything?" silently becomes "no" once a month.
    execute format('alter table public.%I enable row level security', part);
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      part || '_read', part
    );
  end if;
end;
$$;

-- Current month and the next two, so a missing cron run is not an outage.
select public.ensure_price_point_partition(current_date);
select public.ensure_price_point_partition((current_date + interval '1 month')::date);
select public.ensure_price_point_partition((current_date + interval '2 months')::date);
