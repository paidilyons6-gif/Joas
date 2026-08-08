-- 0006 — Row Level Security. RLS on every table, no exceptions (spec §1).
--
-- Two shapes of table:
--   * User-owned  — readable and writable only by the owning auth.uid().
--   * Reference   — categories, brands, retailers, products, variants, offers,
--                   price_points. Readable by any authenticated user, writable
--                   only by the service role (feed ingestion). Enabling RLS with
--                   no write policy is what denies writes; the service role
--                   bypasses RLS entirely, which is the intended path.

-- ── User-owned ───────────────────────────────────────────────────────────────

alter table public.profiles       enable row level security;
alter table public.user_sizes     enable row level security;
alter table public.user_prefs     enable row level security;
alter table public.garments       enable row level security;
alter table public.garment_wears  enable row level security;
alter table public.outfits        enable row level security;
alter table public.outfit_items   enable row level security;
alter table public.outfit_wears   enable row level security;
alter table public.watches        enable row level security;
alter table public.alerts         enable row level security;

create policy profiles_own on public.profiles
  for all to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy user_sizes_own on public.user_sizes
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy user_prefs_own on public.user_prefs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy garments_own on public.garments
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- garment_wears carries its own user_id so this policy needs no join. The
-- denormalised column is kept honest by the trigger below rather than trusted
-- from the client.
create policy garment_wears_own on public.garment_wears
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy outfits_own on public.outfits
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- outfit_items has no user_id; ownership comes from the parent outfit.
create policy outfit_items_own on public.outfit_items
  for all to authenticated
  using (
    exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid())
    and
    -- and the garment must be the same user's, or an outfit could reference
    -- someone else's garment and leak its row through the join.
    exists (select 1 from public.garments g where g.id = garment_id and g.user_id = auth.uid())
  );

create policy outfit_wears_own on public.outfit_wears
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy watches_own on public.watches
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Alerts are written by the server. The user may read them and mark them
-- opened, but must not be able to forge one.
create policy alerts_read_own on public.alerts
  for select to authenticated
  using (user_id = auth.uid());

create policy alerts_update_own on public.alerts
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- A client-supplied user_id on a child row is a chance to get it wrong, and the
-- unique indexes and cost-per-wear queries depend on it. Derive it server-side.
create or replace function public.set_wear_user_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'garment_wears' then
    select g.user_id into new.user_id from public.garments g where g.id = new.garment_id;
  else
    select o.user_id into new.user_id from public.outfits o where o.id = new.outfit_id;
  end if;

  if new.user_id is null then
    raise exception 'cannot resolve owner for %', tg_table_name;
  end if;

  return new;
end;
$$;

create trigger set_user_id before insert or update on public.garment_wears
  for each row execute function public.set_wear_user_id();

create trigger set_user_id before insert or update on public.outfit_wears
  for each row execute function public.set_wear_user_id();

-- ── Reference / catalogue ────────────────────────────────────────────────────

alter table public.categories       enable row level security;
alter table public.brands           enable row level security;
alter table public.retailers        enable row level security;
alter table public.products         enable row level security;
alter table public.product_variants enable row level security;
alter table public.offers           enable row level security;
alter table public.price_points     enable row level security;

create policy categories_read on public.categories
  for select to authenticated using (true);
create policy brands_read on public.brands
  for select to authenticated using (true);
create policy retailers_read on public.retailers
  for select to authenticated using (true);
create policy products_read on public.products
  for select to authenticated using (true);
create policy product_variants_read on public.product_variants
  for select to authenticated using (true);
create policy offers_read on public.offers
  for select to authenticated using (true);
create policy price_points_read on public.price_points
  for select to authenticated using (true);
