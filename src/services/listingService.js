// Single data-access layer for all listing data - now backed by Supabase
// instead of static JSON. Every component/page/hook still goes through this
// module, so callers didn't need to change beyond adapting to the couple of
// return-shape differences noted per function below.

import { supabase } from '../lib/supabase.js'
import { mapListingRow, mapCategoryRow, LISTING_SELECT } from './listingMapper.js'
import { verifyCaptcha } from './captchaService.js'
import newsData from '../data/news.json'
import eventsData from '../data/events.json'

const DEFAULT_PAGE_SIZE = 100
const SEARCH_RESULT_LIMIT = 30

function escapeIlike(value) {
  return value.replace(/[%_\\]/g, (m) => `\\${m}`)
}

// Our own RPCs raise exceptions with deliberately user-safe messages using
// these Postgres error codes (see supabase/migrations/001_initial_schema.sql):
// 22023 validation, 28000 auth required, 42501 permission denied. Anything
// else is an unexpected/internal error - log it for debugging but never
// show raw database internals to the user.
const SAFE_ERROR_CODES = new Set(['22023', '28000', '42501'])

function toFriendlyError(error) {
  if (!error) return new Error('Something went wrong. Please try again.')
  if (SAFE_ERROR_CODES.has(error.code)) return new Error(error.message)
  if (error.code === '23505') return new Error('That value is already in use. Please try something different.')
  console.error('Supabase error:', error)
  return new Error('Something went wrong. Please try again.')
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

/**
 * Returns the full active category registry, each enriched with its live
 * approved-listing count. Same shape as before: id, name, shortName,
 * route, description, color, icon, listingCount.
 */
export async function getCategories() {
  const [{ data: categories, error: catError }, { data: counts, error: countError }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('listings').select('category_id').eq('status', 'approved'),
  ])
  if (catError) throw toFriendlyError(catError)
  if (countError) throw toFriendlyError(countError)

  const countMap = new Map()
  for (const row of counts ?? []) {
    countMap.set(row.category_id, (countMap.get(row.category_id) ?? 0) + 1)
  }
  return (categories ?? []).map((c) => mapCategoryRow(c, countMap.get(c.id) ?? 0))
}

/**
 * Returns approved listings for a category.
 *
 * @param {string} categoryId
 * @param {object} [options]
 * @param {string} [options.search]
 * @param {string} [options.pricingModel]
 * @param {string} [options.priceRange]
 * @param {string[]} [options.targetMarkets]
 * @param {'name-asc'|'founded-asc'} [options.sort]
 * @param {number} [options.page] - 1-indexed
 * @param {number} [options.pageSize]
 * @returns {Promise<{listings: object[], total: number}>}
 *
 * Note: the return shape changed from a plain array (static-JSON era) to
 * `{ listings, total }` so pagination has somewhere to put the total count.
 * CategoryPage.jsx calls this with no options (pageSize defaults to 100,
 * comfortably above any category's ~15-20 listings) and keeps doing its
 * own client-side search/filter/sort via useListingFilters, unchanged -
 * these server-side options exist for future server-driven views.
 */
export async function getListings(categoryId, options = {}) {
  const { search = '', pricingModel, priceRange, targetMarkets, sort = 'name-asc', page = 1, pageSize = DEFAULT_PAGE_SIZE } = options

  let query = supabase
    .from('listings')
    .select(LISTING_SELECT, { count: 'exact' })
    .eq('category_id', categoryId)
    .eq('status', 'approved')

  const q = search.trim()
  if (q) {
    const pattern = `%${escapeIlike(q)}%`
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern},headquarters.ilike.${pattern}`)
  }
  if (pricingModel) query = query.eq('pricing_model', pricingModel)
  if (priceRange) query = query.eq('price_range', priceRange)

  if (targetMarkets?.length) {
    const { data: marketRows, error: marketError } = await supabase
      .from('listing_target_markets')
      .select('listing_id')
      .in('value', targetMarkets)
    if (marketError) throw toFriendlyError(marketError)
    const ids = [...new Set((marketRows ?? []).map((r) => r.listing_id))]
    if (ids.length === 0) return { listings: [], total: 0 }
    query = query.in('id', ids)
  }

  query = query.order(sort === 'founded-asc' ? 'founded' : 'name', { ascending: true, nullsFirst: false })

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw toFriendlyError(error)
  return { listings: (data ?? []).map((row) => mapListingRow(row)), total: count ?? 0 }
}

/**
 * Returns one approved listing (with category + all child data) by slug,
 * or null when not found or not public.
 */
export async function getListingBySlug(slug) {
  const { data, error } = await supabase
    .from('listings')
    .select(`${LISTING_SELECT}, categories(id, name, short_name, route, color, icon)`)
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  if (!data) return null
  const { categories, ...row } = data
  return { ...mapListingRow(row), category: categories ? mapCategoryRow(categories) : null }
}

/**
 * Searches approved listings by name, description, headquarters and
 * products. Capped at SEARCH_RESULT_LIMIT results, each with its category
 * attached (matches Hero.jsx's expectations).
 */
export async function searchAll(query) {
  const q = query.trim()
  if (!q) return []

  const pattern = `%${escapeIlike(q)}%`
  const categorySelect = 'categories(id, name, short_name, route, color, icon)'

  const [{ data: directHits, error: directError }, { data: productHits, error: productError }] = await Promise.all([
    supabase
      .from('listings')
      .select(`${LISTING_SELECT}, ${categorySelect}`)
      .eq('status', 'approved')
      .or(`name.ilike.${pattern},description.ilike.${pattern},headquarters.ilike.${pattern}`)
      .limit(SEARCH_RESULT_LIMIT),
    // LISTING_SELECT already embeds `listing_products` once (for the
    // mapped listing.products field) - embedding it again unaliased for
    // this inner-join filter is ambiguous to PostgREST and errors with
    // "aggregate functions are not allowed...". Alias this one so both
    // embeds of the same relation coexist in one select.
    supabase
      .from('listings')
      .select(`${LISTING_SELECT}, ${categorySelect}, product_match:listing_products!inner(value)`)
      .eq('status', 'approved')
      .ilike('product_match.value', pattern)
      .limit(SEARCH_RESULT_LIMIT),
  ])
  if (directError) throw toFriendlyError(directError)
  if (productError) throw toFriendlyError(productError)

  const seen = new Map()
  for (const row of [...(directHits ?? []), ...(productHits ?? [])]) {
    if (seen.has(row.id)) continue
    const { categories, ...listingRow } = row
    seen.set(row.id, { ...mapListingRow(listingRow), category: categories ? mapCategoryRow(categories) : null })
  }
  return [...seen.values()].slice(0, SEARCH_RESULT_LIMIT)
}

/**
 * Submits a new business listing for review. Requires an authenticated
 * session; the submit_listing() RPC forces owner_id/status and every
 * privileged field to safe defaults server-side regardless of payload
 * content.
 *
 * Verifies a Turnstile token server-side first (only when Turnstile is
 * actually configured - see .env.example - so submission still works before
 * that's set up). Unlike login/signup this isn't an auth call, so there's no
 * native captchaToken hook; see captchaService.js for the caveat that this
 * stops naive bots, not a caller invoking the RPC directly.
 */
export async function submitListing(payload, captchaToken) {
  if (import.meta.env.VITE_TURNSTILE_SITE_KEY) await verifyCaptcha(captchaToken)
  const { data, error } = await supabase.rpc('submit_listing', { payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** All of the current user's own listings, any status, contact details unredacted. */
export async function getMyListings() {
  const userId = await currentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map((row) => mapListingRow(row, { redactContact: false }))
}

/** One of the current user's own listings by id, or null if it's not theirs. */
export async function getMyListingById(id) {
  const userId = await currentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_SELECT)
    .eq('id', id)
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapListingRow(data, { redactContact: false }) : null
}

/** Updates an editable (draft/pending/rejected) listing owned by the current user. */
export async function updateMyListing(id, payload) {
  const { data, error } = await supabase.rpc('update_my_listing', { p_id: id, payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** Moves a rejected listing owned by the current user back to pending. */
export async function resubmitListing(id) {
  const { error } = await supabase.rpc('resubmit_listing', { p_id: id })
  if (error) throw toFriendlyError(error)
  return { success: true }
}

/**
 * Sets logo_url on a listing owned by the current user. A direct table
 * update (not an RPC) is fine here: the listings_update_owner RLS policy
 * already permits owners to update their own draft/pending/rejected rows,
 * and logo_url isn't one of the fields protect_listing_privileged_fields()
 * guards.
 */
export async function setMyListingLogo(id, logoUrl) {
  const { error } = await supabase.from('listings').update({ logo_url: logoUrl }).eq('id', id)
  if (error) throw toFriendlyError(error)
}

/**
 * Returns all travel news items, most recent first.
 * (Unchanged - out of scope for the Supabase migration; still static JSON.)
 */
export async function getNews() {
  const items = newsData?.items ?? []
  return [...items].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate))
}

/** Searches news items by title, summary and tags. */
export async function searchNews(query) {
  const q = query.trim().toLowerCase()
  const items = await getNews()
  if (!q) return items
  return items.filter((item) =>
    [item.title, item.summary, ...(item.tags ?? [])].join(' ').toLowerCase().includes(q)
  )
}

/** Returns all travel industry events, soonest first. */
export async function getEvents() {
  const items = eventsData?.items ?? []
  return [...items].sort((a, b) => a.startDate.localeCompare(b.startDate))
}

/** Searches events by name, host, description and location. */
export async function searchEvents(query) {
  const q = query.trim().toLowerCase()
  const items = await getEvents()
  if (!q) return items
  return items.filter((item) =>
    [item.name, item.host, item.description, item.city, item.country].join(' ').toLowerCase().includes(q)
  )
}
