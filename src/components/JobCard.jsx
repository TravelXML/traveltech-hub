import { Link } from 'react-router-dom'
import { MapPin, Briefcase } from 'lucide-react'
import TagBadge from './TagBadge.jsx'

export default function JobCard({ job }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <TagBadge kind="hiring">{job.category}</TagBadge>
        <span className="text-xs font-medium text-slate-400">{job.employmentType}</span>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
        {job.title}
      </h3>

      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
        {job.listing?.logoUrl ? (
          <img src={job.listing.logoUrl} alt="" className="h-5 w-5 rounded bg-white object-contain" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-600 text-[10px] font-bold text-white">
            {job.listing?.logoInitials}
          </span>
        )}
        <span className="truncate font-medium">{job.listing?.name}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <MapPin size={13} /> {job.remote ? 'Remote' : job.location}
        </span>
        {job.experienceLevel && (
          <span className="flex items-center gap-1">
            <Briefcase size={13} /> {job.experienceLevel}
          </span>
        )}
      </div>

      {job.salaryRange && <p className="mt-3 text-sm font-medium text-slate-700">{job.salaryRange}</p>}

      <div className="mt-4 border-t border-slate-100 pt-4 text-sm font-medium text-brand-600 group-hover:text-brand-700">
        View role &rarr;
      </div>
    </Link>
  )
}
