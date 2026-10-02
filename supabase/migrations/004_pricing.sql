-- Editable pricing labels + optional Stripe Price ID overrides (Studio)
alter table public.site_settings
  add column if not exists pricing jsonb not null default '{}'::jsonb;
