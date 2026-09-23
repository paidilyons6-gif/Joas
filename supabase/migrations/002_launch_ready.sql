-- Launch-ready schema for Business by Becca

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

update public.profiles
set is_admin = true
where lower(email) = 'r.lyons1@icloud.com';

-- Members can update own profile EXCEPT plan / stripe / is_admin (enforced via trigger)
create or replace function public.protect_profile_entitlements()
returns trigger
language plpgsql
as $$
begin
  if auth.role() = 'authenticated' and auth.uid() = old.id then
    new.plan := old.plan;
    new.stripe_customer_id := old.stripe_customer_id;
    new.is_admin := old.is_admin;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_entitlements on public.profiles;
create trigger protect_profile_entitlements
  before update on public.profiles
  for each row execute function public.protect_profile_entitlements();

-- Course CMS
create table if not exists public.course_tracks (
  id text primary key,
  title text not null,
  blurb text not null default '',
  badge text not null default 'Office course',
  members_only boolean not null default true,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id text primary key,
  track_id text not null references public.course_tracks (id) on delete cascade,
  title text not null,
  duration int not null default 10,
  members_only boolean not null default true,
  objectives text[] not null default '{}',
  sections jsonb not null default '[]',
  action text not null default '',
  worksheet_prompt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_lessons_track_idx on public.course_lessons (track_id, sort_order);

alter table public.course_tracks enable row level security;
alter table public.course_lessons enable row level security;

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

drop policy if exists "Anyone can read published tracks" on public.course_tracks;
create policy "Anyone can read published tracks"
  on public.course_tracks for select
  using (published = true or public.is_admin_user());

drop policy if exists "Admins manage tracks" on public.course_tracks;
create policy "Admins manage tracks"
  on public.course_tracks for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "Anyone can read lessons of visible tracks" on public.course_lessons;
create policy "Anyone can read lessons of visible tracks"
  on public.course_lessons for select
  using (
    exists (
      select 1 from public.course_tracks t
      where t.id = track_id and (t.published = true or public.is_admin_user())
    )
  );

drop policy if exists "Admins manage lessons" on public.course_lessons;
create policy "Admins manage lessons"
  on public.course_lessons for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- Site settings (nav topics)
create table if not exists public.site_settings (
  id text primary key default 'main',
  nav jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id, nav)
values ('main', '{"home":true,"courses":true,"vault":true,"calculators":true,"toolkit":true,"office":true,"studio":true,"account":true}'::jsonb)
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

-- User drafts (tools, calcs, lesson notes)
create table if not exists public.user_drafts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  tool_drafts jsonb not null default '{}'::jsonb,
  calc_state jsonb not null default '{}'::jsonb,
  lesson_notes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_drafts enable row level security;

drop policy if exists "Users manage own drafts" on public.user_drafts;
create policy "Users manage own drafts"
  on public.user_drafts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Office community feed (table name retained for compatibility)
create table if not exists public.village_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists village_posts_created_idx on public.village_posts (created_at desc);

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
