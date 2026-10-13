-- Comped / off-Stripe access: Becca lists emails, they get the program as soon
-- as they sign up (or immediately if they already have an account).
-- Safe to re-run in Supabase SQL Editor.

create table if not exists public.program_grants (
  email text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  primary key (email, slug)
);

alter table public.program_grants enable row level security;

drop policy if exists "Admins manage grants" on public.program_grants;
create policy "Admins manage grants"
  on public.program_grants for all
  using (public.is_admin_user())
  with check (public.is_admin_user());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, programs)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(
      (select array_agg(distinct g.slug) from public.program_grants g
       where g.email = lower(new.email)),
      '{}'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

insert into public.program_grants (email, slug) values
  ('avrilk@live.co.uk', 'seen-heard-earn'),
  ('sam.bstevenson@gmail.com', 'seen-heard-earn'),
  ('laylahealywc@outlook.com', 'seen-heard-earn'),
  ('courtneybrennan666@gmail.com', 'seen-heard-earn'),
  ('lkirwan10@gmail.com', 'seen-heard-earn'),
  ('chauntellemf99@gmail.com', 'seen-heard-earn'),
  ('aislingmannion112@gmail.com', 'seen-heard-earn'),
  ('beckyloughnane1@gmail.com', 'seen-heard-earn'),
  ('ciaraoshea1234@icloud.com', 'seen-heard-earn'),
  ('megan.ramsbottom99@gmail.com', 'seen-heard-earn'),
  ('alannahharrigan@gmail.com', 'seen-heard-earn'),
  ('erikastulgaityte55@gmail.com', 'seen-heard-earn'),
  ('eilishannharrington@gmail.com', 'seen-heard-earn'),
  ('zaraeashe@gmail.com', 'seen-heard-earn')
on conflict do nothing;

-- Anyone on the list who already has an account gets it now
update public.profiles p
set programs = array(select distinct unnest(p.programs || array[g.slug]))
from public.program_grants g
where g.email = lower(p.email)
  and not (g.slug = any(p.programs));

select g.email,
       case when p.id is null then 'unlocks when they sign up'
            else 'unlocked now' end as status
from public.program_grants g
left join public.profiles p on lower(p.email) = g.email
order by status, g.email;
