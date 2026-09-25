-- Homepage copy editable in Studio (JSONB on site_settings)
alter table public.site_settings
  add column if not exists copy jsonb not null default '{}'::jsonb;
