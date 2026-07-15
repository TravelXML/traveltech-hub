-- TravelTech Hub - Storage bucket setup for vendor logos
--
-- Run after 001_initial_schema.sql (paste into the SQL Editor, or via
-- `supabase db push` if you keep this file under supabase/migrations -
-- see docs/supabase-setup.md). Bucket creation can equally be done by hand
-- in Dashboard -> Storage -> New bucket; this file just makes the whole
-- setup scriptable and repeatable.
--
-- Upload path convention (enforced by the policies below, not just
-- convention): {auth.uid()}/{listing_id}/{unique-file-name}
-- storage.foldername(name) splits an object path into its segments, so
-- foldername(name)[1] is always the uploader's own user id.
--
-- The bucket is public-read: logos have no sensitive content, filenames
-- are random/collision-resistant (see src/services/storageService.js), and
-- pending/rejected listings' logos are never linked from the public UI even
-- though the file itself would be fetchable by anyone who already has the
-- exact URL. This tradeoff is documented in docs/security-review.md.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-logos',
  'vendor-logos',
  true,
  2097152, -- 2 MB
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy vendor_logos_public_read
  on storage.objects for select
  using (bucket_id = 'vendor-logos');

create policy vendor_logos_owner_insert
  on storage.objects for insert
  with check (
    bucket_id = 'vendor-logos'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy vendor_logos_owner_update
  on storage.objects for update
  using (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy vendor_logos_owner_delete
  on storage.objects for delete
  using (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy vendor_logos_admin_all
  on storage.objects for all
  using (bucket_id = 'vendor-logos' and public.is_admin())
  with check (bucket_id = 'vendor-logos' and public.is_admin());
