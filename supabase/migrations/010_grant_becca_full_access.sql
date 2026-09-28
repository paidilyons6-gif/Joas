-- Ensure columns exist (safe if already applied), then grant Becca full access
-- Email: r.lyons1@icloud.com
-- Run this whole script in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists programs text[] not null default '{}';

alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles
  add column if not exists completed_lessons text[] not null default '{}';

-- Protect entitlements if trigger function is missing / outdated
create or replace function public.protect_profile_entitlements()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' and auth.uid() = old.id then
    new.plan := old.plan;
    if to_jsonb(new) ? 'stripe_customer_id' then
      new.stripe_customer_id := old.stripe_customer_id;
    end if;
    if to_jsonb(new) ? 'is_admin' then
      new.is_admin := old.is_admin;
    end if;
    if to_jsonb(new) ? 'programs' then
      new.programs := old.programs;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_entitlements on public.profiles;
create trigger protect_profile_entitlements
  before update on public.profiles
  for each row execute function public.protect_profile_entitlements();

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Grant Becca admin + full member unlock
insert into public.profiles (id, email, full_name, is_admin, programs)
select
  u.id,
  lower(u.email),
  coalesce(u.raw_user_meta_data->>'full_name', 'Becca'),
  true,
  array['full-access']::text[]
from auth.users u
where lower(u.email) = 'r.lyons1@icloud.com'
on conflict (id) do update
set
  email = excluded.email,
  is_admin = true,
  programs = (
    select coalesce(array_agg(distinct p), array['full-access']::text[])
    from unnest(
      coalesce(public.profiles.programs, '{}'::text[]) || array['full-access']::text[]
    ) as p
  ),
  updated_at = now();

update public.profiles
set
  is_admin = true,
  programs = (
    select coalesce(array_agg(distinct p), array['full-access']::text[])
    from unnest(
      coalesce(programs, '{}'::text[]) || array['full-access']::text[]
    ) as p
  ),
  updated_at = now()
where lower(email) = 'r.lyons1@icloud.com';

-- Confirm
select id, email, is_admin, programs, plan
from public.profiles
where lower(email) = 'r.lyons1@icloud.com';
