-- 0004 — the wardrobe and outfits. This is Milestone 1's subject matter.

create type public.garment_source   as enum ('photo', 'link', 'manual', 'order_email');
create type public.garment_condition as enum ('new', 'good', 'worn', 'needs_repair');
create type public.wear_source      as enum ('manual', 'outfit_worn');
create type public.outfit_origin    as enum ('manual', 'suggested');

create table public.garments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles (id) on delete cascade,
  title                text not null,
  brand_id             uuid references public.brands (id) on delete set null,
  category_id          uuid not null references public.categories (id) on delete restrict,

  -- Colour is stored as CIELAB, not hex. The scorer works in Lab (spec §4.2) and
  -- converting on every comparison would be wasted work in the 50ms budget.
  -- hex is kept alongside purely for display.
  colour_primary_hex   text check (colour_primary_hex ~* '^#[0-9a-f]{6}$'),
  colour_primary_lab   real[3],
  colour_secondary_hex text check (colour_secondary_hex ~* '^#[0-9a-f]{6}$'),
  colour_secondary_lab real[3],
  is_neutral           boolean not null default false,  -- neutrals are always-compatible

  pattern              text not null default 'solid',
  pattern_scale        text check (pattern_scale in ('small', 'medium', 'large')),
  material_main        text,
  warmth_rating        smallint check (warmth_rating between 0 and 5),
  waterproof           boolean not null default false,
  formality            smallint check (formality between 1 and 5),  -- 1 casual … 5 formal

  size_label           text,
  purchase_price_cents integer check (purchase_price_cents >= 0),
  currency             text not null default 'EUR',
  purchased_at         date,

  source               public.garment_source not null default 'manual',
  product_id           uuid references public.products (id) on delete set null,

  image_path           text,                -- private bucket key; never a public URL
  image_embedding      vector(512),

  condition            public.garment_condition not null default 'good',
  in_wash              boolean not null default false,
  notes                text,

  archived_at          timestamptz,
  deleted_at           timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
select public.apply_touch_trigger('public.garments');

-- The wardrobe list is always "mine, not deleted, newest first".
create index garments_user_active_idx on public.garments (user_id, created_at desc)
  where deleted_at is null;
create index garments_user_category_idx on public.garments (user_id, category_id)
  where deleted_at is null and archived_at is null;

create table public.garment_wears (
  id         uuid primary key default gen_random_uuid(),
  garment_id uuid not null references public.garments (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  worn_on    date not null default current_date,
  outfit_id  uuid,   -- FK added after outfits exists
  source     public.wear_source not null default 'manual',
  created_at timestamptz not null default now()
);
-- Drives "not worn in N days" (spec §2).
create index garment_wears_garment_worn_idx on public.garment_wears (garment_id, worn_on desc);
create index garment_wears_user_worn_idx on public.garment_wears (user_id, worn_on desc);
-- One wear per garment per day per source: tapping "worn" twice is not two wears,
-- and cost-per-wear is only honest if this holds.
create unique index garment_wears_unique_day_idx
  on public.garment_wears (garment_id, worn_on, source);

create table public.outfits (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  title            text,
  occasion_tags    text[] not null default '{}',
  created_from     public.outfit_origin not null default 'manual',
  coherence_score  smallint check (coherence_score between 0 and 100),
  -- The one-line explanation is stored with the score. A bare number is
  -- useless and untrustworthy (spec §4.2).
  coherence_reason text,
  cover_image_path text,
  deleted_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
select public.apply_touch_trigger('public.outfits');
create index outfits_user_active_idx on public.outfits (user_id, created_at desc)
  where deleted_at is null;

create table public.outfit_items (
  outfit_id  uuid not null references public.outfits (id) on delete cascade,
  garment_id uuid not null references public.garments (id) on delete cascade,
  layer_slot public.layer_slot not null,
  position   smallint not null default 0,
  primary key (outfit_id, garment_id)
);
create index outfit_items_garment_idx on public.outfit_items (garment_id);
-- Non-accessory slots hold exactly one garment; accessories are repeatable (spec §4.1).
create unique index outfit_items_single_slot_idx
  on public.outfit_items (outfit_id, layer_slot)
  where layer_slot <> 'accessory';

create table public.outfit_wears (
  id               uuid primary key default gen_random_uuid(),
  outfit_id        uuid not null references public.outfits (id) on delete cascade,
  user_id          uuid not null references public.profiles (id) on delete cascade,
  worn_on          date not null default current_date,
  weather_snapshot jsonb,
  -- The training signal for tuning the scorer (spec §4.3). Null = not yet answered.
  kept             boolean,
  created_at       timestamptz not null default now(),
  unique (outfit_id, worn_on)
);
create index outfit_wears_user_worn_idx on public.outfit_wears (user_id, worn_on desc);

alter table public.garment_wears
  add constraint garment_wears_outfit_id_fkey
  foreign key (outfit_id) references public.outfits (id) on delete set null;

-- Wanting things (spec §2). M4 writes these; created now so watches can be
-- seeded against the fixture catalogue for UI work.
create type public.alert_kind as enum
  ('all_time_low', '12m_low', 'back_in_size', 'sale_ending', 'target_hit');

create table public.watches (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  product_id         uuid references public.products (id) on delete cascade,
  variant_id         uuid references public.product_variants (id) on delete cascade,
  target_price_cents integer check (target_price_cents >= 0),
  size_label         text,
  active             boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  -- A watch with neither a product nor a variant watches nothing.
  constraint watches_has_target check (product_id is not null or variant_id is not null)
);
select public.apply_touch_trigger('public.watches');
create index watches_user_active_idx on public.watches (user_id) where active;

create table public.alerts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  watch_id     uuid not null references public.watches (id) on delete cascade,
  kind         public.alert_kind not null,
  payload      jsonb not null default '{}'::jsonb,
  sent_at      timestamptz,
  opened_at    timestamptz,
  converted_at timestamptz,
  created_at   timestamptz not null default now()
);
create index alerts_user_created_idx on public.alerts (user_id, created_at desc);
-- Dedupe: never alert twice on the same watch+kind within 48 hours (spec §5.3).
-- The window check needs the timestamp, so it is enforced in the alerting code;
-- this index is what makes that check cheap.
create index alerts_watch_kind_sent_idx on public.alerts (watch_id, kind, sent_at desc);
