-- Photos and Bunny video links on The Office posts.
-- Safe to re-run in Supabase SQL Editor.

-- 1) Posts can carry up to 4 photos and/or a video link; photo-only or video-only is allowed
alter table public.village_posts
  add column if not exists images text[] not null default '{}';

alter table public.village_posts
  add column if not exists video_url text not null default '';

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.village_posts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%body%'
  loop
    execute format('alter table public.village_posts drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.village_posts
  add constraint village_posts_body_or_media check (
    char_length(body) <= 2000
    and cardinality(images) <= 4
    and char_length(video_url) <= 2000
    and (
      char_length(body) >= 1
      or cardinality(images) >= 1
      or char_length(video_url) >= 1
    )
  );

-- 2) Private photo bucket: 10 MB per photo, images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'office-photos',
  'office-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Signed-in users can view photos (same audience that can read posts)
drop policy if exists "Office photos readable by signed-in users" on storage.objects;
create policy "Office photos readable by signed-in users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'office-photos');

-- Members upload only into their own folder: <user id>/<file>
drop policy if exists "Members upload office photos" on storage.objects;
create policy "Members upload office photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'office-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (public.has_any_program() or public.is_admin_user())
  );

-- The person who posted it, or the coach, can delete
drop policy if exists "Owners or admins delete office photos" on storage.objects;
create policy "Owners or admins delete office photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'office-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin_user()
    )
  );

select
  (select count(*) from information_schema.columns
    where table_name = 'village_posts' and column_name = 'images') as images_column,
  (select count(*) from information_schema.columns
    where table_name = 'village_posts' and column_name = 'video_url') as video_url_column,
  (select count(*) from storage.buckets where id = 'office-photos') as photo_bucket;
