-- TravelTech Hub - expand job categories from 6 to 26
--
-- 003_jobs.sql shipped with a narrow starter set (Engineering, Management
-- (MBA), Hotel Management, Finance & Accounting, Account Management,
-- Other). This adds 20 more categories covering the rest of a typical
-- travel-tech company's org chart. Run after 003_jobs.sql.
--
-- The category list lives in three places that all have to move together:
-- the table's CHECK constraint, and the same validation list duplicated
-- inside submit_job() and update_my_job() (Postgres function bodies aren't
-- declarative against the table constraint, so they re-check it
-- themselves). Existing rows are unaffected - their category values are
-- already within the new, larger set.

alter table public.jobs drop constraint if exists jobs_category_check;
alter table public.jobs add constraint jobs_category_check check (
  category in (
    'Engineering', 'Product Management', 'Data Science & Analytics', 'Management (MBA)',
    'Sales & Business Development', 'Marketing', 'Customer Success & Support', 'Hotel Management',
    'Revenue Management', 'Finance & Accounting', 'Account Management', 'Human Resources',
    'Legal & Compliance', 'Operations', 'Supply Chain & Procurement', 'UX/UI Design',
    'Quality Assurance', 'DevOps & Infrastructure', 'Cybersecurity', 'IT & Technical Support',
    'Partnerships & Alliances', 'Content & Editorial', 'Travel Consultant / Agent',
    'Project & Program Management', 'Executive Leadership', 'Other'
  )
);

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
  if v_category is null or v_category not in (
    'Engineering', 'Product Management', 'Data Science & Analytics', 'Management (MBA)',
    'Sales & Business Development', 'Marketing', 'Customer Success & Support', 'Hotel Management',
    'Revenue Management', 'Finance & Accounting', 'Account Management', 'Human Resources',
    'Legal & Compliance', 'Operations', 'Supply Chain & Procurement', 'UX/UI Design',
    'Quality Assurance', 'DevOps & Infrastructure', 'Cybersecurity', 'IT & Technical Support',
    'Partnerships & Alliances', 'Content & Editorial', 'Travel Consultant / Agent',
    'Project & Program Management', 'Executive Leadership', 'Other'
  ) then
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
  if v_category is null or v_category not in (
    'Engineering', 'Product Management', 'Data Science & Analytics', 'Management (MBA)',
    'Sales & Business Development', 'Marketing', 'Customer Success & Support', 'Hotel Management',
    'Revenue Management', 'Finance & Accounting', 'Account Management', 'Human Resources',
    'Legal & Compliance', 'Operations', 'Supply Chain & Procurement', 'UX/UI Design',
    'Quality Assurance', 'DevOps & Infrastructure', 'Cybersecurity', 'IT & Technical Support',
    'Partnerships & Alliances', 'Content & Editorial', 'Travel Consultant / Agent',
    'Project & Program Management', 'Executive Leadership', 'Other'
  ) then
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
