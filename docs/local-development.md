# Local development

## Prerequisites

- Node.js 18+ and npm
- A Supabase project with the schema and seed data loaded (see [supabase-setup.md](./supabase-setup.md))

## Setup

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase project's URL and publishable key (Supabase dashboard ->
Project Settings -> API):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`.env.local` is gitignored and never committed. Never put the `service_role`/secret key in any
`VITE_`-prefixed variable - Vite inlines every `VITE_*` variable into the JavaScript bundle shipped
to the browser.

## Running

```bash
npm run dev
```

Open the printed local URL (typically http://localhost:5173). If `.env.local` is missing or still
has the placeholder values from `.env.example`, the app shows a "Supabase isn't configured yet"
screen instead of crashing - fill in real values and reload.

## Verification

```bash
npm run lint
npm run build
npm run preview   # serve the production build locally
npm run test      # (or: npx vitest run)
```

## Project structure (post-migration)

```
src/
  lib/
    supabase.js          # The one Supabase client; validates env vars
  config/
    categories.js         # Still the source of truth for category IDs/routes/theme -
                           # mirrored into the categories table by scripts/generate-seed.mjs
    theme.js
  services/
    listingService.js     # Public listing/category reads + a submitting user's own actions
    authService.js        # Sign up/in/out, password reset, profile fetch
    adminService.js        # Moderation actions (thin wrappers over admin-only RPCs)
    storageService.js      # Logo upload + client-side validation
    listingMapper.js       # snake_case DB rows -> the existing camelCase UI shape
  context/
    AuthContext.jsx        # Session/profile state, exposed via useAuth()
  components/
    ProtectedRoute.jsx, AdminRoute.jsx   # UX-only guards - RLS is the real boundary
    ListingForm.jsx         # Shared fields for AddBusinessForm and EditListing
    ...                     # existing Header/ListingCard/etc., updated in place
  pages/
    Login.jsx, Register.jsx, ForgotPassword.jsx, ResetPassword.jsx
    ListingDetail.jsx (/vendor/:slug)
    Dashboard.jsx, MyListings.jsx, EditListing.jsx
    AdminDashboard.jsx, AdminListings.jsx, AdminListingDetail.jsx
    ...                     # existing Home/CategoryPage/AddBusiness/News/Events, updated in place
  data/
    news.json, events.json  # Still static - out of scope for this migration
    *.json                  # The 20 original vendor category files - source data for the seed
                             # generator only; no longer imported by the running app
supabase/
  migrations/001_initial_schema.sql
  storage-setup.sql
  seed.sql                 # Generated - see scripts/generate-seed.mjs
scripts/
  generate-seed.mjs         # Regenerates supabase/seed.sql from src/config + src/data
```

## Regenerating seed data

If you edit `src/data/*.json` or `src/config/categories.js`, regenerate the seed file and re-run it
against your database:

```bash
npm run seed:generate
```

Then apply `supabase/seed.sql` again (CLI or SQL Editor - see
[supabase-setup.md](./supabase-setup.md)). It's idempotent, so rerunning it is always safe.
