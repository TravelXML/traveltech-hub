#!/usr/bin/env node
// Generates supabase/seed.sql from src/config/categories.js + src/data/*.json.
//
// Run with `npm run seed:generate` any time the static JSON data changes and
// you want to refresh the seed file. The output is idempotent (safe to run
// against a live database repeatedly - see the ON CONFLICT clauses) and is
// meant to be executed by a role that bypasses RLS (the `postgres` role via
// the Supabase SQL Editor or `supabase db push` - see docs/supabase-setup.md).
//
// IMPORTANT data-quality decision (see the header comment written into the
// generated file): every JSON file under src/data/ carries a `_comment`
// disclaiming that email/phone values are plausible placeholder-format
// examples, not verified contact details. Seeded listings therefore always
// get email = null, phone = null, and contact_verified = false, so the UI
// never presents unverified placeholder contact info as real.

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(rootDir, 'src', 'data')
const outFile = path.join(rootDir, 'supabase', 'seed.sql')

const { CATEGORIES } = await import(path.join(rootDir, 'src', 'config', 'categories.js'))
const { slugify } = await import(path.join(rootDir, 'src', 'utils', 'slug.js'))

const ALLOWED_PRICING_MODELS = new Set([
  'Subscription',
  'Per Booking',
  'Commission',
  'Freemium',
  'Enterprise/Custom',
])
const ALLOWED_PRICE_RANGES = new Set(['$', '$$', '$$$'])

const usedSlugs = new Set()
const warnings = []

function uniqueSlug(name) {
  const base = slugify(name)
  let candidate = base
  let suffix = 1
  while (usedSlugs.has(candidate)) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  usedSlugs.add(candidate)
  return candidate
}

function sqlString(value) {
  if (value === null || value === undefined || value === '') return 'null'
  return `'${String(value).replace(/'/g, "''")}'`
}

function sqlNumber(value) {
  if (value === null || value === undefined || value === '') return 'null'
  const n = Number(value)
  return Number.isFinite(n) ? String(n) : 'null'
}

function sqlBool(value) {
  return value ? 'true' : 'false'
}

function normalizeWebsite(website, legacyId) {
  if (website && /^https?:\/\//i.test(website)) return website
  if (website) warnings.push(`${legacyId}: dropped invalid website "${website}"`)
  return null
}

function normalizePricingModel(value, legacyId) {
  if (!value) return null
  if (ALLOWED_PRICING_MODELS.has(value)) return value
  warnings.push(`${legacyId}: dropped unrecognized pricingModel "${value}"`)
  return null
}

function normalizePriceRange(value, legacyId) {
  if (!value) return null
  if (ALLOWED_PRICE_RANGES.has(value)) return value
  warnings.push(`${legacyId}: dropped unrecognized priceRange "${value}"`)
  return null
}

function normalizeInitials(value, legacyId) {
  if (!value) return null
  if (value.length <= 4) return value
  warnings.push(`${legacyId}: truncated logoInitials "${value}"`)
  return value.slice(0, 4)
}

function normalizeFounded(value, legacyId) {
  if (value === undefined || value === null || value === '') return null
  const year = Number(value)
  if (!Number.isFinite(year) || year < 1800 || year > 2100) {
    warnings.push(`${legacyId}: dropped out-of-range founded "${value}"`)
    return null
  }
  return year
}

function sqlTextArray(values) {
  const cleaned = (values ?? []).filter((v) => typeof v === 'string' && v.trim().length > 0)
  if (cleaned.length === 0) return "'{}'::text[]"
  return `array[${cleaned.map((v) => sqlString(v)).join(', ')}]::text[]`
}

function newsBlock(item) {
  return `
insert into public.news (
  legacy_id, owner_id, title, summary, source, source_url, category, tags, published_date,
  status, submitted_at, approved_at
) values (
  ${sqlString(item.id)}, null, ${sqlString(item.title)}, ${sqlString(item.summary)},
  ${sqlString(item.source)}, ${sqlString(item.sourceUrl)}, ${sqlString(item.category)},
  ${sqlTextArray(item.tags)}, ${sqlString(item.publishedDate)}::date,
  'approved', now(), now()
)
on conflict (legacy_id) do update set
  title = excluded.title,
  summary = excluded.summary,
  source = excluded.source,
  source_url = excluded.source_url,
  category = excluded.category,
  tags = excluded.tags,
  published_date = excluded.published_date;
`
}

function eventBlock(item) {
  return `
insert into public.events (
  legacy_id, owner_id, name, host, description, start_date, end_date, city, country, venue, format,
  audience, website, status, submitted_at, approved_at
) values (
  ${sqlString(item.id)}, null, ${sqlString(item.name)}, ${sqlString(item.host)}, ${sqlString(item.description)},
  ${sqlString(item.startDate)}::date, ${sqlString(item.endDate)}::date,
  ${sqlString(item.city)}, ${sqlString(item.country)}, ${sqlString(item.venue)}, ${sqlString(item.format)},
  ${sqlString(item.audience)}, ${sqlString(item.website)},
  'approved', now(), now()
)
on conflict (legacy_id) do update set
  name = excluded.name,
  host = excluded.host,
  description = excluded.description,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  city = excluded.city,
  country = excluded.country,
  venue = excluded.venue,
  format = excluded.format,
  audience = excluded.audience,
  website = excluded.website;
`
}

function childValuesBlock(listingIdVar, tableName, values, includeOrder) {
  const cleaned = (values ?? []).filter((v) => typeof v === 'string' && v.trim().length > 0)
  if (cleaned.length === 0) return ''
  const rows = cleaned
    .map((v, i) =>
      includeOrder
        ? `    (${listingIdVar}, ${sqlString(v.slice(0, 200))}, ${i})`
        : `    (${listingIdVar}, ${sqlString(v.slice(0, 100))})`
    )
    .join(',\n')
  const cols = includeOrder ? '(listing_id, value, display_order)' : '(listing_id, value)'
  return `  insert into public.${tableName} ${cols} values\n${rows};\n`
}

function listingBlock(listing, categoryId) {
  const legacyId = listing.id
  const name = String(listing.name || '').slice(0, 200)
  const slug = uniqueSlug(name)
  const description = String(listing.description || '')
  const website = normalizeWebsite(listing.website, legacyId)
  const pricingModel = normalizePricingModel(listing.pricingModel, legacyId)
  const priceRange = normalizePriceRange(listing.priceRange, legacyId)
  const logoInitials = normalizeInitials(listing.logoInitials, legacyId)
  const founded = normalizeFounded(listing.founded, legacyId)
  const headquarters = listing.headquarters ? String(listing.headquarters).slice(0, 200) : null

  if (description.length < 20) {
    warnings.push(`${legacyId}: description shorter than 20 chars, skipping record`)
    return null
  }

  return `
do $seed_listing$
declare
  v_listing_id uuid;
begin
  insert into public.listings (
    legacy_id, owner_id, category_id, name, slug, logo_initials, description,
    pricing_model, price_range, email, phone, website, headquarters, founded,
    status, featured, verified, contact_verified, submitted_at, approved_at
  ) values (
    ${sqlString(legacyId)}, null, ${sqlString(categoryId)}, ${sqlString(name)}, ${sqlString(slug)},
    ${sqlString(logoInitials)}, ${sqlString(description)},
    ${sqlString(pricingModel)}, ${sqlString(priceRange)}, null, null,
    ${sqlString(website)}, ${sqlString(headquarters)}, ${sqlNumber(founded)},
    'approved', false, false, false, now(), now()
  )
  on conflict (legacy_id, category_id) do update set
    category_id = excluded.category_id,
    name = excluded.name,
    slug = excluded.slug,
    logo_initials = excluded.logo_initials,
    description = excluded.description,
    pricing_model = excluded.pricing_model,
    price_range = excluded.price_range,
    email = excluded.email,
    phone = excluded.phone,
    website = excluded.website,
    headquarters = excluded.headquarters,
    founded = excluded.founded,
    status = excluded.status,
    contact_verified = excluded.contact_verified
  returning id into v_listing_id;

  delete from public.listing_features where listing_id = v_listing_id;
${childValuesBlock('v_listing_id', 'listing_features', listing.features, true)}
  delete from public.listing_usps where listing_id = v_listing_id;
${childValuesBlock('v_listing_id', 'listing_usps', listing.usps, true)}
  delete from public.listing_products where listing_id = v_listing_id;
${childValuesBlock('v_listing_id', 'listing_products', listing.products, true)}
  delete from public.listing_target_markets where listing_id = v_listing_id;
${childValuesBlock('v_listing_id', 'listing_target_markets', listing.targetMarkets, false)}
end $seed_listing$;
`
}

function categoriesSql() {
  const rows = CATEGORIES.map(
    (c, i) => `  (${sqlString(c.id)}, ${sqlString(c.name)}, ${sqlString(c.shortName)}, ${sqlString(c.route)}, ${sqlString(c.description)}, ${sqlString(c.color)}, ${sqlString(c.icon)}, ${i}, true)`
  ).join(',\n')

  return `
insert into public.categories (id, name, short_name, route, description, color, icon, display_order, is_active)
values
${rows}
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  route = excluded.route,
  description = excluded.description,
  color = excluded.color,
  icon = excluded.icon,
  display_order = excluded.display_order,
  is_active = excluded.is_active;
`
}

const blocks = []
let totalListings = 0

for (const category of CATEGORIES) {
  const file = path.join(dataDir, `${category.dataFile}.json`)
  const raw = JSON.parse(readFileSync(file, 'utf-8'))
  const listings = raw.listings ?? []
  for (const listing of listings) {
    const block = listingBlock(listing, category.id)
    if (block) {
      blocks.push(block)
      totalListings += 1
    }
  }
}

const newsRaw = JSON.parse(readFileSync(path.join(dataDir, 'news.json'), 'utf-8'))
const newsItems = newsRaw.items ?? []
for (const item of newsItems) blocks.push(newsBlock(item))

const eventsRaw = JSON.parse(readFileSync(path.join(dataDir, 'events.json'), 'utf-8'))
const eventItems = eventsRaw.items ?? []
for (const item of eventItems) blocks.push(eventBlock(item))

const header = `-- TravelTech Hub - seed data
--
-- Generated by scripts/generate-seed.mjs from src/config/categories.js and
-- src/data/*.json. Do not hand-edit - rerun \`npm run seed:generate\` instead.
--
-- Run this against a project that already has 001_initial_schema.sql
-- applied, using a role that bypasses RLS (the Supabase SQL Editor and
-- \`supabase db push\` both connect as the "postgres" role, which does).
--
-- Idempotent: every listing is upserted on its unique (legacy_id, category_id)
-- pair (a handful of vendors are legitimately cross-listed under two
-- categories in the source data), and each
-- listing's child rows (features/usps/products/target markets) are deleted
-- and reinserted in the same statement, so rerunning this file never
-- creates duplicates.
--
-- Data-quality note: the source JSON files explicitly disclaim that email
-- and phone values are plausible placeholder-format examples, not verified
-- contact details (see the "_comment" field in each src/data/*.json file).
-- To avoid ever presenting placeholder data as real, every seeded listing
-- gets email = null, phone = null, and contact_verified = false regardless
-- of what the source JSON contained. Real websites are preserved. Vendors
-- keep showing logoInitials in the UI until a real logo is uploaded via
-- Supabase Storage.
--
-- News/events are seeded as pre-approved (status='approved', owner_id=null)
-- rows, upserted on their unique legacy_id - the same "editorial content"
-- treatment as seeded listings, distinct from user submissions which always
-- start status='pending' with a real owner_id (see submit_news()/
-- submit_event() in 002_news_events.sql).
--
-- Categories: ${CATEGORIES.length}   Listings: ${totalListings}   News: ${newsItems.length}   Events: ${eventItems.length}

begin;
`

const footer = `
commit;
`

writeFileSync(outFile, header + categoriesSql() + blocks.join('\n') + footer, 'utf-8')

console.log(`Wrote ${outFile}`)
console.log(`Categories: ${CATEGORIES.length}`)
console.log(`Listings: ${totalListings}`)
console.log(`News: ${newsItems.length}`)
console.log(`Events: ${eventItems.length}`)
if (warnings.length) {
  console.log(`\n${warnings.length} normalization warning(s):`)
  for (const w of warnings) console.log(`  - ${w}`)
}
