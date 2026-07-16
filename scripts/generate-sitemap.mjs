#!/usr/bin/env node
// Generates dist/sitemap.xml after `vite build` - a static build output, not
// a source file, so nothing here needs to be committed or gitignored. Runs
// as the second step of `npm run build` (see package.json).
//
// Includes static routes (home, categories, news, events, jobs) plus one
// entry per approved listing and one per approved+still-open job, fetched
// straight from Supabase using the same public URL/key the app itself ships
// to the browser (every table is RLS-protected, so this is exactly as safe
// as the client querying it directly).
//
// If Supabase env vars are missing (e.g. a local build without .env.local),
// this still emits a sitemap with just the static routes rather than failing
// the build - matches the "never hard-crash on missing config" pattern in
// src/lib/supabase.js.

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outFile = path.join(rootDir, 'dist', 'sitemap.xml')

const { CATEGORIES } = await import(path.join(rootDir, 'src', 'config', 'categories.js'))
const { SITE_URL } = await import(path.join(rootDir, 'src', 'config', 'site.js'))

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

async function fetchListings() {
  if (!url || !key) {
    console.warn('[generate-sitemap] VITE_SUPABASE_URL/VITE_SUPABASE_PUBLISHABLE_KEY not set - emitting static routes only.')
    return []
  }
  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('listings').select('slug, updated_at').eq('status', 'approved')
  if (error) {
    console.warn(`[generate-sitemap] Failed to fetch listings (${error.message}) - emitting static routes only.`)
    return []
  }
  return data ?? []
}

async function fetchJobs() {
  if (!url || !key) return []
  const supabase = createClient(url, key)
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('jobs')
    .select('id, updated_at')
    .eq('status', 'approved')
    .or(`closes_at.is.null,closes_at.gte.${today}`)
  if (error) {
    console.warn(`[generate-sitemap] Failed to fetch jobs (${error.message}) - omitting job pages.`)
    return []
  }
  return data ?? []
}

function urlEntry(loc, lastmod) {
  return lastmod
    ? `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>\n  </url>`
    : `  <url>\n    <loc>${loc}</loc>\n  </url>`
}

const [listings, jobs] = await Promise.all([fetchListings(), fetchJobs()])

const staticRoutes = ['/', '/news', '/events', '/jobs', ...CATEGORIES.map((c) => c.route)]
const entries = [
  ...staticRoutes.map((route) => urlEntry(`${SITE_URL}${route}`)),
  ...listings.map((l) => urlEntry(`${SITE_URL}/vendor/${l.slug}`, l.updated_at)),
  ...jobs.map((j) => urlEntry(`${SITE_URL}/jobs/${j.id}`, j.updated_at)),
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`

writeFileSync(outFile, xml)
console.log(`[generate-sitemap] Wrote ${entries.length} URLs to ${path.relative(rootDir, outFile)}`)
