-- Likes on The Office (and Ask Becca) posts + comments.
-- Safe to re-run in Supabase SQL Editor.

create table if not exists public.village_likes (
  post_id uuid not null references public.village_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists village_likes_post_idx
  on public.village_likes (post_id);

create index if not exists village_likes_user_idx
  on public.village_likes (user_id);

alter table public.village_likes enable row level security;

drop policy if exists "Members read likes" on public.village_likes;
create policy "Members read likes"
  on public.village_likes for select
  to authenticated
  using (true);

drop policy if exists "Members like posts" on public.village_likes;
create policy "Members like posts"
  on public.village_likes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (public.has_any_program() or public.is_admin_user())
  );

drop policy if exists "Members unlike their likes" on public.village_likes;
create policy "Members unlike their likes"
  on public.village_likes for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin_user());

grant select, insert, delete on public.village_likes to authenticated;

select count(*) as likes_table
from information_schema.tables
where table_schema = 'public' and table_name = 'village_likes';
