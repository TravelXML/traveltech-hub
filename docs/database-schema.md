# Database schema

Full source: `supabase/migrations/001_initial_schema.sql`. This is a summary for orientation.

## Tables

### `profiles`
One row per `auth.users` row (created automatically - see Triggers below).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `full_name`, `avatar_url` | text | user-editable |
| `role` | text | `user` \| `vendor` \| `admin`, default `user`; only an admin (or a direct/trusted DB connection - see [admin-setup.md](./admin-setup.md)) can change it |
| `created_at`, `updated_at` | timestamptz | |

### `categories`
Mirrors `src/config/categories.js`.

| Column | Notes |
|---|---|
| `id` (PK, text) | e.g. `pms`, `hotel-aggregators` - matches existing routes |
| `route` (unique) | e.g. `/pms` |
| `display_order`, `is_active` | |

### `listings`
The core table. One row per vendor **per category** - see the cross-listing note below.

| Column | Notes |
|---|---|
| `id` | uuid PK |
| `legacy_id` | original id from the source JSON, nullable |
| `owner_id` | nullable FK to `auth.users`; null for imported/seeded rows, always set for user submissions |
| `category_id` | FK to `categories` |
| `slug` | globally unique, `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `logo_initials`, `logo_url` | fallback initials shown until a real logo is uploaded |
| `pricing_model` | CHECK: one of `Subscription`, `Per Booking`, `Commission`, `Freemium`, `Enterprise/Custom` |
| `price_range` | CHECK: `$`, `$$`, or `$$$` |
| `email`, `phone` | shown publicly only when `contact_verified = true` (enforced in `src/services/listingMapper.js`, not just the UI) |
| `founded` | CHECK: 1800-2100 |
| `status` | CHECK: `draft` \| `pending` \| `approved` \| `rejected` \| `archived` |
| `featured`, `verified`, `contact_verified` | admin-only fields - see RLS below |
| `rejection_reason`, `submitted_at`, `approved_at`, `approved_by` | moderation trail |
| `search_vector` | generated `tsvector` (name + description + headquarters), GIN-indexed |

**Cross-listed vendors:** a handful of vendors in the original JSON appear under two categories
(e.g. a booking engine that's also filed under distribution platforms). Rather than a many-to-many
join, each appearance is its own row, so the unique constraint is on **`(legacy_id, category_id)`**,
not a bare `unique(legacy_id)` - a naive global-unique constraint was tried first and silently
collapsed 3 of the 337 source listings into 1 during testing (see the comment on that constraint in
the migration).

### `listing_features`, `listing_usps`, `listing_products`
Same shape: `id`, `listing_id` (FK, cascade delete), `value`, `display_order`.

### `listing_target_markets`
Same, minus `display_order` (order doesn't matter for markets - matches the spec).

## Indexes

`category_id`, `status`, `owner_id`, `featured` (partial, `where featured = true`), `name`, a GIN
index on `search_vector`, a trigram GIN index on `name`, a trigram GIN index on
`listing_products.value`, plus a standard FK index on every child table's `listing_id`.

## Triggers

| Trigger | Fires on | Purpose |
|---|---|---|
| `on_auth_user_created` | `INSERT` on `auth.users` | Creates the matching `profiles` row with `role = 'user'`, ignoring any role claimed in signup metadata |
| `profiles_protect_role` | `UPDATE` on `profiles` | Blocks a non-admin from changing their own `role` |
| `listings_protect_privileged_fields` | `UPDATE` on `listings` | Blocks a non-admin from changing `owner_id`, `verified`, `featured`, `contact_verified`, `approved_by`, `approved_at`, from setting `rejection_reason`, or from setting `status` to `approved`/`archived` |
| `set_*_updated_at` | `UPDATE` on `profiles`/`categories`/`listings` | Bumps `updated_at` |

Both `protect_*` triggers treat `auth.uid() IS NULL` (no JWT at all - only reachable via a direct
trusted Postgres connection, e.g. the SQL Editor or CLI, never a PostgREST/anon/authenticated
request) as equivalent to an admin, since otherwise even the documented first-admin bootstrap
`UPDATE` in [admin-setup.md](./admin-setup.md) would be rejected by its own trigger - this was
caught by testing against a real database before it ever became a real footgun.

## RPC functions

Every mutation flows through one of these `SECURITY DEFINER` functions rather than a raw table
write, so a single choke point re-derives every privileged value (`owner_id`, `status`,
`approved_by`, ...) from `auth.uid()`/`is_admin()` instead of trusting the caller's payload:

- `public.is_admin()` - the recursion-safe helper every RLS policy and trigger above uses
- `public.submit_listing(payload jsonb)` - atomic insert of a listing + its 4 child tables; forces `owner_id`, `status = 'pending'`, and generates a unique slug server-side
- `public.update_my_listing(p_id, payload jsonb)` - same, but UPDATE, only while the caller owns the row and it's still `draft`/`pending`/`rejected`
- `public.resubmit_listing(p_id)` - `rejected` -> `pending`, clears the rejection reason
- `public.approve_listing(p_id)`, `reject_listing(p_id, reason)`, `archive_listing(p_id)`, `set_listing_featured(p_id, bool)`, `set_listing_verified(p_id, bool)` - admin-only (each independently re-checks `is_admin()`)

`EXECUTE` on all of the above (except `is_admin()`, deliberately open to `anon` too) is explicitly
`REVOKE`d from `PUBLIC` and re-`GRANT`ed only to `authenticated` - Postgres grants `EXECUTE` to
`PUBLIC` by default on every new function, which would otherwise let `anon` call
`submit_listing()` etc. directly (their own `auth.uid() IS NULL` check would still reject the
call, but relying on that alone rather than the grant was a real gap caught during testing).

## Row Level Security

RLS is enabled on all 7 tables. Summary (full policies in the migration):

- **Anonymous / authenticated (public read):** active categories; `approved` listings and their
  child rows
- **Authenticated (own data):** full read/update of their own profile except `role`; read all
  their own listings regardless of status; insert/update listings only via the RPCs above (a
  matching direct-table `INSERT` policy exists as a second layer, and explicitly blocks setting
  any privileged column even via that path)
- **Admin (`is_admin()`):** full read/write on every table

## Storage

See `supabase/storage-setup.sql` - the `vendor-logos` bucket (public read, 2 MB limit,
PNG/JPEG/WebP/SVG) with policies enforcing the `{uploader-user-id}/{listing-id}/{filename}` path
convention for writes.
