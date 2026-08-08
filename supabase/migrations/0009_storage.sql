-- 0009 — image storage.
--
-- Wardrobe photos are personal data (spec §7 GDPR): a private bucket, signed
-- URLs only, never public. The bucket is created private and the policies below
-- scope every object to a path prefix of the owner's uid.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'garments',
  'garments',
  false,
  15728640,  -- 15 MB; camera originals are resized client-side before upload
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Object keys are `<uid>/<garment_id>/<variant>.webp`. The uid prefix is what
-- the policies check, so it must be the first path segment.
create policy garment_images_read_own on storage.objects
  for select to authenticated
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy garment_images_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy garment_images_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);

create policy garment_images_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
