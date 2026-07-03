-- Storage buckets for admin-uploaded media.
-- `covers` = novel cover images (small, publicly readable)
-- `media`  = chapter video files (larger, publicly readable so mobile can stream)
-- Both are writable ONLY by admin / management via existing helper functions.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('covers', 'covers', true, 10485760,
    array['image/jpeg','image/png','image/webp','image/gif']),
  ('media',  'media',  true, 524288000,   -- 500 MB per file
    array['video/mp4','video/webm','video/quicktime','audio/mpeg','audio/mp4','audio/wav'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read (mobile app streams the video from a public URL)
drop policy if exists "public read covers" on storage.objects;
create policy "public read covers" on storage.objects
  for select using (bucket_id = 'covers');

drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');

-- Only admins/management can upload / update / delete
drop policy if exists "admin write covers" on storage.objects;
create policy "admin write covers" on storage.objects
  for all using (
    bucket_id = 'covers' and (public.is_admin() or public.is_management())
  ) with check (
    bucket_id = 'covers' and (public.is_admin() or public.is_management())
  );

drop policy if exists "admin write media" on storage.objects;
create policy "admin write media" on storage.objects
  for all using (
    bucket_id = 'media' and (public.is_admin() or public.is_management())
  ) with check (
    bucket_id = 'media' and (public.is_admin() or public.is_management())
  );
