// Admin moderation actions. Every mutation here is a thin wrapper around a
// SECURITY DEFINER RPC that re-checks is_admin() itself - these functions
// are convenience only, not the security boundary (RLS + the RPCs are).

import { supabase } from '../lib/supabase.js'
import { mapListingRow, mapCategoryRow, LISTING_SELECT } from './listingMapper.js'

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
