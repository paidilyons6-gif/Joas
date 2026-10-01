-- Bootstrap missing tables for The Office coach features.
-- Safe to re-run. Paste whole file into Supabase → SQL Editor → Run.

-- 1) Profiles (needed for admin checks)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  full_name text,
  plan text not null default 'none' check (plan in ('none', 'monthly', 'annual')),
  completed_lessons text[] not null default '{}',
  stripe_customer_id text,
  is_admin boolean not null default false,
  programs text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false;
alter table public.profiles
  add column if not exists programs text[] not null default '{}';
alter table public.profiles
  add column if not exists completed_lessons text[] not null default '{}';
alter table public.profiles
  add column if not exists stripe_customer_id text;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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

-- 2) Site settings (nav, homepage copy/look, calculator/toolkit LIVE flags)
create table if not exists public.site_settings (
  id text primary key default 'main',
  nav jsonb not null default '{}'::jsonb,
  copy jsonb not null default '{}'::jsonb,
  look jsonb not null default '{}'::jsonb,
  build jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings
  add column if not exists copy jsonb not null default '{}'::jsonb;
alter table public.site_settings
  add column if not exists look jsonb not null default '{}'::jsonb;
alter table public.site_settings
  add column if not exists build jsonb not null default '{}'::jsonb;

insert into public.site_settings (id, nav)
values (
  'main',
  '{"home":true,"courses":true,"vault":true,"calculators":true,"toolkit":true,"office":true,"studio":true,"account":true}'::jsonb
)
on conflict (id) do nothing;

alter table public.site_settings enable row level security;

drop policy if exists "Anyone can read settings" on public.site_settings;
create policy "Anyone can read settings"
  on public.site_settings for select
  using (true);

drop policy if exists "Admins update settings" on public.site_settings;
create policy "Admins update settings"
  on public.site_settings for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Admins insert settings" on public.site_settings;
create policy "Admins insert settings"
  on public.site_settings for insert
  with check (public.is_admin_user());

-- 3) Business Meeting / The Office posts (+ pin)
create table if not exists public.village_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.village_posts
  add column if not exists pinned boolean not null default false;

create index if not exists village_posts_created_idx
  on public.village_posts (created_at desc);
create index if not exists village_posts_pinned_created_idx
  on public.village_posts (pinned desc, created_at desc);

alter table public.village_posts enable row level security;

drop policy if exists "Members read village" on public.village_posts;
create policy "Members read village"
  on public.village_posts for select
  using (auth.role() = 'authenticated');

drop policy if exists "Members create village posts" on public.village_posts;
create policy "Members create village posts"
  on public.village_posts for insert
  with check (auth.uid() = author_id);

drop policy if exists "Authors or admins delete posts" on public.village_posts;
create policy "Authors or admins delete posts"
  on public.village_posts for delete
  using (auth.uid() = author_id or public.is_admin_user());

drop policy if exists "Admins update village posts" on public.village_posts;
create policy "Admins update village posts"
  on public.village_posts for update
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- 4) Make Becca admin
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
  programs = array['full-access']::text[],
  updated_at = now();

-- Confirm
select id, email, is_admin, programs
from public.profiles
where lower(email) = 'r.lyons1@icloud.com';
