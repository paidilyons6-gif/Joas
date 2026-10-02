-- Homepage photos + brand colours editable in Studio

alter table public.site_settings
  add column if not exists look jsonb not null default '{}'::jsonb;
