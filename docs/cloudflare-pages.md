# Cloudflare Pages / Workers deployment

Cloudflare has been migrating Git-connected static sites from classic "Pages" projects into the
unified "Workers" flow (Workers & Pages -> Create -> Connect to Git), which now defaults straight
to a Workers/Wrangler-based setup rather than the old Framework-preset/build-output-directory UI.
Both work fine for this app - use whichever your dashboard actually shows you.

## If you get the classic Pages UI

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Production branch | `main` |

Do **not** set `VITE_BASE_PATH` here - leaving it unset means `vite.config.js` defaults `base` to
`/`, which is what Cloudflare (served from its own domain root) needs. `VITE_BASE_PATH` is only
for the separate GitHub Pages build (see `.github/workflows/deploy.yml`).

## If you get the newer Workers/Wrangler UI

This is what most new projects see now. The repo already has what it needs - `wrangler.jsonc` at
the root configures Wrangler to serve the Vite build as static assets, with SPA fallback so
client-side routes work on a hard refresh:

```jsonc
{
  "name": "traveltech-hub",
  "compatibility_date": "2024-09-23",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "single-page-application"
  }
}
```

Fill in the project-creation form as:

| Field | Value |
|---|---|
| Project name | `traveltech-hub` (or whatever you prefer) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` (prefilled by default - leave it) |
| Path | `/` |

`npx wrangler deploy` reads `wrangler.jsonc` automatically and needs no separate Cloudflare API
token when run from Cloudflare's own build environment - authentication is handled for you there.

`wrangler` is pinned to major version 3 in `package.json` (not the latest v4, which requires
Node.js >= 22) since the exact Node version Cloudflare's build image uses by default wasn't
verified against v4's requirement - v3 was confirmed working via `npx wrangler deploy --dry-run`
against a real build. If a build fails on an unrelated Node-version error, either set a
`NODE_VERSION` build environment variable to `22` and upgrade to `wrangler@4`, or leave v3 as is.

## Environment variables

Settings -> Environment variables, for both **Production** and **Preview**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Do **not** set any of these in Cloudflare (or anywhere else in frontend build config):

```
SUPABASE_SERVICE_ROLE_KEY
Database password
JWT secret
```

This app only ever needs the public URL and publishable key - every table is protected by Row
Level Security, so there's no privileged key for the frontend to hold.

## SPA routing

**Workers/Wrangler** (what this repo is actually deployed with): `wrangler.jsonc`'s
`assets.not_found_handling: "single-page-application"` handles it natively - no `_redirects` file
needed or wanted here.

There used to be a `public/_redirects` file (`/* /index.html 200`) for the classic-Pages path, but
it was removed - under Workers Assets it actively breaks the deploy (`Invalid _redirects
configuration: Infinite loop detected...`, error code 100324), since it conflicts with Workers
Assets' own automatic HTML/index handling on top of `not_found_handling`. **If you ever deploy via
classic Pages instead**, re-add `public/_redirects` with that one line yourself - the two
mechanisms are mutually exclusive, not additive, so the repo only ships the one that matches how
it's actually being deployed.

Combined with `BrowserRouter` (see `src/main.jsx`), this means `/pms`, `/vendor/some-slug`,
`/dashboard`, `/admin`, etc. all work on a hard refresh, not just via in-app navigation.

## Auth redirect URLs

Once you know your `*.pages.dev` URL (and later your custom domain), add both to Supabase
Dashboard -> Authentication -> URL Configuration -> Redirect URLs (see
[supabase-setup.md](./supabase-setup.md) step 5):

```
https://YOUR-PROJECT-NAME.pages.dev/**
https://travelpin.space/**
```

Set **Site URL** to the final production domain once one is live.

## Relationship to the existing GitHub Pages deployment

This repo keeps **both** deployment targets rather than retiring GitHub Pages:

- **Cloudflare Pages** (this doc): auto-deploys from `main` via Cloudflare's own Git integration -
  no workflow file needed, configured entirely in the Cloudflare dashboard as above.
- **GitHub Pages** (`.github/workflows/deploy.yml`): still builds and deploys on every push to
  `main`, now with `VITE_BASE_PATH=/traveltech-hub/` set so the build matches the GitHub Pages
  project subpath, plus the two Supabase repo secrets. `public/404.html` + a matching decode
  script in `index.html` implement the standard
  [spa-github-pages](https://github.com/rafgraph/spa-github-pages) redirect trick so deep links
  survive a refresh there too, since GitHub Pages (unlike Cloudflare) has no server-side rewrite
  support.

Both can run at once without conflict - they're two independent hosting targets building from the
same `main` branch with different `VITE_BASE_PATH` values.
