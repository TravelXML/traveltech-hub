import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.59-5.05-3.71H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.94a9 9 0 0 0 0 8.08l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.96l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="0" y="0" width="8.5" height="8.5" fill="#F25022" />
      <rect x="9.5" y="0" width="8.5" height="8.5" fill="#7FBA00" />
      <rect x="0" y="9.5" width="8.5" height="8.5" fill="#00A4EF" />
      <rect x="9.5" y="9.5" width="8.5" height="8.5" fill="#FFB900" />
    </svg>
  )
}

/** Branded Google/Microsoft sign-in buttons. Each click is a full-page
 * redirect (see authService.signInWithOAuth) - the only failure that can
 * surface here is a synchronous one before the redirect fires, e.g. the
 * provider not being enabled in the Supabase dashboard yet. */
export default function OAuthButtons({ onError }) {
  const { signInWithOAuth } = useAuth()
  const [submitting, setSubmitting] = useState(null)

  async function handleClick(provider) {
    onError?.('')
    setSubmitting(provider)
    try {
      await signInWithOAuth(provider)
    } catch (err) {
      onError?.(err.message)
      setSubmitting(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => handleClick('google')}
        disabled={submitting !== null}
        className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <GoogleIcon /> Google
      </button>
      <button
        type="button"
        onClick={() => handleClick('azure')}
        disabled={submitting !== null}
        className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <MicrosoftIcon /> Microsoft
      </button>
    </div>
  )
}
