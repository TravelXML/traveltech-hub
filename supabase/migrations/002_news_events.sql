-- TravelTech Hub - News & Events submission + moderation
--
-- Converts the static news.json/events.json into database-backed content
-- with the same submission -> pending -> admin-approval pipeline listings
-- already have. Mirrors public.listings' RLS/RPC/trigger shape throughout
-- (see 001_initial_schema.sql) - no child tables needed here since neither
-- table has a field that needs independent ordering the way
-- listing_features/products do, so news.tags is a plain text[] column.
--
-- Run this once against a project that already has 001_initial_schema.sql
-- applied, either via `supabase db push` or the SQL Editor.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.news (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  owner_id uuid references auth.users (id) on delete set null,
  title text not null check (char_length(title) between 1 and 300),
  summary text not null check (char_length(summary) between 20 and 2000),
  source text not null check (char_length(source) between 1 and 200),
  source_url text not null check (source_url ~ '^https?://'),
  category text not null check (
    category in ('Earnings', 'Funding', 'M&A', 'Partnership', 'Product Launch', 'Industry Trend', 'Regulation')
  ),
  tags text[] not null default '{}',
  published_date date not null check (published_date <= current_date),
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null
);

comment on column public.news.owner_id is 'Null for imported/seeded records. Never null for user-submitted news (enforced by submit_news()).';

create table public.events (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  owner_id uuid references auth.users (id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  host text not null check (char_length(host) between 1 and 200),
  description text not null check (char_length(description) between 20 and 2000),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  city text not null check (char_length(city) between 1 and 200),
  country text not null check (char_length(country) between 1 and 200),
  venue text,
  format text not null check (format in ('In-person', 'Virtual', 'Hybrid')),
  audience text,
  website text not null check (website ~ '^https?://'),
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null
);

comment on column public.events.owner_id is 'Null for imported/seeded records. Never null for user-submitted events (enforced by submit_event()).';

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_news_status on public.news (status);
create index idx_news_owner_id on public.news (owner_id);
create index idx_news_published_date on public.news (published_date);

create index idx_events_status on public.events (status);
create index idx_events_owner_id on public.events (owner_id);
create index idx_events_start_date on public.events (start_date);

-- ============================================================================
-- updated_at triggers (public.set_updated_at() is already generic - defined
-- in 001_initial_schema.sql, reused as-is here)
-- ============================================================================

create trigger set_news_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

create trigger set_events_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Privileged-field protection triggers (mirrors
-- protect_listing_privileged_fields() minus the featured/verified/
-- contact_verified checks, which have no equivalent here)
-- ============================================================================

create or replace function public.protect_news_privileged_fields()
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

create trigger news_protect_privileged_fields
  before update on public.news
  for each row execute function public.protect_news_privileged_fields();

create or replace function public.protect_events_privileged_fields()
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

create trigger events_protect_privileged_fields
  before update on public.events
  for each row execute function public.protect_events_privileged_fields();

-- ============================================================================
-- RPCs: news submission, editing and moderation
--
-- Same rationale as listings' RPCs (001_initial_schema.sql) - SECURITY
-- DEFINER, but every privileged value (owner_id, status, approved_by, ...)
-- is re-derived from auth.uid()/is_admin() itself, never trusted from the
-- caller-supplied jsonb payload.
-- ============================================================================

create or replace function public.submit_news(payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text;
  v_summary text;
  v_source text;
  v_source_url text;
  v_category text;
  v_published_date date;
  v_news_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_title := trim(payload ->> 'title');
  v_summary := trim(payload ->> 'summary');
  v_source := trim(payload ->> 'source');
  v_source_url := trim(payload ->> 'sourceUrl');
  v_category := payload ->> 'category';
  v_published_date := nullif(payload ->> 'publishedDate', '')::date;

  if v_title is null or char_length(v_title) < 1 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if v_summary is null or char_length(v_summary) < 20 then
    raise exception 'Summary must be at least 20 characters' using errcode = '22023';
  end if;
  if v_source is null or char_length(v_source) < 1 then
    raise exception 'Source is required' using errcode = '22023';
  end if;
  if v_source_url is null or v_source_url !~ '^https?://' then
    raise exception 'Source URL must be a valid http(s) URL' using errcode = '22023';
  end if;
  if v_category is null or v_category not in
    ('Earnings', 'Funding', 'M&A', 'Partnership', 'Product Launch', 'Industry Trend', 'Regulation') then
    raise exception 'Unknown category' using errcode = '22023';
  end if;
  if v_published_date is null or v_published_date > current_date then
    raise exception 'Published date must be today or earlier' using errcode = '22023';
  end if;

  insert into public.news (
    owner_id, title, summary, source, source_url, category, tags, published_date, status, submitted_at
  ) values (
    v_uid, v_title, v_summary, v_source, v_source_url, v_category,
    coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) x), '{}'),
    v_published_date, 'pending', now()
  )
  returning news.id into v_news_id;

  return query select v_news_id, 'pending'::text;
end;
$$;

revoke execute on function public.submit_news(jsonb) from public;
grant execute on function public.submit_news(jsonb) to authenticated;

create or replace function public.update_my_news(p_id uuid, payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_title text;
  v_summary text;
  v_source text;
  v_source_url text;
  v_category text;
  v_published_date date;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.news n
    where n.id = p_id and n.owner_id = v_uid and n.status in ('draft', 'pending', 'rejected')
  ) then
    raise exception 'News item not found or not editable' using errcode = '42501';
  end if;

  v_title := trim(payload ->> 'title');
  v_summary := trim(payload ->> 'summary');
  v_source := trim(payload ->> 'source');
  v_source_url := trim(payload ->> 'sourceUrl');
  v_category := payload ->> 'category';
  v_published_date := nullif(payload ->> 'publishedDate', '')::date;

  if v_title is null or char_length(v_title) < 1 then
    raise exception 'Title is required' using errcode = '22023';
  end if;
  if v_summary is null or char_length(v_summary) < 20 then
    raise exception 'Summary must be at least 20 characters' using errcode = '22023';
  end if;
  if v_source is null or char_length(v_source) < 1 then
    raise exception 'Source is required' using errcode = '22023';
  end if;
  if v_source_url is null or v_source_url !~ '^https?://' then
    raise exception 'Source URL must be a valid http(s) URL' using errcode = '22023';
  end if;
  if v_category is null or v_category not in
    ('Earnings', 'Funding', 'M&A', 'Partnership', 'Product Launch', 'Industry Trend', 'Regulation') then
    raise exception 'Unknown category' using errcode = '22023';
  end if;
  if v_published_date is null or v_published_date > current_date then
    raise exception 'Published date must be today or earlier' using errcode = '22023';
  end if;

  update public.news set
    title = v_title,
    summary = v_summary,
    source = v_source,
    source_url = v_source_url,
    category = v_category,
    tags = coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(payload -> 'tags', '[]'::jsonb)) x), '{}'),
    published_date = v_published_date
  where public.news.id = p_id;

  return query select n.id, n.status from public.news n where n.id = p_id;
end;
$$;

revoke execute on function public.update_my_news(uuid, jsonb) from public;
grant execute on function public.update_my_news(uuid, jsonb) to authenticated;

create or replace function public.resubmit_news(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.news
  set status = 'pending', rejection_reason = null, submitted_at = now()
  where id = p_id and owner_id = auth.uid() and status = 'rejected';

  if not found then
    raise exception 'News item not found or not eligible for resubmission' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.resubmit_news(uuid) from public;
grant execute on function public.resubmit_news(uuid) to authenticated;

create or replace function public.approve_news(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can approve news' using errcode = '42501';
  end if;

  update public.news
  set status = 'approved', approved_by = auth.uid(), approved_at = now(), rejection_reason = null
  where id = p_id;

  if not found then
    raise exception 'News item not found';
  end if;
end;
$$;

revoke execute on function public.approve_news(uuid) from public;
grant execute on function public.approve_news(uuid) to authenticated;

create or replace function public.reject_news(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can reject news' using errcode = '42501';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A rejection reason is required' using errcode = '22023';
  end if;

  update public.news set status = 'rejected', rejection_reason = trim(p_reason) where id = p_id;

  if not found then
    raise exception 'News item not found';
  end if;
end;
$$;

revoke execute on function public.reject_news(uuid, text) from public;
grant execute on function public.reject_news(uuid, text) to authenticated;

create or replace function public.archive_news(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can archive news' using errcode = '42501';
  end if;

  update public.news set status = 'archived' where id = p_id;

  if not found then
    raise exception 'News item not found';
  end if;
end;
$$;

revoke execute on function public.archive_news(uuid) from public;
grant execute on function public.archive_news(uuid) to authenticated;

-- ============================================================================
-- RPCs: event submission, editing and moderation (same shape as news above)
-- ============================================================================

create or replace function public.submit_event(payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_host text;
  v_description text;
  v_start_date date;
  v_end_date date;
  v_city text;
  v_country text;
  v_format text;
  v_website text;
  v_event_id uuid;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_name := trim(payload ->> 'name');
  v_host := trim(payload ->> 'host');
  v_description := trim(payload ->> 'description');
  v_start_date := nullif(payload ->> 'startDate', '')::date;
  v_end_date := nullif(payload ->> 'endDate', '')::date;
  v_city := trim(payload ->> 'city');
  v_country := trim(payload ->> 'country');
  v_format := payload ->> 'format';
  v_website := trim(payload ->> 'website');

  if v_name is null or char_length(v_name) < 1 then
    raise exception 'Event name is required' using errcode = '22023';
  end if;
  if v_host is null or char_length(v_host) < 1 then
    raise exception 'Host is required' using errcode = '22023';
  end if;
  if v_description is null or char_length(v_description) < 20 then
    raise exception 'Description must be at least 20 characters' using errcode = '22023';
  end if;
  if v_start_date is null then
    raise exception 'Start date is required' using errcode = '22023';
  end if;
  if v_end_date is null or v_end_date < v_start_date then
    raise exception 'End date must be on or after the start date' using errcode = '22023';
  end if;
  if v_city is null or char_length(v_city) < 1 then
    raise exception 'City is required' using errcode = '22023';
  end if;
  if v_country is null or char_length(v_country) < 1 then
    raise exception 'Country is required' using errcode = '22023';
  end if;
  if v_format is null or v_format not in ('In-person', 'Virtual', 'Hybrid') then
    raise exception 'Unknown format' using errcode = '22023';
  end if;
  if v_website is null or v_website !~ '^https?://' then
    raise exception 'Website must be a valid http(s) URL' using errcode = '22023';
  end if;

  insert into public.events (
    owner_id, name, host, description, start_date, end_date, city, country, venue, format, audience, website,
    status, submitted_at
  ) values (
    v_uid, v_name, v_host, v_description, v_start_date, v_end_date, v_city, v_country,
    nullif(trim(payload ->> 'venue'), ''), v_format, nullif(trim(payload ->> 'audience'), ''), v_website,
    'pending', now()
  )
  returning events.id into v_event_id;

  return query select v_event_id, 'pending'::text;
end;
$$;

revoke execute on function public.submit_event(jsonb) from public;
grant execute on function public.submit_event(jsonb) to authenticated;

create or replace function public.update_my_event(p_id uuid, payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_host text;
  v_description text;
  v_start_date date;
  v_end_date date;
  v_city text;
  v_country text;
  v_format text;
  v_website text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.events e
    where e.id = p_id and e.owner_id = v_uid and e.status in ('draft', 'pending', 'rejected')
  ) then
    raise exception 'Event not found or not editable' using errcode = '42501';
  end if;

  v_name := trim(payload ->> 'name');
  v_host := trim(payload ->> 'host');
  v_description := trim(payload ->> 'description');
  v_start_date := nullif(payload ->> 'startDate', '')::date;
  v_end_date := nullif(payload ->> 'endDate', '')::date;
  v_city := trim(payload ->> 'city');
  v_country := trim(payload ->> 'country');
  v_format := payload ->> 'format';
  v_website := trim(payload ->> 'website');

  if v_name is null or char_length(v_name) < 1 then
    raise exception 'Event name is required' using errcode = '22023';
  end if;
  if v_host is null or char_length(v_host) < 1 then
    raise exception 'Host is required' using errcode = '22023';
  end if;
  if v_description is null or char_length(v_description) < 20 then
    raise exception 'Description must be at least 20 characters' using errcode = '22023';
  end if;
  if v_start_date is null then
    raise exception 'Start date is required' using errcode = '22023';
  end if;
  if v_end_date is null or v_end_date < v_start_date then
    raise exception 'End date must be on or after the start date' using errcode = '22023';
  end if;
  if v_city is null or char_length(v_city) < 1 then
    raise exception 'City is required' using errcode = '22023';
  end if;
  if v_country is null or char_length(v_country) < 1 then
    raise exception 'Country is required' using errcode = '22023';
  end if;
  if v_format is null or v_format not in ('In-person', 'Virtual', 'Hybrid') then
    raise exception 'Unknown format' using errcode = '22023';
  end if;
  if v_website is null or v_website !~ '^https?://' then
    raise exception 'Website must be a valid http(s) URL' using errcode = '22023';
  end if;

  update public.events set
    name = v_name,
    host = v_host,
    description = v_description,
    start_date = v_start_date,
    end_date = v_end_date,
    city = v_city,
    country = v_country,
    venue = nullif(trim(payload ->> 'venue'), ''),
    format = v_format,
    audience = nullif(trim(payload ->> 'audience'), ''),
    website = v_website
  where public.events.id = p_id;

  return query select e.id, e.status from public.events e where e.id = p_id;
end;
$$;

revoke execute on function public.update_my_event(uuid, jsonb) from public;
grant execute on function public.update_my_event(uuid, jsonb) to authenticated;

create or replace function public.resubmit_event(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.events
  set status = 'pending', rejection_reason = null, submitted_at = now()
  where id = p_id and owner_id = auth.uid() and status = 'rejected';

  if not found then
    raise exception 'Event not found or not eligible for resubmission' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.resubmit_event(uuid) from public;
grant execute on function public.resubmit_event(uuid) to authenticated;

create or replace function public.approve_event(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can approve events' using errcode = '42501';
  end if;

  update public.events
  set status = 'approved', approved_by = auth.uid(), approved_at = now(), rejection_reason = null
  where id = p_id;

  if not found then
    raise exception 'Event not found';
  end if;
end;
$$;

revoke execute on function public.approve_event(uuid) from public;
grant execute on function public.approve_event(uuid) to authenticated;

create or replace function public.reject_event(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can reject events' using errcode = '42501';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A rejection reason is required' using errcode = '22023';
  end if;

  update public.events set status = 'rejected', rejection_reason = trim(p_reason) where id = p_id;

  if not found then
    raise exception 'Event not found';
  end if;
end;
$$;

revoke execute on function public.reject_event(uuid, text) from public;
grant execute on function public.reject_event(uuid, text) to authenticated;

create or replace function public.archive_event(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can archive events' using errcode = '42501';
  end if;

  update public.events set status = 'archived' where id = p_id;

  if not found then
    raise exception 'Event not found';
  end if;
end;
$$;

revoke execute on function public.archive_event(uuid) from public;
grant execute on function public.archive_event(uuid) to authenticated;

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.news enable row level security;
alter table public.events enable row level security;

-- news -------------------------------------------------------------

create policy news_select_approved on public.news
  for select using (status = 'approved');

create policy news_select_owner on public.news
  for select using (owner_id = auth.uid());

create policy news_select_admin on public.news
  for select using (public.is_admin());

create policy news_insert_owner on public.news
  for insert with check (
    owner_id = auth.uid()
    and status in ('draft', 'pending')
    and approved_by is null
    and approved_at is null
  );

create policy news_update_owner on public.news
  for update
  using (owner_id = auth.uid() and status in ('draft', 'pending', 'rejected'))
  with check (owner_id = auth.uid());

create policy news_update_admin on public.news
  for update using (public.is_admin()) with check (public.is_admin());

create policy news_delete_admin on public.news
  for delete using (public.is_admin());

-- events -------------------------------------------------------------

create policy events_select_approved on public.events
  for select using (status = 'approved');

create policy events_select_owner on public.events
  for select using (owner_id = auth.uid());

create policy events_select_admin on public.events
  for select using (public.is_admin());

create policy events_insert_owner on public.events
  for insert with check (
    owner_id = auth.uid()
    and status in ('draft', 'pending')
    and approved_by is null
    and approved_at is null
  );

create policy events_update_owner on public.events
  for update
  using (owner_id = auth.uid() and status in ('draft', 'pending', 'rejected'))
  with check (owner_id = auth.uid());

create policy events_update_admin on public.events
  for update using (public.is_admin()) with check (public.is_admin());

create policy events_delete_admin on public.events
  for delete using (public.is_admin());

-- ============================================================================
-- Table grants (RLS policies above still govern actual row-level access)
-- ============================================================================

grant select, insert, update, delete on public.news, public.events to authenticated;
grant select on public.news, public.events to anon;
