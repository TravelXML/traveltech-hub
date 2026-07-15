import { createClient } from '@supabase/supabase-js'

// Single reusable Supabase client for the whole app. Only ever reads the
// public URL and the publishable (or legacy anon) key - both are safe to
// ship to the browser because every table is protected by Row Level
// Security. The service-role key must never be imported here or anywhere
// else in frontend code.
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function describeMissingConfig() {
  const missing = []
  if (!url || url === 'https://your-project.supabase.co') missing.push('VITE_SUPABASE_URL')
  if (!publishableKey || publishableKey === 'your-publishable-key')
    missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')
  if (missing.length === 0) return null
  return `Missing Supabase configuration: ${missing.join(', ')}. Copy .env.example to .env.local and fill in your Supabase project's URL and publishable key (Project Settings -> API in the Supabase dashboard).`
}

// Set when required env vars are absent or still the placeholder values from
// .env.example. Components should check this (via useSupabaseConfig) rather
// than let calls fail with a confusing null-reference error.
export const supabaseConfigError = describeMissingConfig()

export const isSupabaseConfigured = supabaseConfigError === null

// `supabase` is null when misconfigured so importing this module never
// throws - callers that genuinely need a client should guard on
// isSupabaseConfigured first (the app does this once at the root via
// <ConfigGuard>, so every other page can assume it's configured).
export const supabase = isSupabaseConfigured
  ? createClient(url, publishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null
