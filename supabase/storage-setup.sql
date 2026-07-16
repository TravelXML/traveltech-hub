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

-- create policy has no `or replace`/`if not exists` (unlike the bucket
-- insert above). A plain `drop policy if exists` immediately before each
-- create is enough for a normal re-run, but each pair is also wrapped in a
-- do block that swallows 42710 (duplicate_object) - belt and braces against
-- the drop+create not being atomic (e.g. the SQL Editor's "Run" firing
-- twice, or resubmitting after a timeout) - so this file is safe to paste
-- and re-run under any circumstances.

do $$ begin
  drop policy if exists vendor_logos_public_read on storage.objects;
  create policy vendor_logos_public_read
    on storage.objects for select
    using (bucket_id = 'vendor-logos');
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists vendor_logos_owner_insert on storage.objects;
  create policy vendor_logos_owner_insert
    on storage.objects for insert
    with check (
      bucket_id = 'vendor-logos'
      and auth.role() = 'authenticated'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists vendor_logos_owner_update on storage.objects;
  create policy vendor_logos_owner_update
    on storage.objects for update
    using (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text)
    with check (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists vendor_logos_owner_delete on storage.objects;
  create policy vendor_logos_owner_delete
    on storage.objects for delete
    using (bucket_id = 'vendor-logos' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists vendor_logos_admin_all on storage.objects;
  create policy vendor_logos_admin_all
    on storage.objects for all
    using (bucket_id = 'vendor-logos' and public.is_admin())
    with check (bucket_id = 'vendor-logos' and public.is_admin());
exception when duplicate_object then null;
end $$;

-- ============================================================================
-- Storage bucket setup for job application resumes
--
-- Unlike vendor-logos, this bucket is PRIVATE: resumes are personal data.
-- Upload path convention: {auth.uid()}/{unique-file-name} (same
-- storage.foldername(name)[1] trick as vendor-logos, one level shallower
-- since resumes aren't scoped to a specific listing/job at upload time).
-- Reading requires either being the uploader, or being the owner of the
-- listing behind the job an application (referencing this file) was
-- submitted to - see resumes_employer_read below. No public-read policy.
--
-- IMPORTANT: apply supabase/migrations/003_jobs.sql BEFORE this section -
-- resumes_employer_read references public.job_applications/jobs/listings,
-- which won't exist yet otherwise.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  5242880, -- 5 MB
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  drop policy if exists resumes_owner_insert on storage.objects;
  create policy resumes_owner_insert
    on storage.objects for insert
    with check (
      bucket_id = 'resumes'
      and auth.role() = 'authenticated'
      and (storage.foldername(name))[1] = auth.uid()::text
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists resumes_owner_read on storage.objects;
  create policy resumes_owner_read
    on storage.objects for select
    using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists resumes_owner_delete on storage.objects;
  create policy resumes_owner_delete
    on storage.objects for delete
    using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists resumes_employer_read on storage.objects;
  create policy resumes_employer_read
    on storage.objects for select
    using (
      bucket_id = 'resumes'
      and exists (
        select 1
        from public.job_applications ja
        join public.jobs j on j.id = ja.job_id
        join public.listings l on l.id = j.listing_id
        where ja.resume_path = storage.objects.name and l.owner_id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

do $$ begin
  drop policy if exists resumes_admin_all on storage.objects;
  create policy resumes_admin_all
    on storage.objects for all
    using (bucket_id = 'resumes' and public.is_admin())
    with check (bucket_id = 'resumes' and public.is_admin());
exception when duplicate_object then null;
end $$;
