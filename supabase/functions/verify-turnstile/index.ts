// Verifies a Cloudflare Turnstile token server-side before the frontend
// proceeds with a non-auth action (listing submission - see
// src/services/captchaService.js). Login/signup use Supabase Auth's native
// captchaToken support instead; this function exists only for actions that
// aren't auth calls, where Supabase can't check the token itself.
//
// Deploy: `supabase functions deploy verify-turnstile` after
// `supabase secrets set TURNSTILE_SECRET_KEY=...` (Cloudflare dashboard ->
// Turnstile -> your widget -> Secret Key).

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { token } = await req.json()
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY')

    if (!token || !secret) {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      })
    }

    const remoteip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? ''

    const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip }),
    })
    const result = await verifyResponse.json()

    // Never forward Cloudflare's raw response (error codes, hostnames) to
    // the client - only whether it passed.
    return new Response(JSON.stringify({ success: result.success === true }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }
})
