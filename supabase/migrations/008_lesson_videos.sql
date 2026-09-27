-- Video URL per lesson (YouTube / Vimeo / Loom / direct file)

alter table public.course_lessons
  add column if not exists video_url text not null default '';
