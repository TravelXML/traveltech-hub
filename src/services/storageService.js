import { supabase } from '../lib/supabase.js'

export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
export const ALLOWED_LOGO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'svg']

/**
 * Client-side validation only - convenience for instant form feedback. The
 * real boundary is the vendor-logos bucket's file_size_limit/
 * allowed_mime_types and its RLS policies (supabase/storage-setup.sql).
 */
export function validateLogoFile(file) {
  if (!file) return 'Please choose a file.'
  if (!ALLOWED_LOGO_MIME_TYPES.includes(file.type)) {
    return 'Logo must be a PNG, JPEG, WebP or SVG image.'
  }
  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return 'Logo file has an unrecognized extension.'
  }
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return 'Logo must be 2 MB or smaller.'
  }
  return null
}

function randomFileName(originalName) {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'png'
  const random =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${random}.${ext}`
}

/**
 * Uploads a vendor logo to the vendor-logos bucket under
 * {userId}/{listingId}/{random-filename}, matching the path convention the
 * storage RLS policies enforce (supabase/storage-setup.sql). Returns the
 * public URL to store as listings.logo_url.
 */
export async function uploadListingLogo({ userId, listingId, file }) {
  const validationError = validateLogoFile(file)
  if (validationError) throw new Error(validationError)

  const path = `${userId}/${listingId}/${randomFileName(file.name)}`
  const { error } = await supabase.storage.from('vendor-logos').upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) {
    console.error('Storage upload error:', error)
    throw new Error('Could not upload logo. Please try again.')
  }

  const { data } = supabase.storage.from('vendor-logos').getPublicUrl(path)
  return data.publicUrl
}
