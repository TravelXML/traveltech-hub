import { useState } from 'react'
import FieldLabel from './FieldLabel.jsx'
import Turnstile from './Turnstile.jsx'

const FORMATS = ['In-person', 'Virtual', 'Hybrid']

export const EMPTY_EVENT_FORM = {
  name: '',
  host: '',
  description: '',
  startDate: '',
  endDate: '',
  city: '',
  country: '',
  venue: '',
  format: '',
  audience: '',
  website: '',
}

export function validateEventForm(form) {
  const e = {}
  if (!form.name.trim()) e.name = 'Event name is required.'
  else if (form.name.trim().length > 200) e.name = 'Event name must be 200 characters or fewer.'
  if (!form.host.trim()) e.host = 'Host is required.'
  if (!form.description.trim() || form.description.trim().length < 20)
    e.description = 'Description should be at least 20 characters.'
  else if (form.description.trim().length > 2000) e.description = 'Description must be 2000 characters or fewer.'
  if (!form.startDate) e.startDate = 'Start date is required.'
  if (!form.endDate) e.endDate = 'End date is required.'
  else if (form.startDate && form.endDate < form.startDate) e.endDate = 'End date must be on or after the start date.'
  if (!form.city.trim()) e.city = 'City is required.'
  if (!form.country.trim()) e.country = 'Country is required.'
  if (!form.format) e.format = 'Please select a format.'
  if (!form.website || !/^https?:\/\/.+/i.test(form.website))
    e.website = 'Website must start with http:// or https://'
  return e
}

/** Shared field set for "submit event" and "edit event" - mirrors ListingForm.jsx's
 * split between form fields here and submit orchestration in the parent page. */
export default function EventForm({
  initialValues,
  submitLabel = 'Submit Event',
  submittingLabel = 'Submitting…',
  submitting = false,
  serverError = '',
  requireCaptcha = false,
  onSubmit,
}) {
  const [form, setForm] = useState({ ...EMPTY_EVENT_FORM, ...initialValues })
  const [errors, setErrors] = useState({})
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const [captchaError, setCaptchaError] = useState('')
  const captchaRequired = requireCaptcha && Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateEventForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    if (captchaRequired && !captchaToken) {
      setCaptchaError('Please complete the verification challenge.')
      return
    }
    setCaptchaError('')

    try {
      await onSubmit(form, captchaToken)
    } finally {
      setCaptchaToken('')
      setCaptchaKey((k) => k + 1)
    }
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
      errors[field] ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
    }`

  const FieldError = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p> : null

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl space-y-6">
      {serverError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}

      <div>
        <FieldLabel required>Event name</FieldLabel>
        <input
          type="text"
          maxLength={200}
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          className={inputClass('name')}
        />
        <FieldError field="name" />
      </div>

      <div>
        <FieldLabel required>Host</FieldLabel>
        <input type="text" value={form.host} onChange={(e) => set('host')(e.target.value)} className={inputClass('host')} />
        <FieldError field="host" />
      </div>

      <div>
        <FieldLabel required>Description</FieldLabel>
        <textarea
          rows={4}
          maxLength={2000}
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          className={inputClass('description')}
        />
        <FieldError field="description" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel required>Start date</FieldLabel>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set('startDate')(e.target.value)}
            className={inputClass('startDate')}
          />
          <FieldError field="startDate" />
        </div>
        <div>
          <FieldLabel required>End date</FieldLabel>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => set('endDate')(e.target.value)}
            className={inputClass('endDate')}
          />
          <FieldError field="endDate" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel required>City</FieldLabel>
          <input type="text" value={form.city} onChange={(e) => set('city')(e.target.value)} className={inputClass('city')} />
          <FieldError field="city" />
        </div>
        <div>
          <FieldLabel required>Country</FieldLabel>
          <input
            type="text"
            value={form.country}
            onChange={(e) => set('country')(e.target.value)}
            className={inputClass('country')}
          />
          <FieldError field="country" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Venue (optional)</FieldLabel>
          <input type="text" value={form.venue} onChange={(e) => set('venue')(e.target.value)} className={inputClass('venue')} />
        </div>
        <div>
          <FieldLabel required>Format</FieldLabel>
          <select
            value={form.format}
            onChange={(e) => set('format')(e.target.value)}
            className={inputClass('format')}
          >
            <option value="">Select...</option>
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <FieldError field="format" />
        </div>
      </div>

      <div>
        <FieldLabel>Audience (optional)</FieldLabel>
        <input
          type="text"
          placeholder="e.g. Global travel & tourism trade"
          value={form.audience}
          onChange={(e) => set('audience')(e.target.value)}
          className={inputClass('audience')}
        />
      </div>

      <div>
        <FieldLabel required>Website</FieldLabel>
        <input
          type="text"
          placeholder="https://"
          value={form.website}
          onChange={(e) => set('website')(e.target.value)}
          className={inputClass('website')}
        />
        <FieldError field="website" />
      </div>

      {requireCaptcha && (
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
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
