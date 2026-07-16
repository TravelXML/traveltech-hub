import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getMyListings } from '../services/listingService.js'
import { submitJob } from '../services/jobService.js'
import JobForm from './JobForm.jsx'

export default function AddJobForm() {
  const { user, loading: authLoading } = useAuth()
  const [listings, setListings] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (user) {
      getMyListings()
        .then((rows) => setListings(rows.filter((l) => l.status === 'approved')))
        .catch(() => setListings([]))
    }
  }, [user])

  async function handleSubmit(payload) {
    setServerError('')
    setSubmitting(true)
    try {
      await submitJob(payload)
      setResult({ title: payload.title })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || (user && listings === null)) {
    return <div className="flex min-h-[30vh] items-center justify-center text-slate-500">Loading…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-900">Log in to post a job</h2>
        <p className="mt-2 text-slate-600">
          Create a free account to post a job - we&apos;ll review it before it goes live.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create an account
          </Link>
        </div>
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-900">You need an approved business listing</h2>
        <p className="mt-2 text-slate-600">
          Jobs are posted under a company already in the directory. List your business first - once it&apos;s
          approved, you&apos;ll be able to post jobs under it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/add-business"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            List your business
          </Link>
          <Link
            to="/dashboard/listings"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View my listings
          </Link>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-emerald-800">Thanks - it&apos;s in review!</h2>
        <p className="mt-2 text-emerald-700">
          Your posting for <strong>{result.title}</strong> is <strong>pending review</strong>. Our team will check
          it over before it goes live - you can track its status from your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard/jobs"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            View my job postings
          </Link>
          <button
            onClick={() => setResult(null)}
            className="rounded-lg border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Post another job
          </button>
        </div>
      </div>
    )
  }

  return (
    <JobForm
      listings={listings}
      initialValues={{}}
      submitting={submitting}
      serverError={serverError}
      submitLabel="Post Job"
      submittingLabel="Submitting…"
      onSubmit={handleSubmit}
    />
  )
}
