-- Questions for Becca: same village_posts table, separate channel + threaded replies.
-- Safe to re-run in Supabase SQL Editor.

alter table public.village_posts
  add column if not exists channel text not null default 'office';

alter table public.village_posts
  add column if not exists reply_to uuid references public.village_posts (id) on delete cascade;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'village_posts_channel_check'
      and conrelid = 'public.village_posts'::regclass
  ) then
    alter table public.village_posts
      add constraint village_posts_channel_check
      check (channel in ('office', 'ask'));
  end if;
end $$;

-- Existing posts stay in The Office
update public.village_posts set channel = 'office' where channel is null or channel = '';

create index if not exists village_posts_channel_created_idx
  on public.village_posts (channel, pinned desc, created_at desc);

create index if not exists village_posts_reply_to_idx
  on public.village_posts (reply_to, created_at);

-- Replies are never pinned as top-level; keep pin only meaningful on questions / office posts
select
  (select count(*) from information_schema.columns
    where table_name = 'village_posts' and column_name = 'channel') as channel_column,
  (select count(*) from information_schema.columns
    where table_name = 'village_posts' and column_name = 'reply_to') as reply_to_column;
