import { supabase } from '../lib/supabase.js'

/**
 * Verifies a Turnstile token server-side via the verify-turnstile Edge
 * Function before letting a non-auth action (like listing submission)
 * proceed. Unlike login/signup, that isn't an auth call, so there's no
 * native Supabase captchaToken hook - verification has to happen out of
 * band. See docs/cloudflare-pages.md-adjacent plan notes: this stops naive
 * bot form submissions, not a determined attacker calling the RPC directly.
 */
export async function verifyCaptcha(token) {
  if (!token) throw new Error('Please complete the verification challenge.')
  const { data, error } = await supabase.functions.invoke('verify-turnstile', { body: { token } })
  if (error) throw new Error('Verification failed. Please try again.')
  if (!data?.success) throw new Error('Verification failed. Please try again.')
}
