import { ExternalLink, MapPin, Users, CalendarDays } from 'lucide-react'
import TagBadge from './TagBadge.jsx'

const FORMAT_STYLES = {
  'In-person': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Virtual: 'bg-sky-50 text-sky-700 border-sky-200',
  Hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
}

function formatRange(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  const s = new Date(start)
  const e = new Date(end)
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
  const startLabel = s.toLocaleDateString(undefined, sameMonth ? { month: 'short', day: 'numeric' } : opts)
  const endLabel = e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return start === end ? endLabel : `${startLabel} - ${endLabel}`
}

export default function EventCard({ event, isPast = false }) {
  return (
    <div
      className={`flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${
        isPast ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            FORMAT_STYLES[event.format] ?? FORMAT_STYLES['In-person']
          }`}
        >
          {event.format}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <CalendarDays size={13} /> {formatRange(event.startDate, event.endDate)}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-slate-900">{event.name}</h3>
      <p className="mt-1 text-xs font-medium text-slate-500">Hosted by {event.host}</p>

      <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3">{event.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <MapPin size={13} className="text-brand-600" />
          {event.city}, {event.country}
        </span>
        <span className="flex items-center gap-1">
          <Users size={13} className="text-brand-600" />
          {event.audience}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        <TagBadge kind="market">{event.venue}</TagBadge>
      </div>

      <a
        href={event.website}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-center gap-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        View event <ExternalLink size={14} />
      </a>
    </div>
  )
}
