-- Per-program entitlements (buy a program → unlock it)
alter table public.profiles
  add column if not exists programs text[] not null default '{}';
