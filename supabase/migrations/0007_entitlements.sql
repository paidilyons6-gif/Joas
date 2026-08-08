-- 0007 — entitlements, enforced server-side (spec §6.8).
--
-- The UI also gates on these, but the UI is a suggestion: a stale build or a
-- direct REST call bypasses it. The triggers here are the actual limit.
--
-- Free tier is a permanent 20-garment cap, not a time limit (docs/DECISIONS.md).

create table public.entitlements (
  user_id        uuid primary key references public.profiles (id) on delete cascade,
  -- RevenueCat entitlement identifier; 'rail_full' is the paid tier.
  entitlement    text not null default 'free' check (entitlement in ('free', 'rail_full')),
  expires_at     timestamptz,
  trial_ends_at  timestamptz,
  -- Raw RevenueCat subscriber payload from the webhook, for debugging disputes.
  provider_state jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
select public.apply_touch_trigger('public.entitlements');

alter table public.entitlements enable row level security;

-- Read-only to the user. Writes come from the RevenueCat webhook via the
-- service role — a client that could write here could grant itself the paid tier.
create policy entitlements_read_own on public.entitlements
  for select to authenticated
  using (user_id = auth.uid());

create or replace function public.has_full_access(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.entitlements e
    where e.user_id = target_user
      and e.entitlement = 'rail_full'
      and (e.expires_at is null or e.expires_at > now())
  );
$$;

-- Free-tier limits. Mirrored in packages/core/src/config.ts ENTITLEMENTS —
-- if you change one, change both. They are duplicated rather than shared
-- because the database cannot import TypeScript and a limit that is only
-- checked in one place is not a limit.
create or replace function public.free_tier_limit(resource text)
returns integer
language sql
immutable
as $$
  select case resource
    when 'garments' then 20
    when 'outfits'  then 3
    when 'watches'  then 5
  end;
$$;

create or replace function public.enforce_free_tier_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resource text := tg_table_name;
  cap      integer := public.free_tier_limit(resource);
  used     integer;
begin
  if public.has_full_access(new.user_id) then
    return new;
  end if;

  -- Soft-deleted rows are invisible and don't count. Archived rows DO count:
  -- otherwise "archive everything" trivially bypasses the cap.
  if resource = 'garments' then
    select count(*) into used from public.garments
      where user_id = new.user_id and deleted_at is null;
  elsif resource = 'outfits' then
    select count(*) into used from public.outfits
      where user_id = new.user_id and deleted_at is null;
  else
    select count(*) into used from public.watches
      where user_id = new.user_id and active;
  end if;

  if used >= cap then
    -- P0001 with a stable message prefix; the client maps this to the paywall
    -- rather than showing a generic failure.
    raise exception 'free_tier_limit_reached: % (limit %)', resource, cap
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger enforce_free_tier before insert on public.garments
  for each row execute function public.enforce_free_tier_limit();

create trigger enforce_free_tier before insert on public.outfits
  for each row execute function public.enforce_free_tier_limit();

create trigger enforce_free_tier before insert on public.watches
  for each row execute function public.enforce_free_tier_limit();

-- Every user starts on free. Runs after the profile insert in handle_new_user.
create or replace function public.handle_new_user_entitlement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.entitlements (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_user_entitlement();
