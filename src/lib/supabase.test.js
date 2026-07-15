import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('supabase client configuration', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reports missing configuration when env vars are absent', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '')
    const { isSupabaseConfigured, supabaseConfigError, supabase } = await import('./supabase.js')
    expect(isSupabaseConfigured).toBe(false)
    expect(supabaseConfigError).toMatch(/VITE_SUPABASE_URL/)
    expect(supabaseConfigError).toMatch(/VITE_SUPABASE_PUBLISHABLE_KEY/)
    expect(supabase).toBeNull()
  })

  it('treats the .env.example placeholder values as unconfigured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://your-project.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'your-publishable-key')
    const { isSupabaseConfigured } = await import('./supabase.js')
    expect(isSupabaseConfigured).toBe(false)
  })

  it('configures successfully with real-looking values', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefghijklmnop.supabase.co')
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test_key')
    const { isSupabaseConfigured, supabaseConfigError, supabase } = await import('./supabase.js')
    expect(isSupabaseConfigured).toBe(true)
    expect(supabaseConfigError).toBeNull()
    expect(supabase).not.toBeNull()
  })
})
