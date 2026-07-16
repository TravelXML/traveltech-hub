import { useState } from 'react'
import FieldLabel from './FieldLabel.jsx'

export const JOB_CATEGORIES = [
  'Engineering',
  'Management (MBA)',
  'Hotel Management',
  'Finance & Accounting',
  'Account Management',
  'Other',
]
export const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']
export const EXPERIENCE_LEVELS = ['Entry-level', 'Mid-level', 'Senior-level', 'Executive']
const TODAY = new Date().toISOString().slice(0, 10)

export const EMPTY_JOB_FORM = {
  listingId: '',
  title: '',
  category: '',
  description: '',
  employmentType: '',
  experienceLevel: '',
  location: '',
  remote: false,
  salaryRange: '',
  closesAt: '',
}

export function validateJobForm(form) {
  const e = {}
  if (!form.listingId) e.listingId = 'Please select which company is hiring.'
  if (!form.title.trim()) e.title = 'Job title is required.'
  else if (form.title.trim().length > 200) e.title = 'Title must be 200 characters or fewer.'
  if (!form.category) e.category = 'Please select a category.'
  if (!form.description.trim() || form.description.trim().length < 50)
    e.description = 'Description should be at least 50 characters.'
  else if (form.description.trim().length > 5000) e.description = 'Description must be 5000 characters or fewer.'
  if (!form.employmentType) e.employmentType = 'Please select an employment type.'
  if (!form.location.trim()) e.location = 'Location is required.'
  if (form.closesAt && form.closesAt < TODAY) e.closesAt = 'Application deadline cannot be in the past.'
  return e
}

/** Shared field set for "post a job" and "edit job" - mirrors NewsForm.jsx's
 * split between form fields here and submit orchestration in the parent page. */
export default function JobForm({
  listings = [],
  initialValues,
  submitLabel = 'Post Job',
  submittingLabel = 'Submitting…',
  submitting = false,
  serverError = '',
  listingLocked = false,
  onSubmit,
}) {
  const [form, setForm] = useState({ ...EMPTY_JOB_FORM, ...initialValues })
  const [errors, setErrors] = useState({})

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateJobForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    await onSubmit(form)
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
        <FieldLabel required>Which company is hiring?</FieldLabel>
        {listingLocked ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600">
            {listings.find((l) => l.id === form.listingId)?.name ?? 'Company'}
            <span className="ml-2 text-xs text-slate-400">(can&apos;t be changed after posting)</span>
          </p>
        ) : (
          <>
            <select
              value={form.listingId}
              onChange={(e) => set('listingId')(e.target.value)}
              className={inputClass('listingId')}
            >
              <option value="">Select one of your approved listings...</option>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <FieldError field="listingId" />
          </>
        )}
      </div>

      <div>
        <FieldLabel required>Job title</FieldLabel>
        <input
          type="text"
          maxLength={200}
          value={form.title}
          onChange={(e) => set('title')(e.target.value)}
          className={inputClass('title')}
        />
        <FieldError field="title" />
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
            {JOB_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <FieldError field="category" />
        </div>
        <div>
          <FieldLabel required>Employment type</FieldLabel>
          <select
            value={form.employmentType}
            onChange={(e) => set('employmentType')(e.target.value)}
            className={inputClass('employmentType')}
          >
            <option value="">Select...</option>
            {EMPLOYMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <FieldError field="employmentType" />
        </div>
      </div>

      <div>
        <FieldLabel required>Description</FieldLabel>
        <textarea
          rows={6}
          maxLength={5000}
          placeholder="Responsibilities, requirements, what makes this role great..."
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          className={inputClass('description')}
        />
        <FieldError field="description" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel required>Location</FieldLabel>
          <input
            type="text"
            placeholder="e.g. Bengaluru, India"
            value={form.location}
            onChange={(e) => set('location')(e.target.value)}
            className={inputClass('location')}
          />
          <FieldError field="location" />
        </div>
        <div>
          <FieldLabel>Experience level (optional)</FieldLabel>
          <select
            value={form.experienceLevel}
            onChange={(e) => set('experienceLevel')(e.target.value)}
            className={inputClass('experienceLevel')}
          >
            <option value="">Not specified</option>
            {EXPERIENCE_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={form.remote}
          onChange={(e) => set('remote')(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
        />
        This is a remote position
      </label>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <FieldLabel>Salary range (optional)</FieldLabel>
          <input
            type="text"
            placeholder="e.g. $60k - $90k, or Competitive"
            value={form.salaryRange}
            onChange={(e) => set('salaryRange')(e.target.value)}
            className={inputClass('salaryRange')}
          />
        </div>
        <div>
          <FieldLabel>Application deadline (optional)</FieldLabel>
          <input
            type="date"
            min={TODAY}
            value={form.closesAt}
            onChange={(e) => set('closesAt')(e.target.value)}
            className={inputClass('closesAt')}
          />
          <FieldError field="closesAt" />
          <p className="mt-1 text-xs text-slate-400">Leave blank to keep the role open until filled.</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
