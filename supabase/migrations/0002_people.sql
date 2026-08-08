-- 0002 — people: profiles, sizes, preferences.

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text,
  home_country  text not null default 'IE',   -- ISO 3166-1 alpha-2; drives duty rules
  currency      text not null default 'EUR',  -- ISO 4217
  timezone      text not null default 'Europe/Dublin',
  locale        text not null default 'en-IE',
  wake_time     time,                          -- daily suggestion push fires before this
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
select public.apply_touch_trigger('public.profiles');

-- One row per category group the user has a size in: tops/M/EU, shoes/44/EU.
-- `category_group` is a coarse bucket, not a categories.id — users think
-- "my shirt size", not "my oxford-shirt size".
create table public.user_sizes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  category_group text not null,
  size_label     text not null,
  region         text not null default 'EU',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, category_group, region)
);
select public.apply_touch_trigger('public.user_sizes');

create table public.user_prefs (
  user_id           uuid primary key references public.profiles (id) on delete cascade,

  -- Quiet hours as two local-hour bounds rather than a range type. Quiet hours
  -- normally wrap midnight (22:00–08:00), and int4range cannot express that at
  -- all — int4range(22, 8) is not an unusual range, it is a constraint violation
  -- that would fail every signup. Interpretation: quiet when
  -- start <= hour < end, or when start > end, quiet when hour >= start OR hour < end.
  quiet_hour_start  smallint not null default 22 check (quiet_hour_start between 0 and 23),
  quiet_hour_end    smallint not null default 8  check (quiet_hour_end between 0 and 23),

  alert_channels    jsonb not null default '{"push": true, "email": false}'::jsonb,
  alert_daily_cap   smallint not null default 3 check (alert_daily_cap between 0 and 20),
  min_discount_pct  smallint not null default 15 check (min_discount_pct between 0 and 100),
  formality_bias    smallint not null default 0 check (formality_bias between -2 and 2),
  palette_bias      text[] not null default '{}',                 -- preferred colour families
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
select public.apply_touch_trigger('public.user_prefs');

-- A profile and prefs row must exist the moment a user signs up, or the first
-- query after signup 404s and the client has to special-case it.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.user_prefs (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Whether a given local hour falls inside the user's quiet hours. A function
-- rather than inline SQL at each call site, because the wrap-around case is
-- exactly the sort of condition that gets written correctly once and then
-- copied wrongly.
create or replace function public.in_quiet_hours(
  local_hour smallint,
  start_hour smallint,
  end_hour smallint
)
returns boolean
language sql
immutable
strict
as $$
  select case
    when start_hour = end_hour then false                      -- no quiet period
    when start_hour < end_hour then local_hour >= start_hour and local_hour < end_hour
    else local_hour >= start_hour or local_hour < end_hour     -- wraps midnight
  end;
$$;
