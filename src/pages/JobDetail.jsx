import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapPin, Briefcase, Calendar, AlertCircle } from 'lucide-react'
import TagBadge from '../components/TagBadge.jsx'
import ApplyForm from '../components/ApplyForm.jsx'
import SeoHead from '../components/SeoHead.jsx'
import { getJobById } from '../services/jobService.js'

export default function JobDetail() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getJobById(id)
      .then((data) => {
        if (active) setJob(data)
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

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-slate-600">{error}</p>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Job not found</h1>
        <p className="mt-2 text-slate-600">This role may have closed or hasn&apos;t been approved yet.</p>
        <Link to="/jobs" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to jobs
        </Link>
      </div>
    )
  }

  return (
    <div>
      <SeoHead
        title={`${job.title} at ${job.listing?.name} | TravelPin`}
        description={job.description}
        path={`/jobs/${job.id}`}
      />
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700">
        <div className="mx-auto max-w-5xl px-4 py-12 text-white sm:px-6 lg:px-8">
          <Link to="/jobs" className="text-sm font-medium text-white/80 hover:text-white">
            &larr; Back to jobs
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <TagBadge kind="hiring">{job.category}</TagBadge>
            <span className="text-sm font-medium text-white/80">{job.employmentType}</span>
          </div>
          <h1 className="mt-3 break-words font-display text-3xl font-bold sm:text-4xl">{job.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
            {job.listing && (
              <Link to={`/vendor/${job.listing.slug}`} className="font-medium underline hover:text-white">
                {job.listing.name}
              </Link>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {job.remote ? 'Remote' : job.location}
            </span>
            {job.experienceLevel && (
              <span className="flex items-center gap-1">
                <Briefcase size={14} /> {job.experienceLevel}
              </span>
            )}
            {job.closesAt && (
              <span className="flex items-center gap-1">
                <Calendar size={14} /> Apply by {new Date(job.closesAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-display text-lg font-semibold text-slate-900">About the role</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{job.description}</p>
            </section>
            {job.salaryRange && (
              <section>
                <h2 className="font-display text-lg font-semibold text-slate-900">Salary</h2>
                <p className="mt-2 text-slate-600">{job.salaryRange}</p>
              </section>
            )}
          </div>

          <aside>
            <ApplyForm jobId={job.id} />
          </aside>
        </div>
      </div>
    </div>
  )
}
