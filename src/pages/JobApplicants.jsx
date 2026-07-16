import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Mail, Phone, FileText, AlertCircle } from 'lucide-react'
import { getMyJobById, getJobApplications, updateApplicationStatus } from '../services/jobService.js'
import { getResumeSignedUrl } from '../services/storageService.js'

const STATUS_OPTIONS = ['submitted', 'reviewed', 'shortlisted', 'rejected', 'hired']

const STATUS_STYLES = {
  submitted: 'bg-slate-100 text-slate-700',
  reviewed: 'bg-sky-100 text-sky-800',
  shortlisted: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-emerald-100 text-emerald-800',
}

export default function JobApplicants() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [resumeError, setResumeError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    Promise.all([getMyJobById(id), getJobApplications(id)])
      .then(([jobData, apps]) => {
        setJob(jobData)
        setApplications(apps)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleStatusChange(applicationId, status) {
    setBusyId(applicationId)
    setError('')
    try {
      await updateApplicationStatus(applicationId, status)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleViewResume(resumePath) {
    setResumeError('')
    try {
      const url = await getResumeSignedUrl(resumePath)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setResumeError(err.message)
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Job not found</h1>
        <Link to="/dashboard/jobs" className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/dashboard/jobs" className="text-sm font-medium text-slate-500 hover:text-slate-700">
        ← Back to my jobs
      </Link>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Applicants for {job.title}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {applications.length} application{applications.length === 1 ? '' : 's'}
      </p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {resumeError && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} /> {resumeError}
        </p>
      )}

      {applications.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          No applications yet.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {applications.map((app) => (
            <li key={app.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-slate-900">{app.fullName}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[app.status]}`}
                    >
                      {app.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-brand-600">
                      <Mail size={14} /> {app.email}
                    </a>
                    {app.phone && (
                      <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-brand-600">
                        <Phone size={14} /> {app.phone}
                      </a>
                    )}
                  </div>
                  {app.coverNote && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{app.coverNote}</p>}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => handleViewResume(app.resumePath)}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <FileText size={15} /> View resume
                  </button>
                  <select
                    value={app.status}
                    disabled={busyId === app.id}
                    onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
