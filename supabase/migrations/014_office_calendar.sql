-- The Office calendar: Becca posts LIVE sessions / deadlines, buyers see them.
-- Safe to re-run in Supabase SQL Editor.

create or replace function public.has_any_program()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select cardinality(programs) > 0 from public.profiles where id = auth.uid()),
    false
  );
$$;

create table if not exists public.office_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  duration_minutes int not null default 60,
  description text not null default '',
  link text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists office_events_starts_idx
  on public.office_events (starts_at);

alter table public.office_events enable row level security;

drop policy if exists "Buyers read events" on public.office_events;
create policy "Buyers read events"
  on public.office_events for select
  using (public.is_admin_user() or public.has_any_program());

drop policy if exists "Admins manage events" on public.office_events;
create policy "Admins manage events"
  on public.office_events for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

grant select, insert, update, delete on public.office_events to authenticated;

notify pgrst, 'reload schema';

select count(*) as events from public.office_events;
