-- Course CMS tables + seed Seen. Heard. Earn. workshop track
-- Safe to re-run in Supabase SQL Editor.

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

create table if not exists public.course_tracks (
  id text primary key,
  title text not null,
  blurb text not null default '',
  badge text not null default 'Member course',
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
  video_url text not null default '',
  objectives text[] not null default '{}',
  sections jsonb not null default '[]',
  action text not null default '',
  worksheet_prompt text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.course_lessons
  add column if not exists video_url text not null default '';

create index if not exists course_lessons_track_idx
  on public.course_lessons (track_id, sort_order);

alter table public.course_tracks enable row level security;
alter table public.course_lessons enable row level security;

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

-- Seed Seen. Heard. Earn. (published; portal still gates until Oct 14 for buyers)
insert into public.course_tracks (
  id, title, blurb, badge, members_only, published, sort_order, updated_at
) values (
  'seen-heard-earn',
  'Seen. Heard. Earn.',
  'Your 3-day brand workshop — lifetime access in The Office. Opens October 14th.',
  '3-day workshop',
  true,
  true,
  0,
  now()
)
on conflict (id) do update set
  title = excluded.title,
  blurb = excluded.blurb,
  badge = excluded.badge,
  members_only = excluded.members_only,
  published = excluded.published,
  updated_at = now();

insert into public.course_lessons (
  id, track_id, title, duration, members_only, video_url,
  objectives, sections, action, worksheet_prompt, sort_order, updated_at
) values
(
  'she-day-1',
  'seen-heard-earn',
  'Day 1 — Seen.',
  45,
  true,
  '',
  array['Get clear on how you want to be seen as a brand'],
  '[{"heading":"Welcome to Day 1","body":"Today we get you Seen. — the brand presence that makes people stop scrolling and pay attention. Becca will add the full teaching and video here before October 14."}]'::jsonb,
  'Write one sentence that says who you help and what they walk away with.',
  'Brand visibility notes…',
  0,
  now()
),
(
  'she-day-2',
  'seen-heard-earn',
  'Day 2 — Heard.',
  45,
  true,
  '',
  array['Shape a message people actually remember'],
  '[{"heading":"Welcome to Day 2","body":"Today we get you Heard. — voice, offer language, and the words that convert. Full lesson content lands before October 14."}]'::jsonb,
  'Draft your core offer paragraph out loud, then tighten it.',
  'Message and offer notes…',
  1,
  now()
),
(
  'she-day-3',
  'seen-heard-earn',
  'Day 3 — Earn.',
  45,
  true,
  '',
  array['Connect your brand to paid opportunities'],
  '[{"heading":"Welcome to Day 3","body":"Today we get you Earn. — pricing confidence and the path from attention to income. Full lesson content lands before October 14."}]'::jsonb,
  'Write your next paid ask and who you will send it to this week.',
  'Earn plan notes…',
  2,
  now()
)
on conflict (id) do update set
  title = excluded.title,
  duration = excluded.duration,
  objectives = excluded.objectives,
  sections = excluded.sections,
  action = excluded.action,
  worksheet_prompt = excluded.worksheet_prompt,
  sort_order = excluded.sort_order,
  updated_at = now();
