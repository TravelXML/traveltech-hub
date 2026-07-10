# TravelTech Hub

A JustDial-style listing directory for the travel technology industry. Browse Property
Management Systems, Central Reservation Systems, aggregators, channel managers, wholesalers,
OTAs and more — search, filter and discover providers across 12 categories.

This is a **frontend demo with static data**, deliberately architected so it can be swapped to a
real backend later with minimal changes (see [Swapping in a real backend](#swapping-in-a-real-backend)).

## Tech stack

- **React 18** + **Vite**
- **Tailwind CSS**
- **React Router** (`HashRouter`, so client-side routing works on GitHub Pages without server config)
- Static **JSON** data files shaped like API responses

## Project structure

```
src/
  config/
    categories.js      # Central registry of the 12 categories (id, route, color theme, icon)
    theme.js            # Maps a category's color name to Tailwind classes
  data/
    pms.json, crs.json, ...   # One JSON file per category, shaped like an API response
  services/
    listingService.js  # Single data-access layer — getCategories(), getListings(), searchAll(), submitListing()
  hooks/
    useListingFilters.js # Reusable search/filter/sort logic used by category pages
  components/           # Header, Hero, CategoryCard, ListingCard, FilterSidebar, TagBadge, SearchBar, AddBusinessForm, Footer
  pages/                # Home, CategoryPage, AddBusiness, NotFound
```

### Data structure

Each file in `src/data/` is shaped like an API response:

```json
{
  "_comment": "Contact details are placeholder examples and must be verified before real-world use.",
  "category": "pms",
  "listings": [
    {
      "id": "cloudbeds",
      "name": "Cloudbeds",
      "logoInitials": "CB",
      "description": "...",
      "features": ["..."],
      "usps": ["..."],
      "products": ["..."],
      "targetMarkets": ["Global"],
      "pricingModel": "Subscription",
      "priceRange": "$$",
      "email": "sales@cloudbeds.com",
      "phone": "+1-555-000-0000",
      "website": "https://www.cloudbeds.com",
      "headquarters": "San Diego, USA",
      "founded": 2012
    }
  ]
}
```

> **Note:** Contact emails and phone numbers are plausible **placeholder-format** values for
> demo purposes, not verified real contact details. Company names, websites, HQ and founding
> years are accurate to the best of our knowledge, but should be re-verified before production use.

## Running locally

```bash
npm install
npm run dev
```

Open the printed local URL (typically http://localhost:5173).

To type-check/build:

```bash
npm run build
npm run preview   # serve the production build locally
```

## Deployment to GitHub Pages

The app is preconfigured with `base: '/traveltech-hub/'` in `vite.config.js` and uses
`HashRouter`, so it works out of the box on GitHub Pages project sites. There are two ways to
deploy:

### Option A — `gh-pages` npm script (manual, on-demand)

1. Push this repo to GitHub as `traveltech-hub` (or update `base` in `vite.config.js` to match
   your repo name).
2. Run:
   ```bash
   npm run deploy
   ```
   This builds the app and pushes `dist/` to a `gh-pages` branch (via the `gh-pages` package).
3. In your GitHub repo, go to **Settings → Pages**, and under "Build and deployment" set
   **Source: Deploy from a branch**, branch: `gh-pages`, folder: `/ (root)`.
4. Your site will be live at `https://<username>.github.io/traveltech-hub/`.

### Option B — GitHub Actions (automatic, on every push to `main`)

A workflow at `.github/workflows/deploy.yml` builds and deploys automatically on every push to
`main`.

1. In your GitHub repo, go to **Settings → Pages**, and under "Build and deployment" set
   **Source: GitHub Actions**.
2. Push to `main` — the workflow builds the app and publishes `dist/` via
   `actions/deploy-pages`.
3. Your site will be live at `https://<username>.github.io/traveltech-hub/`.

Both methods can coexist, but only one "Source" is active in Pages settings at a time.

## Swapping in a real backend

Every component reads data through `src/services/listingService.js` — no component imports the
JSON files directly. To move to a real API:

1. Replace the body of each function in `listingService.js`:
   - `getCategories()` → `GET /api/categories`
   - `getListings(categoryId)` → `GET /api/categories/:id/listings`
   - `searchAll(query)` → `GET /api/search?q=...`
   - `submitListing(payload)` → `POST /api/listings` (already stubbed with a `// TODO` marking
     exactly where the real `fetch` call goes)
2. Keep the same return shapes (arrays/objects matching the current JSON structure) and no other
   file needs to change — components, hooks and pages are unaware of where the data comes from.
3. Remove the `src/data/*.json` files and the `import.meta.glob` loader in `listingService.js`
   once the backend is live.

## License

Demo project for illustrative purposes.
