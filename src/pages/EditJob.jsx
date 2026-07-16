import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getMyJobById, updateMyJob } from '../services/jobService.js'
import { getMyListings } from '../services/listingService.js'
import JobForm from '../components/JobForm.jsx'

export default function EditJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getMyJobById(id), getMyListings()])
      .then(([job, myListings]) => {
        if (!active) return
        if (!job) setNotFound(true)
        else setItem(job)
        setListings(myListings)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  async function handleSubmit(payload) {
    setError('')
    setSubmitting(true)
    try {
      await updateMyJob(id, payload)
      navigate('/dashboard/jobs')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Job not found</h1>
        <p className="mt-2 text-slate-600">This job doesn&apos;t exist or isn&apos;t yours.</p>
        <Link to="/dashboard/jobs" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my jobs
        </Link>
      </div>
    )
  }

  if (item.status === 'approved' || item.status === 'archived') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">This job can&apos;t be edited</h1>
        <p className="mt-2 text-slate-600">Approved and archived jobs can&apos;t be changed here.</p>
        <Link to="/dashboard/jobs" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my jobs
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Edit job</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          {item.status === 'rejected'
            ? 'Update your posting, then resubmit it for review from the dashboard.'
            : 'Changes are saved immediately.'}
        </p>
      </div>
      <JobForm
        listings={listings}
        initialValues={item}
        submitting={submitting}
        serverError={error}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        listingLocked
        onSubmit={handleSubmit}
      />
    </div>
  )
}
