import { useState } from 'react'
import FieldLabel from './FieldLabel.jsx'
import TagInput from './TagInput.jsx'
import Turnstile from './Turnstile.jsx'

const CATEGORIES = ['Earnings', 'Funding', 'M&A', 'Partnership', 'Product Launch', 'Industry Trend', 'Regulation']
const TODAY = new Date().toISOString().slice(0, 10)

export const EMPTY_NEWS_FORM = {
  title: '',
  summary: '',
  source: '',
  sourceUrl: '',
  category: '',
  tags: [],
  publishedDate: '',
}

export function validateNewsForm(form) {
  const e = {}
  if (!form.title.trim()) e.title = 'Title is required.'
  else if (form.title.trim().length > 300) e.title = 'Title must be 300 characters or fewer.'
  if (!form.summary.trim() || form.summary.trim().length < 20)
    e.summary = 'Summary should be at least 20 characters.'
  else if (form.summary.trim().length > 2000) e.summary = 'Summary must be 2000 characters or fewer.'
  if (!form.source.trim()) e.source = 'Source is required.'
  if (!form.sourceUrl || !/^https?:\/\/.+/i.test(form.sourceUrl))
    e.sourceUrl = 'Source URL must start with http:// or https://'
  if (!form.category) e.category = 'Please select a category.'
  if (!form.publishedDate) e.publishedDate = 'Published date is required.'
  else if (form.publishedDate > TODAY) e.publishedDate = 'Published date cannot be in the future.'
  return e
}

/** Shared field set for "submit news" and "edit news" - mirrors ListingForm.jsx's
 * split between form fields here and submit orchestration in the parent page. */
export default function NewsForm({
  initialValues,
  submitLabel = 'Submit News',
  submittingLabel = 'Submitting…',
  submitting = false,
  serverError = '',
  requireCaptcha = false,
  onSubmit,
}) {
  const [form, setForm] = useState({ ...EMPTY_NEWS_FORM, ...initialValues })
  const [errors, setErrors] = useState({})
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaKey, setCaptchaKey] = useState(0)
  const [captchaError, setCaptchaError] = useState('')
  const captchaRequired = requireCaptcha && Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateNewsForm(form)
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
        <FieldLabel required>Title</FieldLabel>
        <input
          type="text"
          maxLength={300}
          value={form.title}
          onChange={(e) => set('title')(e.target.value)}
          className={inputClass('title')}
        />
        <FieldError field="title" />
      </div>

      <div>
        <FieldLabel required>Summary</FieldLabel>
        <textarea
          rows={4}
          maxLength={2000}
          value={form.summary}
          onChange={(e) => set('summary')(e.target.value)}
          className={inputClass('summary')}
        />
        <FieldError field="summary" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel required>Source</FieldLabel>
          <input
            type="text"
            placeholder="e.g. Skift, Yahoo Finance"
            value={form.source}
            onChange={(e) => set('source')(e.target.value)}
            className={inputClass('source')}
          />
          <FieldError field="source" />
        </div>
        <div>
          <FieldLabel required>Source URL</FieldLabel>
          <input
            type="text"
            placeholder="https://"
            value={form.sourceUrl}
            onChange={(e) => set('sourceUrl')(e.target.value)}
            className={inputClass('sourceUrl')}
          />
          <FieldError field="sourceUrl" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel required>Category</FieldLabel>
          <select
            value={form.category}
            onChange={(e) => set('category')(e.target.value)}
            className={inputClass('category')}
          >
            <option value="">Select...</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError field="category" />
        </div>
        <div>
          <FieldLabel required>Published date</FieldLabel>
          <input
            type="date"
            max={TODAY}
            value={form.publishedDate}
            onChange={(e) => set('publishedDate')(e.target.value)}
            className={inputClass('publishedDate')}
          />
          <FieldError field="publishedDate" />
        </div>
      </div>

      <div>
        <FieldLabel>Tags (optional)</FieldLabel>
        <TagInput values={form.tags} onChange={set('tags')} placeholder="Type a tag, press Enter" />
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
