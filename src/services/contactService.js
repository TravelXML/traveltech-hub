import { supabase } from '../lib/supabase.js'

/** Submits the public Contact Us form. The send-contact-email Edge
 * Function verifies the Turnstile token, stores the message, and emails a
 * notification to info@travelpin.space - none of that needs a signed-in
 * user, so this bypasses the RPC pattern used by authenticated forms. */
export async function submitContactMessage({ name, email, company, message }, captchaToken) {
  const { data, error } = await supabase.functions.invoke('send-contact-email', {
    body: { name, email, company, message, token: captchaToken },
  })
  if (error) throw new Error('Something went wrong sending your message. Please try again.')
  if (data?.error) throw new Error(data.error)
  return { success: true }
}
