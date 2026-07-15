# Supabase setup

This assumes you don't have the Supabase CLI installed. Both a no-CLI path (SQL Editor) and a CLI
path are given for every step - pick one.

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note the **Project URL** and **publishable key** from Project Settings -> API - you'll need
   these for `.env.local` (see [local-development.md](./local-development.md)).

## 2. Run the schema migration

This creates every table, index, trigger, RPC function and RLS policy.

**Option A - SQL Editor (no CLI required):**

1. Open your project's SQL Editor in the Supabase dashboard.
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`.
3. Run it. It should complete with no errors (it's been smoke-tested against a real Postgres 15
   instance with a stubbed `auth` schema, plus a full row-level-security test suite exercising
   every anonymous/owner/admin access path).

**Option B - Supabase CLI:**

```bash
npm install -g supabase   # if you don't already have it
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

## 3. Seed the database

`supabase/seed.sql` is generated from `src/config/categories.js` and `src/data/*.json` (see
`scripts/generate-seed.mjs` - rerun `npm run seed:generate` if you change that source data). It
inserts all 20 categories and all 337 vendor listings from the original static site, marked
`approved` with `owner_id = null` (imported, not user-submitted) and `contact_verified = false`
(the source JSON explicitly disclaims its email/phone values as placeholder-format examples - see
the comment at the top of `supabase/seed.sql`).

**Option A - SQL Editor:** paste the contents of `supabase/seed.sql` and run it.

**Option B - CLI:**

```bash
psql "$(supabase db url)" -f supabase/seed.sql
```

It's idempotent (upserts on `(legacy_id, category_id)`, deletes and reinserts each listing's child
rows) - safe to rerun after regenerating it.

**Verify the counts:**

```sql
select count(*) from public.categories;   -- expect 20
select count(*) from public.listings;     -- expect 337
```

## 4. Create the storage bucket

`supabase/storage-setup.sql` creates the `vendor-logos` bucket (public read, 2 MB limit,
PNG/JPEG/WebP/SVG only) and its RLS policies. Run it the same way as the migration (SQL Editor or
CLI). You can also create the bucket by hand in Dashboard -> Storage -> New bucket if you prefer,
but you'll still need to run the `create policy ...` statements from that file for uploads to work.

## 5. Configure Auth redirect URLs

Dashboard -> Authentication -> URL Configuration. Add these to **Redirect URLs** (comma-separated
or one per line, depending on the dashboard version):

```
http://localhost:5173/**
https://YOUR-PROJECT-NAME.pages.dev/**
https://traveltech.startupctopro.in/**
```

Set **Site URL** to your final production domain once you have one (used as the default redirect
base for emails). Update this list again once your Cloudflare Pages URL is known (see
[cloudflare-pages.md](./cloudflare-pages.md)).

Email confirmations are on by default for new projects, which is what makes the "verify your
email" step in Register.jsx work - no extra configuration needed unless you want to customize the
email templates (Authentication -> Email Templates).

## 6. Promote your first admin

See [admin-setup.md](./admin-setup.md) - register a normal account first, then run one `UPDATE`
statement.

## 7. Set environment variables everywhere the app is built

- Local: `.env.local` (see [local-development.md](./local-development.md))
- GitHub Actions (GitHub Pages build): repo secrets `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_PUBLISHABLE_KEY` (Settings -> Secrets and variables -> Actions)
- Cloudflare Pages: project environment variables (see [cloudflare-pages.md](./cloudflare-pages.md))

Never set `SUPABASE_SERVICE_ROLE_KEY`, a database password, or a JWT secret in any of these - this
app only ever needs the public URL and publishable key, and every table is protected by RLS.
