-- Grant Becca full admin + member access (run in Supabase SQL editor)
-- Email: r.lyons1@icloud.com
--
-- is_admin  → Studio / admin CMS
-- programs  → unlocks courses, toolkit, calculators, Business Meeting
--             (including while "View as client" is on — she looks like a buyer who owns access)

-- 1) Ensure profile row exists from auth.users, then grant admin + entitlement
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

-- 2) Belt-and-braces update if the row was created by a different path
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

-- 3) Confirm
select id, email, is_admin, programs, plan
from public.profiles
where lower(email) = 'r.lyons1@icloud.com';
