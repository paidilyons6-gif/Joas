-- Launch waitlist emails (announce list)

create table if not exists public.waitlist_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  source text not null default 'gate',
  created_at timestamptz not null default now()
);

alter table public.waitlist_emails enable row level security;

-- RLS on with zero policies = deny all for anon/authenticated.
-- Inserts/reads go through Netlify service role only.
