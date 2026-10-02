-- Coach ops: per-item LIVE flags for calculators/toolkit + pin posts in Business Meeting

alter table public.site_settings
  add column if not exists build jsonb not null default '{}'::jsonb;

alter table public.village_posts
  add column if not exists pinned boolean not null default false;

create index if not exists village_posts_pinned_created_idx
  on public.village_posts (pinned desc, created_at desc);
