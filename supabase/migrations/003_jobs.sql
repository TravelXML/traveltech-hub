-- TravelTech Hub - Jobs module
--
-- Job postings tied to an existing approved business listing (so "this
-- company is hiring" is well-defined), plus a built-in application system
-- (resume upload + employer-reviewed applicant status). Mirrors
-- public.news/public.events' RLS/RPC/trigger shape throughout (see
-- 002_news_events.sql) - jobs go through the same submit -> pending ->
-- admin-approval pipeline; applications are a separate, unmoderated
-- employer<->applicant flow gated purely by RLS.
--
-- Run this once against a project that already has 001_initial_schema.sql
-- and 002_news_events.sql applied, either via `supabase db push` or the SQL
-- Editor. Also apply the storage bucket additions in storage-setup.sql.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users (id) on delete set null,
  listing_id uuid not null references public.listings (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  category text not null check (
    category in ('Engineering', 'Management (MBA)', 'Hotel Management', 'Finance & Accounting', 'Account Management', 'Other')
  ),
  description text not null check (char_length(description) between 50 and 5000),
  employment_type text not null check (employment_type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  experience_level text check (experience_level in ('Entry-level', 'Mid-level', 'Senior-level', 'Executive')),
  location text not null check (char_length(location) between 1 and 200),
  remote boolean not null default false,
  salary_range text,
  -- Application deadline. Null = open until filled. Deliberately NOT a table
  -- CHECK against current_date - unlike news.published_date (which must not
  -- be in the future, an invariant true forever once satisfied), "closes_at
  -- must not be in the past" is only true at submission time and would make
  -- old rows fail re-validation as the date passes. Enforced in the RPCs.
  closes_at date,
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null
);

comment on column public.jobs.owner_id is 'The user who posted this job - always the owning listing''s owner (enforced by submit_job()).';
comment on column public.jobs.listing_id is 'Which company is hiring. Cannot be changed after creation (see protect_jobs_privileged_fields()).';

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  applicant_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 200),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text,
  cover_note text check (cover_note is null or char_length(cover_note) <= 3000),
  resume_path text not null,
  status text not null default 'submitted' check (status in ('submitted', 'reviewed', 'shortlisted', 'rejected', 'hired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);

comment on column public.job_applications.resume_path is 'Object path in the private "resumes" storage bucket, not a public URL.';

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_jobs_status on public.jobs (status);
create index idx_jobs_owner_id on public.jobs (owner_id);
create index idx_jobs_listing_id on public.jobs (listing_id);
create index idx_jobs_closes_at on public.jobs (closes_at);

create index idx_job_applications_job_id on public.job_applications (job_id);
create index idx_job_applications_applicant_id on public.job_applications (applicant_id);
create index idx_job_applications_status on public.job_applications (status);

-- ============================================================================
-- updated_at triggers (public.set_updated_at() is already generic - defined
-- in 001_initial_schema.sql, reused as-is here)
-- ============================================================================

create trigger set_jobs_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

create trigger set_job_applications_updated_at
  before update on public.job_applications
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Privileged-field protection trigger (mirrors
-- protect_news_privileged_fields(), plus a listing_id guard - a job can't be
-- reassigned to a different company after creation). job_applications needs
-- no equivalent trigger: neither side edits an application directly, only
-- its status changes, via update_application_status() below.
-- ============================================================================

create or replace function public.protect_jobs_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed' using errcode = '42501';
  end if;
  if new.listing_id is distinct from old.listing_id then
    raise exception 'listing_id cannot be changed' using errcode = '42501';
  end if;
  if new.approved_by is distinct from old.approved_by then
    raise exception 'approved_by can only be set by an administrator' using errcode = '42501';
  end if;
  if new.approved_at is distinct from old.approved_at then
    raise exception 'approved_at can only be set by an administrator' using errcode = '42501';
  end if;
  if new.status in ('approved', 'archived') and old.status is distinct from new.status then
    raise exception 'only an administrator can set this status' using errcode = '42501';
  end if;
  if new.rejection_reason is not null and new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'rejection_reason can only be set by an administrator' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger jobs_protect_privileged_fields
  before update on public.jobs
  for each row execute function public.protect_jobs_privileged_fields();

-- ============================================================================
-- RPCs: job submission, editing and moderation
-- ============================================================================

create or replace function public.submit_job(payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_listing_id uuid;
  v_title text;
  v_category text;
  v_description text;
  v_employment_type text;
  v_experience_level text;
  v_location text;
  v_closes_at date;
  v_job_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_listing_id := nullif(payload ->> 'listingId', '')::uuid;
  v_title := trim(payload ->> 'title');
  v_category := payload ->> 'category';
  v_description := trim(payload ->> 'description');
  v_employment_type := payload ->> 'employmentType';
  v_experience_level := nullif(payload ->> 'experienceLevel', '');
  v_location := trim(payload ->> 'location');
  v_closes_at := nullif(payload ->> 'closesAt', '')::date;

  if v_listing_id is null then
    raise exception 'A company listing is required' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.listings l where l.id = v_listing_id and l.owner_id = v_uid and l.status = 'approved'
  ) then
    raise exception 'You can only post jobs for your own approved business listings' using errcode = '42501';
  end if;
  if v_title is null or char_length(v_title) < 1 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if v_category is null or v_category not in
    ('Engineering', 'Management (MBA)', 'Hotel Management', 'Finance & Accounting', 'Account Management', 'Other') then
    raise exception 'Unknown category' using errcode = '22023';
  end if;
  if v_description is null or char_length(v_description) < 50 then
    raise exception 'Description must be at least 50 characters' using errcode = '22023';
  end if;
  if v_employment_type is null or v_employment_type not in ('Full-time', 'Part-time', 'Contract', 'Internship') then
    raise exception 'Unknown employment type' using errcode = '22023';
  end if;
  if v_experience_level is not null and v_experience_level not in
    ('Entry-level', 'Mid-level', 'Senior-level', 'Executive') then
    raise exception 'Unknown experience level' using errcode = '22023';
  end if;
  if v_location is null or char_length(v_location) < 1 then
    raise exception 'Location is required' using errcode = '22023';
  end if;
  if v_closes_at is not null and v_closes_at < current_date then
    raise exception 'Application deadline cannot be in the past' using errcode = '22023';
  end if;

  insert into public.jobs (
    owner_id, listing_id, title, category, description, employment_type, experience_level,
    location, remote, salary_range, closes_at, status, submitted_at
  ) values (
    v_uid, v_listing_id, v_title, v_category, v_description, v_employment_type, v_experience_level,
    v_location, coalesce((payload ->> 'remote')::boolean, false), nullif(trim(payload ->> 'salaryRange'), ''),
    v_closes_at, 'pending', now()
  )
  returning jobs.id into v_job_id;

  return query select v_job_id, 'pending'::text;
end;
$$;

revoke execute on function public.submit_job(jsonb) from public;
grant execute on function public.submit_job(jsonb) to authenticated;

create or replace function public.update_my_job(p_id uuid, payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text;
  v_category text;
  v_description text;
  v_employment_type text;
  v_experience_level text;
  v_location text;
  v_closes_at date;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.jobs j
    where j.id = p_id and j.owner_id = v_uid and j.status in ('draft', 'pending', 'rejected')
  ) then
    raise exception 'Job not found or not editable' using errcode = '42501';
  end if;

  v_title := trim(payload ->> 'title');
  v_category := payload ->> 'category';
  v_description := trim(payload ->> 'description');
  v_employment_type := payload ->> 'employmentType';
  v_experience_level := nullif(payload ->> 'experienceLevel', '');
  v_location := trim(payload ->> 'location');
  v_closes_at := nullif(payload ->> 'closesAt', '')::date;

  if v_title is null or char_length(v_title) < 1 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if v_category is null or v_category not in
    ('Engineering', 'Management (MBA)', 'Hotel Management', 'Finance & Accounting', 'Account Management', 'Other') then
    raise exception 'Unknown category' using errcode = '22023';
  end if;
  if v_description is null or char_length(v_description) < 50 then
    raise exception 'Description must be at least 50 characters' using errcode = '22023';
  end if;
  if v_employment_type is null or v_employment_type not in ('Full-time', 'Part-time', 'Contract', 'Internship') then
    raise exception 'Unknown employment type' using errcode = '22023';
  end if;
  if v_experience_level is not null and v_experience_level not in
    ('Entry-level', 'Mid-level', 'Senior-level', 'Executive') then
    raise exception 'Unknown experience level' using errcode = '22023';
  end if;
  if v_location is null or char_length(v_location) < 1 then
    raise exception 'Location is required' using errcode = '22023';
  end if;
  if v_closes_at is not null and v_closes_at < current_date then
    raise exception 'Application deadline cannot be in the past' using errcode = '22023';
  end if;

  update public.jobs set
    title = v_title,
    category = v_category,
    description = v_description,
    employment_type = v_employment_type,
    experience_level = v_experience_level,
    location = v_location,
    remote = coalesce((payload ->> 'remote')::boolean, false),
    salary_range = nullif(trim(payload ->> 'salaryRange'), ''),
    closes_at = v_closes_at
  where public.jobs.id = p_id;

  return query select j.id, j.status from public.jobs j where j.id = p_id;
end;
$$;

revoke execute on function public.update_my_job(uuid, jsonb) from public;
grant execute on function public.update_my_job(uuid, jsonb) to authenticated;

create or replace function public.resubmit_job(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs
  set status = 'pending', rejection_reason = null, submitted_at = now()
  where id = p_id and owner_id = auth.uid() and status = 'rejected';

  if not found then
    raise exception 'Job not found or not eligible for resubmission' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.resubmit_job(uuid) from public;
grant execute on function public.resubmit_job(uuid) to authenticated;

create or replace function public.approve_job(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can approve jobs' using errcode = '42501';
  end if;

  update public.jobs
  set status = 'approved', approved_by = auth.uid(), approved_at = now(), rejection_reason = null
  where id = p_id;

  if not found then
    raise exception 'Job not found';
  end if;
end;
$$;

revoke execute on function public.approve_job(uuid) from public;
grant execute on function public.approve_job(uuid) to authenticated;

create or replace function public.reject_job(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can reject jobs' using errcode = '42501';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A rejection reason is required' using errcode = '22023';
  end if;

  update public.jobs set status = 'rejected', rejection_reason = trim(p_reason) where id = p_id;

  if not found then
    raise exception 'Job not found';
  end if;
end;
$$;

revoke execute on function public.reject_job(uuid, text) from public;
grant execute on function public.reject_job(uuid, text) to authenticated;

create or replace function public.archive_job(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can archive jobs' using errcode = '42501';
  end if;

  update public.jobs set status = 'archived' where id = p_id;

  if not found then
    raise exception 'Job not found';
  end if;
end;
$$;

revoke execute on function public.archive_job(uuid) from public;
grant execute on function public.archive_job(uuid) to authenticated;

-- ============================================================================
-- RPCs: applications
-- ============================================================================

create or replace function public.submit_application(payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_job_id uuid;
  v_full_name text;
  v_email text;
  v_resume_path text;
  v_job public.jobs%rowtype;
  v_application_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_job_id := nullif(payload ->> 'jobId', '')::uuid;
  v_full_name := trim(payload ->> 'fullName');
  v_email := trim(payload ->> 'email');
  v_resume_path := payload ->> 'resumePath';

  if v_job_id is null then
    raise exception 'A job is required' using errcode = '22023';
  end if;

  select * into v_job from public.jobs where id = v_job_id;
  if not found or v_job.status <> 'approved' then
    raise exception 'This job is no longer accepting applications' using errcode = '22023';
  end if;
  if v_job.closes_at is not null and v_job.closes_at < current_date then
    raise exception 'This job is no longer accepting applications' using errcode = '22023';
  end if;

  if exists (select 1 from public.job_applications where job_id = v_job_id and applicant_id = v_uid) then
    raise exception 'You have already applied to this job' using errcode = '22023';
  end if;

  if v_full_name is null or char_length(v_full_name) < 1 then
    raise exception 'Full name is required' using errcode = '22023';
  end if;
  if v_email is null or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email is required' using errcode = '22023';
  end if;
  if v_resume_path is null or char_length(v_resume_path) < 1 then
    raise exception 'A resume is required' using errcode = '22023';
  end if;

  insert into public.job_applications (
    job_id, applicant_id, full_name, email, phone, cover_note, resume_path, status
  ) values (
    v_job_id, v_uid, v_full_name, v_email, nullif(trim(payload ->> 'phone'), ''),
    nullif(trim(payload ->> 'coverNote'), ''), v_resume_path, 'submitted'
  )
  returning job_applications.id into v_application_id;

  return query select v_application_id, 'submitted'::text;
end;
$$;

revoke execute on function public.submit_application(jsonb) from public;
grant execute on function public.submit_application(jsonb) to authenticated;

create or replace function public.update_application_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('submitted', 'reviewed', 'shortlisted', 'rejected', 'hired') then
    raise exception 'Unknown status' using errcode = '22023';
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.job_applications ja
    join public.jobs j on j.id = ja.job_id
    join public.listings l on l.id = j.listing_id
    where ja.id = p_id and l.owner_id = auth.uid()
  ) then
    raise exception 'You can only manage applications for your own job postings' using errcode = '42501';
  end if;

  update public.job_applications set status = p_status where id = p_id;

  if not found then
    raise exception 'Application not found';
  end if;
end;
$$;

revoke execute on function public.update_application_status(uuid, text) from public;
grant execute on function public.update_application_status(uuid, text) to authenticated;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.jobs enable row level security;
alter table public.job_applications enable row level security;

-- jobs -------------------------------------------------------------

create policy jobs_select_approved on public.jobs
  for select using (status = 'approved');

create policy jobs_select_owner on public.jobs
  for select using (owner_id = auth.uid());

create policy jobs_select_admin on public.jobs
  for select using (public.is_admin());

create policy jobs_insert_owner on public.jobs
  for insert with check (
    owner_id = auth.uid()
    and status in ('draft', 'pending')
    and approved_by is null
    and approved_at is null
  );

create policy jobs_update_owner on public.jobs
  for update
  using (owner_id = auth.uid() and status in ('draft', 'pending', 'rejected'))
  with check (owner_id = auth.uid());

create policy jobs_update_admin on public.jobs
  for update using (public.is_admin()) with check (public.is_admin());

create policy jobs_delete_admin on public.jobs
  for delete using (public.is_admin());

-- job_applications -------------------------------------------------------------

create policy applications_select_applicant on public.job_applications
  for select using (applicant_id = auth.uid());

create policy applications_select_employer on public.job_applications
  for select using (
    exists (
      select 1 from public.jobs j
      join public.listings l on l.id = j.listing_id
      where j.id = job_applications.job_id and l.owner_id = auth.uid()
    )
  );

create policy applications_select_admin on public.job_applications
  for select using (public.is_admin());

create policy applications_insert_applicant on public.job_applications
  for insert with check (applicant_id = auth.uid());

create policy applications_update_employer on public.job_applications
  for update
  using (
    exists (
      select 1 from public.jobs j
      join public.listings l on l.id = j.listing_id
      where j.id = job_applications.job_id and l.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.jobs j
      join public.listings l on l.id = j.listing_id
      where j.id = job_applications.job_id and l.owner_id = auth.uid()
    )
  );

create policy applications_update_admin on public.job_applications
  for update using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Table grants (RLS policies above still govern actual row-level access)
-- ============================================================================

grant select, insert, update, delete on public.jobs to authenticated;
grant select on public.jobs to anon;

grant select, insert, update on public.job_applications to authenticated;
