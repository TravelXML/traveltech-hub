# TravelTech Hub

A JustDial-style listing directory for the travel technology industry. Browse Property
Management Systems, Central Reservation Systems, aggregators, channel managers, wholesalers,
OTAs and more - search, filter and discover providers across 20 categories.

Vendor submissions, user accounts, moderation and logo uploads are backed by **Supabase**
(Postgres + Auth + Storage), secured end-to-end by Row Level Security - not just frontend route
guards. See [docs/security-review.md](./docs/security-review.md) for the full breakdown.

## Tech stack

- **React 18** + **Vite**
- **Tailwind CSS**
- **React Router** (`BrowserRouter`)
- **Supabase**: Postgres, Auth, Storage, Row Level Security
- Static **JSON** only for News and Events, which are out of scope for the Supabase migration

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's URL + publishable key
npm run dev
```

New to this repo? Start with [docs/local-development.md](./docs/local-development.md). Setting up
a Supabase project from scratch? Start with [docs/supabase-setup.md](./docs/supabase-setup.md).

## Documentation

| Doc | Covers |
|---|---|
| [docs/local-development.md](./docs/local-development.md) | Local setup, project structure, regenerating seed data |
| [docs/supabase-setup.md](./docs/supabase-setup.md) | Creating a Supabase project, running migrations/seed, storage, auth redirect URLs |
| [docs/database-schema.md](./docs/database-schema.md) | Tables, RLS, triggers, RPC functions |
| [docs/admin-setup.md](./docs/admin-setup.md) | Promoting the first administrator |
| [docs/cloudflare-pages.md](./docs/cloudflare-pages.md) | Cloudflare Pages deploy settings + how it coexists with GitHub Pages |
| [docs/security-review.md](./docs/security-review.md) | Security findings and mitigations, including bugs caught by testing |
| [docs/testing-checklist.md](./docs/testing-checklist.md) | Manual end-to-end test checklist |

## Project structure

```
src/
  config/
    categories.js      # Central registry of all categories (id, route, color theme, icon) -
                         # mirrored into Supabase's categories table by scripts/generate-seed.mjs
    theme.js             # Maps a category's color name to Tailwind classes
  lib/
    supabase.js          # The one Supabase client; validates env vars, never touches a service-role key
  data/
    pms.json, crs.json, ...   # Source data for the seed generator only - no longer read at runtime
    news.json, events.json    # Still static JSON, read directly (out of scope for this migration)
  services/
    listingService.js    # Public listing/category reads + a signed-in user's own submissions
    authService.js        # Sign up/in/out, password reset, profile fetch
    adminService.js        # Moderation actions (thin wrappers over admin-only RPCs)
    storageService.js      # Logo upload + client-side validation
    listingMapper.js       # Supabase rows -> the existing camelCase UI shape
  context/
    AuthContext.jsx        # Session/profile state via useAuth()
  hooks/
    useListingFilters.js   # Reusable search/filter/sort logic used by category pages
  components/              # Header, Hero, CategoryCard, ListingCard, FilterSidebar, TagBadge,
                            # SearchBar, AddBusinessForm, ListingForm, ProtectedRoute, AdminRoute, Footer
  pages/                    # Home, CategoryPage, ListingDetail, AddBusiness, Login, Register,
                            # ForgotPassword, ResetPassword, Dashboard, MyListings, EditListing,
                            # AdminDashboard, AdminListings, AdminListingDetail, News, Events, NotFound
supabase/
  migrations/001_initial_schema.sql   # Tables, indexes, triggers, RPC functions, RLS policies
  storage-setup.sql                    # vendor-logos bucket + its RLS policies
  seed.sql                             # Generated - see scripts/generate-seed.mjs
scripts/
  generate-seed.mjs                    # Regenerates supabase/seed.sql from src/config + src/data
```

## Data model

Every listing keeps the same shape the UI has always expected (`ListingCard.jsx`,
`useListingFilters.js`, etc. didn't need to change):

```js
{
  id, name, slug, logoInitials, logoUrl, description,
  features, usps, products, targetMarkets,
  pricingModel, priceRange,
  email, phone,        // null unless an admin has verified them
  website, headquarters, founded,
  status, featured, verified, contactVerified, rejectionReason,
}
```

`src/services/listingMapper.js` is the single place that translates Supabase's snake_case rows
(plus joined child tables for features/usps/products/target markets) into this shape - see
[docs/database-schema.md](./docs/database-schema.md) for the underlying tables.

> **Note on the original static data:** the 20 files under `src/data/` are preserved as the source
> for `supabase/seed.sql` (regenerate with `npm run seed:generate`) but are no longer imported by
> the running app. Their own disclaimer - that email/phone values are plausible
> **placeholder-format** examples, not verified contact details - is why every seeded listing gets
> `contact_verified = false` and `email`/`phone` set to `null`; the UI hides unverified contact
> info rather than ever presenting placeholder data as real.

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL (typically http://localhost:5173).

To verify:

```bash
npm run lint
npm run build
npm run preview   # serve the production build locally
npx vitest run     # unit tests
```

## Deployment

This app deploys to **both** Cloudflare Pages and GitHub Pages from the same `main` branch - see
[docs/cloudflare-pages.md](./docs/cloudflare-pages.md) for exactly how the two coexist (different
`VITE_BASE_PATH` per target, `BrowserRouter` + `public/_redirects` for Cloudflare,
`BrowserRouter` + the standard `public/404.html` redirect trick for GitHub Pages).

### Cloudflare Pages

Connect the repo in the Cloudflare dashboard: build command `npm run build`, output directory
`dist`, no `VITE_BASE_PATH` needed. Full settings and required environment variables in
[docs/cloudflare-pages.md](./docs/cloudflare-pages.md).

### GitHub Pages

`.github/workflows/deploy.yml` builds and deploys automatically on every push to `main` (needs
`VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` as repo secrets). The `npm run deploy` /
`gh-pages` manual path still works too (`predeploy` sets `VITE_BASE_PATH` for you).

## License

Demo project for illustrative purposes.
