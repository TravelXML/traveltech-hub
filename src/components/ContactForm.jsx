import { useState } from 'react'
import FieldLabel from './FieldLabel.jsx'
import Turnstile from './Turnstile.jsx'
import { submitContactMessage } from '../services/contactService.js'

const EMPTY_FORM = { name: '', email: '', company: '', message: '' }
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function validate(form) {
  const e = {}
  if (!form.name.trim()) e.name = 'Your name is required.'
  if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) e.email = 'A valid email is required.'
  if (!form.message.trim()) e.message = 'Please include a message.'
  return e
}

/** Public Contact Us form - no login required. Submits via
 * send-contact-email, which stores the message and emails a notification
 * (with sender name/email/company) to info@travelpin.space. */
export default function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [sent, setSent] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const [captchaError, setCaptchaError] = useState('')
  // Only require a token when a site key is actually configured - keeps the
  // form usable before Cloudflare Turnstile is set up (see .env.example).
  const captchaRequired = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    if (captchaRequired && !captchaToken) {
      setCaptchaError('Please complete the verification challenge.')
      return
    }
    setCaptchaError('')
    setServerError('')
    setSubmitting(true)
    try {
      await submitContactMessage(form, captchaToken)
      setSent(true)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
      // Turnstile tokens are single-use - always reset after a submit
      // attempt, success or failure, so a retry gets a fresh token.
      setCaptchaToken('')
      setCaptchaKey((k) => k + 1)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-emerald-800">Thanks for reaching out!</h2>
        <p className="mt-2 text-emerald-700">We&apos;ve received your message and will get back to you soon.</p>
      </div>
    )
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
      errors[field] ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
    }`

  const FieldError = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p> : null

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mx-auto max-w-lg space-y-5 rounded-2xl border border-slate-200 bg-white p-6"
    >
      {serverError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}

      <div>
        <FieldLabel required>Name</FieldLabel>
        <input type="text" value={form.name} onChange={(e) => set('name')(e.target.value)} className={inputClass('name')} />
        <FieldError field="name" />
      </div>

      <div>
        <FieldLabel required>Email</FieldLabel>
        <input
          type="email"
          value={form.email}
          onChange={(e) => set('email')(e.target.value)}
          className={inputClass('email')}
        />
        <FieldError field="email" />
      </div>

      <div>
        <FieldLabel>Company (optional)</FieldLabel>
        <input
          type="text"
          value={form.company}
          onChange={(e) => set('company')(e.target.value)}
          className={inputClass('company')}
        />
      </div>

      <div>
        <FieldLabel required>Message</FieldLabel>
        <textarea
          rows={5}
          maxLength={5000}
          value={form.message}
          onChange={(e) => set('message')(e.target.value)}
          className={inputClass('message')}
        />
        <FieldError field="message" />
      </div>

      {captchaRequired && (
        <div>
          <Turnstile key={captchaKey} onSuccess={setCaptchaToken} onExpire={() => setCaptchaToken('')} />
          {captchaError && <p className="mt-1 text-xs text-red-600">{captchaError}</p>}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || (captchaRequired && !captchaToken)}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
