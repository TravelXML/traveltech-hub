import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import OAuthButtons from '../components/OAuthButtons.jsx'
import Turnstile from '../components/Turnstile.jsx'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)

  // Only ever redirect back to an in-app path captured by ProtectedRoute -
  // never trust an arbitrary external URL here (that would be an open
  // redirect). location.state.from is always set by our own router, but we
  // validate anyway since it's the one place a redirect target is derived
  // from URL-adjacent state.
  const from = location.state?.from?.pathname?.startsWith('/') ? location.state.from.pathname : '/dashboard'
  // Only require a token when a site key is actually configured - keeps the
  // form usable before Cloudflare Turnstile is set up (see .env.example).
  const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn({ email, password, captchaToken })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message)
      setCaptchaToken('')
      setCaptchaKey((k) => k + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-center font-display text-3xl font-bold text-slate-900">Log in</h1>
      <p className="mt-2 text-center text-slate-600">Manage your listings and submissions.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8">
        <OAuthButtons onError={setError} />
        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or continue with email</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <Turnstile key={captchaKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken('')} />

        <button
          type="submit"
          disabled={submitting || (captchaRequired && !captchaToken)}
          className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:text-brand-700">
          Register
        </Link>
      </p>
    </div>
  )
}
