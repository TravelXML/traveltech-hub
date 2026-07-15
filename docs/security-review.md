# Security review

This covers the Supabase migration (schema, RLS, RPCs, storage, auth) and the frontend code built
on top of it. Findings from actually testing the migration against a real Postgres 15 instance
(with a stubbed `auth` schema) are called out explicitly, since they represent real bugs that were
caught and fixed before this ever touched a live project - not just a design review.

## RLS is enabled on every table

`profiles`, `categories`, `listings`, `listing_features`, `listing_usps`, `listing_products`,
`listing_target_markets` all have `ENABLE ROW LEVEL SECURITY` plus explicit policies (no table is
left to Postgres's RLS-disabled default). Verified with a scripted test suite covering: anonymous
visibility, an authenticated owner's visibility into their own non-approved rows, cross-user
isolation, and admin full access - see the "Verified" notes below.

## Anonymous users see approved data only

**Verified.** With no session at all, only `approved` listings and `active` categories are
visible; a freshly-submitted `pending` listing is invisible until an admin approves it (tested via
simulated anon/owner/admin roles against a live schema, not just read from the SQL).

## Users see only their own private submissions

**Verified.** A second authenticated user (`bob`) cannot see or count a `pending` listing owned by
a different user (`alice`), even though both are `authenticated`.

## Users cannot modify another owner's listing

Enforced by the RLS `UPDATE` policy's `USING (owner_id = auth.uid() ...)` clause, and additionally
by every RPC re-deriving `owner_id`/target row from `auth.uid()` rather than trusting a payload
value.

## Users cannot approve listings, and cannot make themselves administrators

**Verified**, and this is where testing caught the most:

- **Found & fixed:** the `listings_insert_owner` RLS policy originally only checked `owner_id` and
  `status` on `INSERT` - it did not block a direct insert from also setting `featured = true`,
  `verified = true`, or `contact_verified = true` in the same statement. Fixed by adding explicit
  `WITH CHECK` conditions forcing those columns to their safe defaults on insert.
- **Found & fixed:** `submit_listing()` and `update_my_listing()` both `RETURNS TABLE (id uuid,
  status text)`, which implicitly declares `id`/`status` as PL/pgSQL variables - every bare `id`/
  `status` column reference elsewhere in those function bodies was silently ambiguous and raised a
  runtime error the moment they ran (caught immediately when actually exercised, not from reading
  the SQL). Fixed by qualifying every such reference with its table alias.
- **Found & fixed:** `EXECUTE` on every RPC (`submit_listing`, `approve_listing`, etc.) was only
  ever explicitly `GRANT`ed to `authenticated` - but Postgres also grants `EXECUTE` to `PUBLIC` by
  default on every new function, so `anon` could call `submit_listing()` directly (its own
  internal `auth.uid() IS NULL` check would still reject it, but that's a single point of failure
  rather than defense in depth). Fixed with an explicit `REVOKE ... FROM PUBLIC` before each
  `GRANT`.
- **Found & fixed:** the trigger blocking non-admins from changing `profiles.role` also blocked a
  *direct SQL Editor connection* from setting the first admin, since that connection has no JWT at
  all (`auth.uid()` is `NULL`, so `is_admin()` was `false`, so the trigger rejected its own
  bootstrap). Fixed by treating `auth.uid() IS NULL` as a trusted direct-DB context (only reachable
  by someone who already has SQL Editor/CLI access to the project, never by a PostgREST request)
  in that trigger and in `protect_listing_privileged_fields()`.

## Service-role key is absent from browser code

`src/lib/supabase.js` only ever reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
`.env.example` documents only those two. No file in this repo references a service-role or secret
key. During this build, a real Supabase secret key was provided mid-session for testing purposes -
it was used exactly once, transiently, in a shell command to test direct Postgres connectivity
(which it turned out not to grant - it's an API key, not the database password), and was never
written to any file, `.env.local` included. `.env.local` only holds the URL + publishable key.

## Contact details are hidden unless verified

Enforced in two places, not just the UI: `src/services/listingMapper.js`'s `mapListingRow()` nulls
out `email`/`phone` whenever `contact_verified` is false *unless* the caller explicitly opts out
via `redactContact: false` (used only by `getMyListings`/`getMyListingById`/admin views, where the
viewer is the owner or an admin who's allowed to see it regardless of verification). Every
public-facing query (`getListings`, `getListingBySlug`, `searchAll`) uses the default. Covered by a
unit test (`listingMapper.test.js`).

Additionally, all 337 seeded listings have `email = null`, `phone = null`, `contact_verified =
false` regardless of what the source JSON contained, because that JSON explicitly disclaimed those
fields as placeholder-format examples (see the seed generator's data-quality comment).

## User-generated values are rendered as text, not unsafe HTML

Every user-supplied string (name, description, features, etc.) is rendered via plain JSX text
interpolation (`{value}`) - no `dangerouslySetInnerHTML` is used anywhere in the app.

## External links use safe protocols

- `website` is validated both client-side (`^https?:\/\/`) and by a DB `CHECK` constraint
  (`website ~ '^https?://'`) before it's ever rendered as an `href`.
- `logo_url` is similarly constrained to `^https://` at the database level, and is only ever set by
  `setMyListingLogo()`, which is fed the return value of a Supabase Storage upload - never
  arbitrary user input.
- All external links (`target="_blank"`) use `rel="noreferrer"`.

## Logo uploads are isolated and validated

- Storage path convention `{uploader-user-id}/{listing-id}/{random-filename}` is enforced by RLS
  on `storage.objects` (`storage.foldername(name)[1] = auth.uid()::text`), not just app
  convention - a user cannot write into another user's folder even with a crafted request.
- File type and size are validated client-side (`storageService.validateLogoFile`, covered by unit
  tests) *and* at the bucket level (`file_size_limit`, `allowed_mime_types` on the `vendor-logos`
  bucket) - the client check is for UX, the bucket config is the actual boundary.
- Filenames are randomized (`crypto.randomUUID()`), not derived from user input, so there's no path
  traversal or filename-collision surface.

## Authentication redirects cannot become open redirects

`Login.jsx`'s post-login redirect only ever uses `location.state.from.pathname` (set by our own
`ProtectedRoute`, always an in-app path) and explicitly validates it starts with `/` before using
it, falling back to `/dashboard` otherwise.

## Database errors are not displayed verbatim

`toFriendlyError()` in `listingService.js`/`adminService.js` only passes through error messages
for the specific Postgres error codes our own RPCs deliberately raise with user-safe text (`22023`
validation, `28000` auth required, `42501` permission denied). Anything else is logged to the
console (for developer debugging) and shown to the user as a generic "Something went wrong" -
no raw SQL, constraint names, or stack traces reach the UI.

## Privileged fields are never accepted from ordinary listing forms

`AddBusinessForm`/`ListingForm` never collect or send `status`, `owner_id`, `verified`,
`featured`, `contact_verified`, `approved_by`, or `approved_at` - and even if a client were
modified to send them, `submit_listing()`/`update_my_listing()` only ever read the specific
whitelisted keys they expect out of the JSONB payload (`name`, `categoryId`, `description`, ...)
and hard-code every privileged column themselves.

## Known limitations / accepted tradeoffs

- The `vendor-logos` storage bucket is public-read at the bucket level (not gated by listing
  approval status). Filenames are random/unguessable and unapproved listings' logos are never
  linked from the public UI, but a URL is still technically fetchable by anyone who already has
  it. Documented as an accepted, standard tradeoff (see `supabase/storage-setup.sql`) rather than
  building per-object signed URLs, which would add real complexity for low actual risk (logo
  images aren't sensitive data).
- `AdminListingDetail` shows a submission's `owner_id` (a UUID) rather than their email, since
  looking up another user's email would require a new admin-only RPC reading `auth.users` (not
  exposed via the REST API by default) - left out of scope for this pass rather than building a
  new privileged lookup path without being asked to.
