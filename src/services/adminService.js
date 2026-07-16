// Admin moderation actions. Every mutation here is a thin wrapper around a
// SECURITY DEFINER RPC that re-checks is_admin() itself - these functions
// are convenience only, not the security boundary (RLS + the RPCs are).

import { supabase } from '../lib/supabase.js'
import { mapListingRow, mapCategoryRow, LISTING_SELECT } from './listingMapper.js'
import { mapNewsRow, mapEventRow, NEWS_SELECT, EVENTS_SELECT } from './contentMapper.js'
import { mapJobRow, JOB_SELECT } from './jobMapper.js'

const CATEGORY_EMBED = 'categories(id, name, short_name, route, color, icon)'

function toFriendlyError(error) {
  if (!error) return new Error('Something went wrong. Please try again.')
  if (['22023', '28000', '42501'].includes(error.code)) return new Error(error.message)
  console.error('Supabase error:', error)
  return new Error('Something went wrong. Please try again.')
}

function mapWithCategory(rows) {
  return (rows ?? []).map((row) => {
    const { categories, ...listingRow } = row
    return {
      ...mapListingRow(listingRow, { redactContact: false }),
      category: categories ? mapCategoryRow(categories) : null,
    }
  })
}

/** All pending listings, oldest submission first (the moderation queue). */
export async function getPendingListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(`${LISTING_SELECT}, ${CATEGORY_EMBED}`)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  if (error) throw toFriendlyError(error)
  return mapWithCategory(data)
}

/** All listings, optionally filtered by status and/or a name/description search term. */
export async function getAllListings({ status, search } = {}) {
  let query = supabase
    .from('listings')
    .select(`${LISTING_SELECT}, ${CATEGORY_EMBED}`)
    .order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const q = search?.trim()
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`)
  }
  const { data, error } = await query
  if (error) throw toFriendlyError(error)
  return mapWithCategory(data)
}

/** One listing by id, any status, contact details unredacted (admin review view). */
export async function getListingByIdForAdmin(id) {
  const { data, error } = await supabase
    .from('listings')
    .select(`${LISTING_SELECT}, ${CATEGORY_EMBED}`)
    .eq('id', id)
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  if (!data) return null
  const { categories, ...row } = data
  return { ...mapListingRow(row, { redactContact: false }), category: categories ? mapCategoryRow(categories) : null }
}

export async function approveListing(id) {
  const { error } = await supabase.rpc('approve_listing', { p_id: id })
  if (error) throw toFriendlyError(error)
}

export async function rejectListing(id, reason) {
  const { error } = await supabase.rpc('reject_listing', { p_id: id, p_reason: reason })
  if (error) throw toFriendlyError(error)
}

export async function archiveListing(id) {
  const { error } = await supabase.rpc('archive_listing', { p_id: id })
  if (error) throw toFriendlyError(error)
}

export async function setListingFeatured(id, featured) {
  const { error } = await supabase.rpc('set_listing_featured', { p_id: id, p_featured: featured })
  if (error) throw toFriendlyError(error)
}

export async function setListingVerified(id, verified) {
  const { error } = await supabase.rpc('set_listing_verified', { p_id: id, p_verified: verified })
  if (error) throw toFriendlyError(error)
}

// News moderation --------------------------------------------------------

/** All pending news items, oldest submission first (the moderation queue). */
export async function getPendingNews() {
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SELECT)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapNewsRow)
}

/** All news items, optionally filtered by status and/or a title/summary search term. */
export async function getAllNews({ status, search } = {}) {
  let query = supabase.from('news').select(NEWS_SELECT).order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const q = search?.trim()
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
    query = query.or(`title.ilike.${pattern},summary.ilike.${pattern}`)
  }
  const { data, error } = await query
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapNewsRow)
}

/** One news item by id, any status (admin review view). */
export async function getNewsByIdForAdmin(id) {
  const { data, error } = await supabase.from('news').select(NEWS_SELECT).eq('id', id).maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapNewsRow(data) : null
}

export async function approveNews(id) {
  const { error } = await supabase.rpc('approve_news', { p_id: id })
  if (error) throw toFriendlyError(error)
}

export async function rejectNews(id, reason) {
  const { error } = await supabase.rpc('reject_news', { p_id: id, p_reason: reason })
  if (error) throw toFriendlyError(error)
}

export async function archiveNews(id) {
  const { error } = await supabase.rpc('archive_news', { p_id: id })
  if (error) throw toFriendlyError(error)
}

// Event moderation --------------------------------------------------------

/** All pending events, oldest submission first (the moderation queue). */
export async function getPendingEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(EVENTS_SELECT)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapEventRow)
}

/** All events, optionally filtered by status and/or a name/description search term. */
export async function getAllEvents({ status, search } = {}) {
  let query = supabase.from('events').select(EVENTS_SELECT).order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const q = search?.trim()
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
    query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`)
  }
  const { data, error } = await query
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapEventRow)
}

/** One event by id, any status (admin review view). */
export async function getEventByIdForAdmin(id) {
  const { data, error } = await supabase.from('events').select(EVENTS_SELECT).eq('id', id).maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapEventRow(data) : null
}

export async function approveEvent(id) {
  const { error } = await supabase.rpc('approve_event', { p_id: id })
  if (error) throw toFriendlyError(error)
}

export async function rejectEvent(id, reason) {
  const { error } = await supabase.rpc('reject_event', { p_id: id, p_reason: reason })
  if (error) throw toFriendlyError(error)
}

export async function archiveEvent(id) {
  const { error } = await supabase.rpc('archive_event', { p_id: id })
  if (error) throw toFriendlyError(error)
}

// Job moderation --------------------------------------------------------

const JOB_LISTING_EMBED = 'listings(id, name, slug, logo_url, logo_initials)'

/** All pending jobs, oldest submission first (the moderation queue). */
export async function getPendingJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select(`${JOB_SELECT}, ${JOB_LISTING_EMBED}`)
    .eq('status', 'pending')
    .order('submitted_at', { ascending: true })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapJobRow)
}

/** All jobs, optionally filtered by status and/or a title/description search term. */
export async function getAllJobs({ status, search } = {}) {
  let query = supabase.from('jobs').select(`${JOB_SELECT}, ${JOB_LISTING_EMBED}`).order('created_at', { ascending: false })
  if (status) query = query.eq('status', status)
  const q = search?.trim()
  if (q) {
    const pattern = `%${q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`
    query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`)
  }
  const { data, error } = await query
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapJobRow)
}

/** One job by id, any status (admin review view). */
export async function getJobByIdForAdmin(id) {
  const { data, error } = await supabase.from('jobs').select(`${JOB_SELECT}, ${JOB_LISTING_EMBED}`).eq('id', id).maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapJobRow(data) : null
}

export async function approveJob(id) {
  const { error } = await supabase.rpc('approve_job', { p_id: id })
  if (error) throw toFriendlyError(error)
}

export async function rejectJob(id, reason) {
  const { error } = await supabase.rpc('reject_job', { p_id: id, p_reason: reason })
  if (error) throw toFriendlyError(error)
}

export async function archiveJob(id) {
  const { error } = await supabase.rpc('archive_job', { p_id: id })
  if (error) throw toFriendlyError(error)
}
