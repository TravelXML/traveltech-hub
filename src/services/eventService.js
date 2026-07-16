// Data-access layer for travel events - submission, the current user's own
// submissions, and moderation reads live in adminService.js. Mirrors
// listingService.js's shape for listings.

import { supabase } from '../lib/supabase.js'
import { mapEventRow, EVENTS_SELECT } from './contentMapper.js'
import { verifyCaptcha } from './captchaService.js'

const SAFE_ERROR_CODES = new Set(['22023', '28000', '42501'])

function toFriendlyError(error) {
  if (!error) return new Error('Something went wrong. Please try again.')
  if (SAFE_ERROR_CODES.has(error.code)) return new Error(error.message)
  console.error('Supabase error:', error)
  return new Error('Something went wrong. Please try again.')
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

/** Approved events, soonest first. */
export async function getEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(EVENTS_SELECT)
    .eq('status', 'approved')
    .order('start_date', { ascending: true })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapEventRow)
}

/** Searches approved events by name, host, description and location. */
export async function searchEvents(query) {
  const q = query.trim().toLowerCase()
  const items = await getEvents()
  if (!q) return items
  return items.filter((item) =>
    [item.name, item.host, item.description, item.city, item.country].join(' ').toLowerCase().includes(q)
  )
}

/**
 * Submits an event for review. Requires an authenticated session; the
 * submit_event() RPC forces owner_id/status server-side regardless of
 * payload content. Verifies a Turnstile token first when configured - same
 * pattern as listingService.submitListing().
 */
export async function submitEvent(payload, captchaToken) {
  if (import.meta.env.VITE_TURNSTILE_SITE_KEY) await verifyCaptcha(captchaToken)
  const { data, error } = await supabase.rpc('submit_event', { payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** All of the current user's own event submissions, any status. */
export async function getMyEvents() {
  const userId = await currentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('events')
    .select(EVENTS_SELECT)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapEventRow)
}

/** One of the current user's own events by id, or null if not theirs. */
export async function getMyEventById(id) {
  const userId = await currentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('events')
    .select(EVENTS_SELECT)
    .eq('id', id)
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapEventRow(data) : null
}

/** Updates an editable (draft/pending/rejected) event owned by the current user. */
export async function updateMyEvent(id, payload) {
  const { data, error } = await supabase.rpc('update_my_event', { p_id: id, payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** Moves a rejected event owned by the current user back to pending. */
export async function resubmitEvent(id) {
  const { error } = await supabase.rpc('resubmit_event', { p_id: id })
  if (error) throw toFriendlyError(error)
  return { success: true }
}
