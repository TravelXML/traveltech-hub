# Cloudflare Pages deployment

## Project settings

When connecting the GitHub repo in the Cloudflare dashboard (Workers & Pages -> Create -> Pages ->
Connect to Git):

| Setting | Value |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |
| Production branch | `main` |

Do **not** set `VITE_BASE_PATH` here - leaving it unset means `vite.config.js` defaults `base` to
`/`, which is what Cloudflare Pages (served from its own domain root) needs. `VITE_BASE_PATH` is
only for the separate GitHub Pages build (see `.github/workflows/deploy.yml`).

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

`public/_redirects` (already in the repo, copied verbatim into `dist/` by Vite) handles deep-link
refreshes:

```
/* /index.html 200
```

Combined with `BrowserRouter` (see `src/main.jsx`), this means `/pms`, `/vendor/some-slug`,
`/dashboard`, `/admin`, etc. all work on a hard refresh, not just via in-app navigation.

## Auth redirect URLs

Once you know your `*.pages.dev` URL (and later your custom domain), add both to Supabase
Dashboard -> Authentication -> URL Configuration -> Redirect URLs (see
[supabase-setup.md](./supabase-setup.md) step 5):

```
https://YOUR-PROJECT-NAME.pages.dev/**
https://traveltech.startupctopro.in/**
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
