#!/usr/bin/env node
// Generates a standalone seed file for ONE category from src/data/<category>.json,
// instead of the full supabase/seed.sql (which re-upserts every category/listing/
// news/event row and is meant to be regenerated wholesale via `npm run seed:generate`).
//
// Use this when you've added a brand-new category after the main seed.sql has
// already been applied to production, and you don't want to re-run the entire
// file again (safe either way since it's idempotent, but this keeps the diff to
// exactly what's new).
//
// Usage: node scripts/generate-category-seed.mjs <categoryId>
// Example: node scripts/generate-category-seed.mjs travel-tech-marketing

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(rootDir, 'src', 'data')

const { CATEGORIES } = await import(path.join(rootDir, 'src', 'config', 'categories.js'))
const { slugify } = await import(path.join(rootDir, 'src', 'utils', 'slug.js'))

const categoryId = process.argv[2]
if (!categoryId) {
  console.error('Usage: node scripts/generate-category-seed.mjs <categoryId>')
  process.exit(1)
}
const category = CATEGORIES.find((c) => c.id === categoryId)
if (!category) {
  console.error(`No category with id "${categoryId}" in src/config/categories.js`)
  process.exit(1)
}

const outFile = path.join(rootDir, 'supabase', `seed-${categoryId}.sql`)

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

function categoryRowSql(c) {
  const displayOrder = CATEGORIES.findIndex((x) => x.id === c.id)
  return `
insert into public.categories (id, name, short_name, route, description, color, icon, display_order, is_active)
values
  (${sqlString(c.id)}, ${sqlString(c.name)}, ${sqlString(c.shortName)}, ${sqlString(c.route)}, ${sqlString(c.description)}, ${sqlString(c.color)}, ${sqlString(c.icon)}, ${displayOrder}, true)
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

// The `slug` column is unique across ALL categories (not just within one),
// and a handful of vendors are legitimately cross-listed under two
// categories with the same name (e.g. Vizergy appears under both
// "Hotel CRM & Email Marketing" and "Travel Tech Marketing"). Pre-seed
// usedSlugs with every other category's slugs, in the same array order
// generate-seed.mjs uses, so collisions resolve to the identical
// "name-2" suffix the full seed.sql already assigned - producing slugs
// that either match what's already live, or are novel and conflict-free.
for (const other of CATEGORIES) {
  if (other.id === category.id) continue
  const otherFile = path.join(dataDir, `${other.dataFile}.json`)
  const otherRaw = JSON.parse(readFileSync(otherFile, 'utf-8'))
  for (const listing of otherRaw.listings ?? []) {
    uniqueSlug(String(listing.name || '').slice(0, 200))
  }
}

const file = path.join(dataDir, `${category.dataFile}.json`)
const raw = JSON.parse(readFileSync(file, 'utf-8'))
const listings = raw.listings ?? []

const blocks = []
let totalListings = 0
for (const listing of listings) {
  const block = listingBlock(listing, category.id)
  if (block) {
    blocks.push(block)
    totalListings += 1
  }
}

const header = `-- TravelTech Hub - single-category seed data: ${category.name}
--
-- Generated by scripts/generate-category-seed.mjs from src/config/categories.js
-- and src/data/${category.dataFile}.json. Do not hand-edit - rerun
-- \`node scripts/generate-category-seed.mjs ${category.id}\` instead.
--
-- Unlike supabase/seed.sql (which re-upserts every category, listing, news
-- and event row), this file touches ONLY the "${category.name}" category row
-- and its listings, so it's safe to run against a production database that
-- already has the full seed.sql applied without re-touching anything else.
--
-- Run this against a project that already has 001_initial_schema.sql
-- applied, using a role that bypasses RLS (the Supabase SQL Editor and
-- \`supabase db push\` both connect as the "postgres" role, which does).
--
-- Idempotent: the category is upserted on its primary key, and each listing
-- is upserted on its unique (legacy_id, category_id) pair, with child rows
-- (features/usps/products/target markets) deleted and reinserted in the same
-- statement - safe to rerun.
--
-- Data-quality note: the source JSON explicitly disclaims that email and
-- phone values are plausible placeholder-format examples, not verified
-- contact details (see the "_comment" field in src/data/${category.dataFile}.json).
-- Every seeded listing therefore gets email = null, phone = null, and
-- contact_verified = false regardless of what the source JSON contained.
--
-- Category: ${category.name}   Listings: ${totalListings}

begin;
`

const footer = `
commit;
`

writeFileSync(outFile, header + categoryRowSql(category) + blocks.join('\n') + footer, 'utf-8')

console.log(`Wrote ${outFile}`)
console.log(`Category: ${category.name} (${category.id})`)
console.log(`Listings: ${totalListings}`)
if (warnings.length) {
  console.log(`\n${warnings.length} normalization warning(s):`)
  for (const w of warnings) console.log(`  - ${w}`)
}
