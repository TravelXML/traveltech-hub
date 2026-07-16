// Data-access layer for the jobs module - job postings (submission, the
// current user's own postings) and applications (submitting, the seeker's
// own applications, the employer's applicant list). Moderation reads live
// in adminService.js. Mirrors newsService.js's shape throughout.

import { supabase } from '../lib/supabase.js'
import { mapJobRow, mapApplicationRow, JOB_SELECT, APPLICATION_SELECT } from './jobMapper.js'

const SAFE_ERROR_CODES = new Set(['22023', '28000', '42501'])
const LISTING_EMBED = 'listings(id, name, slug, logo_url, logo_initials)'

function toFriendlyError(error) {
  if (!error) return new Error('Something went wrong. Please try again.')
  if (SAFE_ERROR_CODES.has(error.code)) return new Error(error.message)
  if (error.code === '23505') return new Error('You have already applied to this job.')
  console.error('Supabase error:', error)
  return new Error('Something went wrong. Please try again.')
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser()
  return data?.user?.id ?? null
}

/** Approved, still-open jobs (closes_at is null or in the future), newest first. */
export async function getJobs() {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('jobs')
    .select(`${JOB_SELECT}, ${LISTING_EMBED}`)
    .eq('status', 'approved')
    .or(`closes_at.is.null,closes_at.gte.${today}`)
    .order('created_at', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapJobRow)
}

/** One approved job by id, with its hiring company attached, or null. */
export async function getJobById(id) {
  const { data, error } = await supabase
    .from('jobs')
    .select(`${JOB_SELECT}, ${LISTING_EMBED}`)
    .eq('id', id)
    .eq('status', 'approved')
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapJobRow(data) : null
}

/**
 * Submits a job posting for review. Requires an authenticated session that
 * owns an approved business listing matching payload.listingId - the
 * submit_job() RPC enforces this (and owner_id/status) server-side
 * regardless of payload content. No captcha: posting already requires an
 * authenticated owner of an approved listing, a meaningful barrier on its
 * own.
 */
export async function submitJob(payload) {
  const { data, error } = await supabase.rpc('submit_job', { payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** All of the current user's own job postings, any status. */
export async function getMyJobs() {
  const userId = await currentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('jobs')
    .select(`${JOB_SELECT}, ${LISTING_EMBED}`)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapJobRow)
}

/** One of the current user's own job postings by id, or null if not theirs. */
export async function getMyJobById(id) {
  const userId = await currentUserId()
  if (!userId) return null
  const { data, error } = await supabase
    .from('jobs')
    .select(`${JOB_SELECT}, ${LISTING_EMBED}`)
    .eq('id', id)
    .eq('owner_id', userId)
    .maybeSingle()
  if (error) throw toFriendlyError(error)
  return data ? mapJobRow(data) : null
}

/** Updates an editable (draft/pending/rejected) job posting owned by the current user. */
export async function updateMyJob(id, payload) {
  const { data, error } = await supabase.rpc('update_my_job', { p_id: id, payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** Moves a rejected job posting owned by the current user back to pending. */
export async function resubmitJob(id) {
  const { error } = await supabase.rpc('resubmit_job', { p_id: id })
  if (error) throw toFriendlyError(error)
  return { success: true }
}

/** Submits a job application. Requires an authenticated session; resumePath
 * comes from a prior storageService.uploadResume() call. */
export async function submitApplication(payload) {
  const { data, error } = await supabase.rpc('submit_application', { payload })
  if (error) throw toFriendlyError(error)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, status: row.status }
}

/** The current user's own applications, each with its job + hiring company attached. */
export async function getMyApplications() {
  const userId = await currentUserId()
  if (!userId) return []
  const { data, error } = await supabase
    .from('job_applications')
    .select(`${APPLICATION_SELECT}, jobs(id, title, ${LISTING_EMBED})`)
    .eq('applicant_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapApplicationRow)
}

/** Applicants for one of the current user's own job postings (RLS-gated to the listing owner). */
export async function getJobApplications(jobId) {
  const { data, error } = await supabase
    .from('job_applications')
    .select(APPLICATION_SELECT)
    .eq('job_id', jobId)
    .order('created_at', { ascending: true })
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapApplicationRow)
}

/** Updates an application's status. Only the employer who owns the job (or an admin) can call this. */
export async function updateApplicationStatus(id, status) {
  const { error } = await supabase.rpc('update_application_status', { p_id: id, p_status: status })
  if (error) throw toFriendlyError(error)
}

/**
 * Which of the given listing ids currently have at least one approved,
 * still-open job posting. Used by listingService.js to attach a `hiring`
 * flag onto listing cards/detail pages - same "fetch ids, build a Set,
 * merge" shape getCategories() already uses for listing counts.
 */
export async function getHiringListingIds(listingIds) {
  if (!listingIds?.length) return new Set()
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('jobs')
    .select('listing_id')
    .eq('status', 'approved')
    .or(`closes_at.is.null,closes_at.gte.${today}`)
    .in('listing_id', listingIds)
  if (error) throw toFriendlyError(error)
  return new Set((data ?? []).map((row) => row.listing_id))
}

/** Up to `limit` approved, still-open jobs for one listing (its "Open positions" section). */
export async function getOpenJobsForListing(listingId, limit = 5) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('jobs')
    .select(JOB_SELECT)
    .eq('listing_id', listingId)
    .eq('status', 'approved')
    .or(`closes_at.is.null,closes_at.gte.${today}`)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw toFriendlyError(error)
  return (data ?? []).map(mapJobRow)
}
