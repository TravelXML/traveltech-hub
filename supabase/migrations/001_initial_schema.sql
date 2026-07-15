-- TravelTech Hub - initial schema
--
-- Converts the static JSON directory into a Supabase-backed dynamic
-- platform: categories, listings (+ child tables for features/usps/
-- products/target markets), profiles, and the RLS policies + RPC
-- functions that enforce every authorization rule at the database layer.
--
-- Run this once against a fresh Supabase project, either via
-- `supabase db push` (CLI) or by pasting it into the SQL Editor. See
-- docs/supabase-setup.md for both paths.

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- fuzzy/trigram search indexes

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'vendor', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per auth.users row, created automatically by handle_new_user(). role is never trusted from client input.';

create table public.categories (
  id text primary key,
  name text not null,
  short_name text,
  route text not null unique,
  description text,
  color text,
  icon text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  owner_id uuid references auth.users (id) on delete set null,
  category_id text not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  logo_initials text check (logo_initials is null or char_length(logo_initials) <= 4),
  logo_url text check (logo_url is null or logo_url ~ '^https://'),
  description text not null check (char_length(description) between 20 and 4000),
  pricing_model text check (
    pricing_model is null or pricing_model in ('Subscription', 'Per Booking', 'Commission', 'Freemium', 'Enterprise/Custom')
  ),
  price_range text check (price_range is null or price_range in ('$', '$$', '$$$')),
  email text check (email is null or email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^[0-9+\-() ]{7,20}$'),
  website text check (website is null or website ~ '^https?://'),
  headquarters text check (headquarters is null or char_length(headquarters) <= 200),
  founded integer check (founded is null or founded between 1800 and 2100),
  status text not null default 'pending' check (status in ('draft', 'pending', 'approved', 'rejected', 'archived')),
  featured boolean not null default false,
  verified boolean not null default false,
  contact_verified boolean not null default false,
  rejection_reason text,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(headquarters, ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references auth.users (id) on delete set null,
  constraint listings_slug_unique unique (slug),
  -- Composite, not a bare unique(legacy_id): a handful of vendors in the
  -- source JSON are legitimately cross-listed under two categories (e.g.
  -- a booking engine that's also a distribution platform), which is one
  -- row per category here rather than a many-to-many join, so the same
  -- legacy_id can appear twice as long as the category differs.
  constraint listings_legacy_id_category_unique unique (legacy_id, category_id)
);

comment on column public.listings.owner_id is 'Null for imported/seeded records. Never null for user-created listings (enforced by submit_listing()).';
comment on column public.listings.contact_verified is 'Public email/phone are only shown in the UI when this is true. Imported records default to false.';

create table public.listing_features (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  value text not null check (char_length(value) between 1 and 200),
  display_order integer not null default 0
);

create table public.listing_usps (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  value text not null check (char_length(value) between 1 and 200),
  display_order integer not null default 0
);

create table public.listing_products (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  value text not null check (char_length(value) between 1 and 200),
  display_order integer not null default 0
);

create table public.listing_target_markets (
  id bigint generated always as identity primary key,
  listing_id uuid not null references public.listings (id) on delete cascade,
  value text not null check (char_length(value) between 1 and 100)
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index idx_listings_category_id on public.listings (category_id);
create index idx_listings_status on public.listings (status);
create index idx_listings_owner_id on public.listings (owner_id);
create index idx_listings_featured on public.listings (featured) where featured = true;
create index idx_listings_name on public.listings (name);
create index idx_listings_search_vector on public.listings using gin (search_vector);
create index idx_listings_name_trgm on public.listings using gin (name gin_trgm_ops);

create index idx_listing_features_listing_id on public.listing_features (listing_id);
create index idx_listing_usps_listing_id on public.listing_usps (listing_id);
create index idx_listing_products_listing_id on public.listing_products (listing_id);
create index idx_listing_products_value_trgm on public.listing_products using gin (value gin_trgm_ops);
create index idx_listing_target_markets_listing_id on public.listing_target_markets (listing_id);

create index idx_categories_display_order on public.categories (display_order);

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Determines whether the *calling* user (from the request JWT, via
-- auth.uid()) is an admin. SECURITY DEFINER + a pinned search_path lets this
-- read public.profiles without going back through profiles' own RLS
-- policies, which is what avoids infinite recursion when policies elsewhere
-- call is_admin().
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger set_listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

-- Creates a profile row for every new auth user. role is always 'user' -
-- signup metadata is never trusted for role, so a client can never sign up
-- claiming to be an admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Blocks self-promotion: a user updating their own profile can never change
-- their own role column, only an admin can. auth.uid() is null exactly when
-- there's no JWT on the session at all, i.e. a direct/trusted Postgres
-- connection (SQL Editor, `supabase db push`, migrations) rather than a
-- PostgREST request as anon/authenticated - that's what makes the
-- documented first-admin bootstrap UPDATE (docs/admin-setup.md) work.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'role can only be changed by an administrator' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- Second layer of defense (beyond RLS's row-level USING/WITH CHECK, which
-- can't compare old vs. new column values): blocks any non-admin from
-- changing ownership or admin-only fields on a listing, no matter which
-- code path performs the UPDATE.
create or replace function public.protect_listing_privileged_fields()
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
  if new.verified is distinct from old.verified then
    raise exception 'verified can only be set by an administrator' using errcode = '42501';
  end if;
  if new.featured is distinct from old.featured then
    raise exception 'featured can only be set by an administrator' using errcode = '42501';
  end if;
  if new.contact_verified is distinct from old.contact_verified then
    raise exception 'contact_verified can only be set by an administrator' using errcode = '42501';
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
  -- Owners may clear a rejection reason (e.g. on resubmit) but never set one.
  if new.rejection_reason is not null and new.rejection_reason is distinct from old.rejection_reason then
    raise exception 'rejection_reason can only be set by an administrator' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger listings_protect_privileged_fields
  before update on public.listings
  for each row execute function public.protect_listing_privileged_fields();

-- ============================================================================
-- Slug / initials helpers (reused by submit_listing and update_my_listing)
-- ============================================================================

create or replace function public.slugify(input text)
returns text
language sql
immutable
as $$
  select case
    when trim(both '-' from regexp_replace(lower(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g')) = ''
      then 'listing'
    else trim(both '-' from regexp_replace(lower(regexp_replace(coalesce(input, ''), '[^a-zA-Z0-9]+', '-', 'g')), '-+', '-', 'g'))
  end;
$$;

create or replace function public.derive_initials(input text)
returns text
language sql
immutable
as $$
  select upper(
    coalesce(left(regexp_replace(split_part(coalesce(input, ''), ' ', 1), '[^A-Za-z0-9]', '', 'g'), 1), '') ||
    coalesce(
      nullif(left(regexp_replace(split_part(coalesce(input, ''), ' ', 2), '[^A-Za-z0-9]', '', 'g'), 1), ''),
      left(regexp_replace(split_part(coalesce(input, ''), ' ', 1), '[^A-Za-z0-9]', '', 'g'), 2)
    )
  );
$$;

-- ============================================================================
-- RPCs: listing submission, editing and moderation
--
-- These are the *only* sanctioned way to write to listings + its child
-- tables. Each one is SECURITY DEFINER (so it can atomically write across
-- five tables in one transaction) but re-derives every privileged value
-- (owner_id, status, approved_by, ...) from auth.uid()/is_admin() itself -
-- it never trusts a caller-supplied value for those fields, even though the
-- jsonb payload could technically contain one.
-- ============================================================================

create or replace function public.submit_listing(payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_category_id text;
  v_name text;
  v_description text;
  v_founded int;
  v_base_slug text;
  v_slug text;
  v_suffix int := 1;
  v_listing_id uuid;
  v_value text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  v_category_id := payload ->> 'categoryId';
  v_name := trim(payload ->> 'name');
  v_description := trim(payload ->> 'description');
  v_founded := nullif(payload ->> 'founded', '')::int;

  if v_category_id is null or not exists (
    select 1 from public.categories c where c.id = v_category_id and c.is_active
  ) then
    raise exception 'Unknown or inactive category' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) < 1 then
    raise exception 'Business name is required' using errcode = '22023';
  end if;
  if v_description is null or char_length(v_description) < 20 then
    raise exception 'Description must be at least 20 characters' using errcode = '22023';
  end if;
  if v_founded is not null and v_founded > extract(year from now())::int then
    raise exception 'Founded year cannot be in the future' using errcode = '22023';
  end if;

  v_base_slug := public.slugify(v_name);
  v_slug := v_base_slug;
  while exists (select 1 from public.listings where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix;
  end loop;

  insert into public.listings (
    owner_id, category_id, name, slug, logo_initials, description,
    pricing_model, price_range, email, phone, website, headquarters, founded,
    status, submitted_at
  ) values (
    v_uid, v_category_id, v_name, v_slug, public.derive_initials(v_name), v_description,
    nullif(payload ->> 'pricingModel', ''), nullif(payload ->> 'priceRange', ''),
    nullif(payload ->> 'email', ''), nullif(payload ->> 'phone', ''),
    nullif(payload ->> 'website', ''), nullif(payload ->> 'headquarters', ''), v_founded,
    'pending', now()
  )
  returning listings.id into v_listing_id;

  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'features', '[]'::jsonb)) loop
    insert into public.listing_features (listing_id, value, display_order)
    values (v_listing_id, v_value, 0);
  end loop;
  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'usps', '[]'::jsonb)) loop
    insert into public.listing_usps (listing_id, value, display_order) values (v_listing_id, v_value, 0);
  end loop;
  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'products', '[]'::jsonb)) loop
    insert into public.listing_products (listing_id, value, display_order) values (v_listing_id, v_value, 0);
  end loop;
  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'targetMarkets', '[]'::jsonb)) loop
    insert into public.listing_target_markets (listing_id, value) values (v_listing_id, v_value);
  end loop;

  return query select v_listing_id, 'pending'::text;
end;
$$;

revoke execute on function public.submit_listing(jsonb) from public;
grant execute on function public.submit_listing(jsonb) to authenticated;

create or replace function public.update_my_listing(p_id uuid, payload jsonb)
returns table (id uuid, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_category_id text;
  v_name text;
  v_description text;
  v_founded int;
  v_value text;
begin
  if v_uid is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.listings l
    where l.id = p_id and l.owner_id = v_uid and l.status in ('draft', 'pending', 'rejected')
  ) then
    raise exception 'Listing not found or not editable' using errcode = '42501';
  end if;

  v_category_id := payload ->> 'categoryId';
  v_name := trim(payload ->> 'name');
  v_description := trim(payload ->> 'description');
  v_founded := nullif(payload ->> 'founded', '')::int;

  if v_category_id is null or not exists (
    select 1 from public.categories c where c.id = v_category_id and c.is_active
  ) then
    raise exception 'Unknown or inactive category' using errcode = '22023';
  end if;
  if v_name is null or char_length(v_name) < 1 then
    raise exception 'Business name is required' using errcode = '22023';
  end if;
  if v_description is null or char_length(v_description) < 20 then
    raise exception 'Description must be at least 20 characters' using errcode = '22023';
  end if;
  if v_founded is not null and v_founded > extract(year from now())::int then
    raise exception 'Founded year cannot be in the future' using errcode = '22023';
  end if;

  update public.listings set
    category_id = v_category_id,
    name = v_name,
    logo_initials = public.derive_initials(v_name),
    description = v_description,
    pricing_model = nullif(payload ->> 'pricingModel', ''),
    price_range = nullif(payload ->> 'priceRange', ''),
    email = nullif(payload ->> 'email', ''),
    phone = nullif(payload ->> 'phone', ''),
    website = nullif(payload ->> 'website', ''),
    headquarters = nullif(payload ->> 'headquarters', ''),
    founded = v_founded
  where public.listings.id = p_id;

  delete from public.listing_features where listing_id = p_id;
  delete from public.listing_usps where listing_id = p_id;
  delete from public.listing_products where listing_id = p_id;
  delete from public.listing_target_markets where listing_id = p_id;

  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'features', '[]'::jsonb)) loop
    insert into public.listing_features (listing_id, value, display_order) values (p_id, v_value, 0);
  end loop;
  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'usps', '[]'::jsonb)) loop
    insert into public.listing_usps (listing_id, value, display_order) values (p_id, v_value, 0);
  end loop;
  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'products', '[]'::jsonb)) loop
    insert into public.listing_products (listing_id, value, display_order) values (p_id, v_value, 0);
  end loop;
  for v_value in select jsonb_array_elements_text(coalesce(payload -> 'targetMarkets', '[]'::jsonb)) loop
    insert into public.listing_target_markets (listing_id, value) values (p_id, v_value);
  end loop;

  return query select l.id, l.status from public.listings l where l.id = p_id;
end;
$$;

revoke execute on function public.update_my_listing(uuid, jsonb) from public;
grant execute on function public.update_my_listing(uuid, jsonb) to authenticated;

create or replace function public.resubmit_listing(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.listings
  set status = 'pending', rejection_reason = null, submitted_at = now()
  where id = p_id and owner_id = auth.uid() and status = 'rejected';

  if not found then
    raise exception 'Listing not found or not eligible for resubmission' using errcode = '42501';
  end if;
end;
$$;

revoke execute on function public.resubmit_listing(uuid) from public;
grant execute on function public.resubmit_listing(uuid) to authenticated;

create or replace function public.approve_listing(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can approve listings' using errcode = '42501';
  end if;

  update public.listings
  set status = 'approved', approved_by = auth.uid(), approved_at = now(), rejection_reason = null
  where id = p_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

revoke execute on function public.approve_listing(uuid) from public;
grant execute on function public.approve_listing(uuid) to authenticated;

create or replace function public.reject_listing(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can reject listings' using errcode = '42501';
  end if;
  if p_reason is null or trim(p_reason) = '' then
    raise exception 'A rejection reason is required' using errcode = '22023';
  end if;

  update public.listings set status = 'rejected', rejection_reason = trim(p_reason) where id = p_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

revoke execute on function public.reject_listing(uuid, text) from public;
grant execute on function public.reject_listing(uuid, text) to authenticated;

create or replace function public.archive_listing(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can archive listings' using errcode = '42501';
  end if;

  update public.listings set status = 'archived' where id = p_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

revoke execute on function public.archive_listing(uuid) from public;
grant execute on function public.archive_listing(uuid) to authenticated;

create or replace function public.set_listing_featured(p_id uuid, p_featured boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can feature listings' using errcode = '42501';
  end if;

  update public.listings set featured = p_featured where id = p_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

revoke execute on function public.set_listing_featured(uuid, boolean) from public;
grant execute on function public.set_listing_featured(uuid, boolean) to authenticated;

create or replace function public.set_listing_verified(p_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Only administrators can verify listings' using errcode = '42501';
  end if;

  update public.listings set verified = p_verified where id = p_id;

  if not found then
    raise exception 'Listing not found';
  end if;
end;
$$;

revoke execute on function public.set_listing_verified(uuid, boolean) from public;
grant execute on function public.set_listing_verified(uuid, boolean) to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_features enable row level security;
alter table public.listing_usps enable row level security;
alter table public.listing_products enable row level security;
alter table public.listing_target_markets enable row level security;

-- profiles ---------------------------------------------------------------

create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

create policy profiles_select_admin on public.profiles
  for select using (public.is_admin());

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy profiles_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- No insert/delete policies: profiles are created only by handle_new_user()
-- (SECURITY DEFINER, bypasses RLS) and are never deleted by the app.

-- categories ---------------------------------------------------------------

create policy categories_select_active on public.categories
  for select using (is_active = true);

create policy categories_select_admin on public.categories
  for select using (public.is_admin());

create policy categories_admin_insert on public.categories
  for insert with check (public.is_admin());

create policy categories_admin_update on public.categories
  for update using (public.is_admin()) with check (public.is_admin());

create policy categories_admin_delete on public.categories
  for delete using (public.is_admin());

-- listings -------------------------------------------------------------

create policy listings_select_approved on public.listings
  for select using (status = 'approved');

create policy listings_select_owner on public.listings
  for select using (owner_id = auth.uid());

create policy listings_select_admin on public.listings
  for select using (public.is_admin());

-- Direct-table insert as a second layer behind submit_listing(); the RPC is
-- the sanctioned path since it also has to write four child tables
-- atomically. This WITH CHECK also blocks a would-be direct insert from
-- setting any privileged field (the UPDATE-time trigger can't help here
-- since triggers don't compare against "old" on INSERT).
create policy listings_insert_owner on public.listings
  for insert with check (
    owner_id = auth.uid()
    and status in ('draft', 'pending')
    and featured = false
    and verified = false
    and contact_verified = false
    and approved_by is null
    and approved_at is null
  );

create policy listings_update_owner on public.listings
  for update
  using (owner_id = auth.uid() and status in ('draft', 'pending', 'rejected'))
  with check (owner_id = auth.uid());

create policy listings_update_admin on public.listings
  for update using (public.is_admin()) with check (public.is_admin());

create policy listings_delete_admin on public.listings
  for delete using (public.is_admin());

-- listing child tables (features / usps / products / target markets) ------
-- Same visibility+write shape for all four: readable when the parent
-- listing is approved (public), owned by the caller, or the caller is an
-- admin; writable only by the owner while the parent is still
-- editable, or by an admin.

create policy listing_features_select on public.listing_features
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_features.listing_id
        and (l.status = 'approved' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy listing_features_write on public.listing_features
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_features.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_features.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  );

create policy listing_usps_select on public.listing_usps
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_usps.listing_id
        and (l.status = 'approved' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy listing_usps_write on public.listing_usps
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_usps.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_usps.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  );

create policy listing_products_select on public.listing_products
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_products.listing_id
        and (l.status = 'approved' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy listing_products_write on public.listing_products
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_products.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_products.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  );

create policy listing_target_markets_select on public.listing_target_markets
  for select using (
    exists (
      select 1 from public.listings l
      where l.id = listing_target_markets.listing_id
        and (l.status = 'approved' or l.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy listing_target_markets_write on public.listing_target_markets
  for all using (
    exists (
      select 1 from public.listings l
      where l.id = listing_target_markets.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  ) with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_target_markets.listing_id
        and (public.is_admin() or (l.owner_id = auth.uid() and l.status in ('draft', 'pending', 'rejected')))
    )
  );

-- ============================================================================
-- Table grants
--
-- RLS policies only take effect once a role has *some* grant on the table;
-- this makes that explicit rather than relying on project-template
-- defaults. Actual row-level access is still fully governed by the
-- policies above.
-- ============================================================================

grant select, insert, update, delete on
  public.profiles, public.listings,
  public.listing_features, public.listing_usps, public.listing_products, public.listing_target_markets
  to authenticated;

grant select, insert, update, delete on public.categories to authenticated;

grant select on
  public.categories, public.listings,
  public.listing_features, public.listing_usps, public.listing_products, public.listing_target_markets
  to anon;
