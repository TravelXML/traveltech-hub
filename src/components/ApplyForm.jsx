import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Paperclip } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import FieldLabel from './FieldLabel.jsx'
import { validateResumeFile, uploadResume } from '../services/storageService.js'
import { submitApplication } from '../services/jobService.js'

const EMPTY_FORM = { fullName: '', email: '', phone: '', coverNote: '' }
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function validate(form, resumeFile) {
  const e = {}
  if (!form.fullName.trim()) e.fullName = 'Full name is required.'
  if (!form.email.trim() || !EMAIL_RE.test(form.email.trim())) e.email = 'A valid email is required.'
  if (!resumeFile) e.resume = 'Please attach your resume (PDF, DOC or DOCX).'
  else {
    const fileError = validateResumeFile(resumeFile)
    if (fileError) e.resume = fileError
  }
  return e
}

/** Applying to a job requires an account (same login-gate shape as
 * AddNewsForm.jsx/AddBusinessForm.jsx), so an employer can always trace an
 * application back to a real user. */
export default function ApplyForm({ jobId }) {
  const { user, loading: authLoading } = useAuth()
  const [form, setForm] = useState(EMPTY_FORM)
  const [resumeFile, setResumeFile] = useState(null)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [applied, setApplied] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form, resumeFile)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setServerError('')
    setSubmitting(true)
    try {
      const resumePath = await uploadResume({ userId: user.id, file: resumeFile })
      await submitApplication({
        jobId,
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        coverNote: form.coverNote,
        resumePath,
      })
      setApplied(true)
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
        <h3 className="font-display text-lg font-semibold text-slate-900">Log in to apply</h3>
        <p className="mt-2 text-sm text-slate-600">Create a free account to submit your application.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create an account
          </Link>
        </div>
      </div>
    )
  }

  if (applied) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <h3 className="font-display text-lg font-semibold text-emerald-800">Application submitted!</h3>
        <p className="mt-2 text-sm text-emerald-700">
          The employer can now review your application. Track its status from{' '}
          <Link to="/dashboard/applications" className="font-medium underline">
            My applications
          </Link>
          .
        </p>
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
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
      <h3 className="font-display text-lg font-semibold text-slate-900">Apply for this role</h3>
      {serverError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}

      <div>
        <FieldLabel required>Full name</FieldLabel>
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => set('fullName')(e.target.value)}
          className={inputClass('fullName')}
        />
        <FieldError field="fullName" />
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
        <FieldLabel>Phone (optional)</FieldLabel>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => set('phone')(e.target.value)}
          className={inputClass('phone')}
        />
      </div>

      <div>
        <FieldLabel required>Resume</FieldLabel>
        <label
          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${
            errors.resume ? 'border-red-400' : 'border-slate-300'
          }`}
        >
          <Paperclip size={16} className="shrink-0 text-slate-400" />
          <span className="truncate text-slate-600">{resumeFile ? resumeFile.name : 'Choose a PDF, DOC or DOCX'}</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
        <FieldError field="resume" />
      </div>

      <div>
        <FieldLabel>Cover note (optional)</FieldLabel>
        <textarea
          rows={4}
          maxLength={3000}
          value={form.coverNote}
          onChange={(e) => set('coverNote')(e.target.value)}
          className={inputClass('coverNote')}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  )
}
