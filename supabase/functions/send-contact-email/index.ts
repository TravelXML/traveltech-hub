// Handles the public Contact Us form (src/pages/Contact.jsx): verifies the
// Cloudflare Turnstile token, stores the message in
// public.contact_messages, and emails a notification - including the
// sender's name, email and company - to info@travelpin.space via Resend.
//
// Deploy: `supabase functions deploy send-contact-email` after
// `supabase secrets set RESEND_API_KEY=...` (resend.com dashboard -> API
// Keys). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided
// automatically by the Edge Functions runtime - no need to set them.
// TURNSTILE_SECRET_KEY should already be set (see verify-turnstile) for
// captcha verification to actually run; without it, verification is
// skipped, matching Turnstile.jsx's opt-in behavior before that's set up.

import { createClient } from 'npm:@supabase/supabase-js@2.110.5'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CONTACT_EMAIL = 'info@travelpin.space'
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

async function verifyTurnstile(token: string | undefined, remoteip: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) return true
  if (!token) return false
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, remoteip }),
  })
  const result = await res.json()
  return result.success === true
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { name, email, company, message, token } = await req.json()

    const cleanName = String(name ?? '').trim().slice(0, 200)
    const cleanEmail = String(email ?? '').trim().slice(0, 320)
    const cleanCompany = String(company ?? '').trim().slice(0, 200) || null
    const cleanMessage = String(message ?? '').trim().slice(0, 5000)

    if (!cleanName || !EMAIL_RE.test(cleanEmail) || !cleanMessage) {
      return new Response(
        JSON.stringify({ error: 'Please fill in your name, a valid email, and a message.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      )
    }

    const remoteip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? ''
    const captchaOk = await verifyTurnstile(token, remoteip)
    if (!captchaOk) {
      return new Response(JSON.stringify({ error: 'Verification failed. Please try again.' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { error: insertError } = await supabase.from('contact_messages').insert({
      name: cleanName,
      email: cleanEmail,
      company: cleanCompany,
      message: cleanMessage,
      source: 'travelpin-contact-form',
    })
    if (insertError) throw insertError

    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TravelPin Contact Form <onboarding@resend.dev>',
          to: [CONTACT_EMAIL],
          reply_to: cleanEmail,
          subject: `TravelPin contact form: ${cleanName}${cleanCompany ? ` (${cleanCompany})` : ''}`,
          html: `
            <p><strong>From:</strong> ${escapeHtml(cleanName)} &lt;${escapeHtml(cleanEmail)}&gt;</p>
            <p><strong>Company:</strong> ${escapeHtml(cleanCompany ?? '-')}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(cleanMessage).replace(/\n/g, '<br>')}</p>
            <hr>
            <p style="color:#888;font-size:12px">Sent via the TravelPin (travelpin.space) Contact Us form.</p>
          `,
        }),
      })
      if (!emailRes.ok) {
        // The message is already saved in contact_messages - a failed
        // notification email shouldn't surface as a submission failure to
        // the visitor. Logged for ops to notice and check the table.
        console.error('Resend send failed:', await emailRes.text())
      }
    } else {
      console.error('RESEND_API_KEY not set - contact message stored but no email sent.')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-contact-email error:', err)
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
