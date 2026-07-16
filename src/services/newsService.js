// Data-access layer for travel news - submission, the current user's own
// submissions, and moderation reads live in adminService.js. Mirrors
// listingService.js's shape for listings.

import { supabase } from '../lib/supabase.js'
import { mapNewsRow, NEWS_SELECT } from './contentMapper.js'
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

/** Approved news, most recently published first. */
export async function getNews() {
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SELECT)
    .eq('status', 'approved')
    .order('published_date', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapNewsRow)
}

/** Searches approved news by title, summary and tags. */
export async function searchNews(query) {
  const q = query.trim().toLowerCase()
  const items = await getNews()
  if (!q) return items
  return items.filter((item) =>
    [item.title, item.summary, ...(item.tags ?? [])].join(' ').toLowerCase().includes(q)
  )
}

/**
 * Submits a news item for review. Requires an authenticated session; the
 * submit_news() RPC forces owner_id/status server-side regardless of
 * payload content. Verifies a Turnstile token first when configured - same
 * pattern as listingService.submitListing().
 */
export async function submitNews(payload, captchaToken) {
  if (import.meta.env.VITE_TURNSTILE_SITE_KEY) await verifyCaptcha(captchaToken)
  const { data, error } = await supabase.rpc('submit_news', { payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** All of the current user's own news submissions, any status. */
export async function getMyNews() {
  const userId = await currentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SELECT)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapNewsRow)
}

/** One of the current user's own news items by id, or null if not theirs. */
export async function getMyNewsById(id) {
  const userId = await currentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SELECT)
    .eq('id', id)
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapNewsRow(data) : null
}

/** Updates an editable (draft/pending/rejected) news item owned by the current user. */
export async function updateMyNews(id, payload) {
  const { data, error } = await supabase.rpc('update_my_news', { p_id: id, payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** Moves a rejected news item owned by the current user back to pending. */
export async function resubmitNews(id) {
  const { error } = await supabase.rpc('resubmit_news', { p_id: id })
  if (error) throw toFriendlyError(error)
  return { success: true }
}
