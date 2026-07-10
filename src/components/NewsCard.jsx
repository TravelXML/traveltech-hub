import { ExternalLink, Calendar } from 'lucide-react'
import TagBadge from './TagBadge.jsx'

const CATEGORY_STYLES = {
  Funding: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Product Launch': 'bg-sky-50 text-sky-700 border-sky-200',
  'M&A': 'bg-purple-50 text-purple-700 border-purple-200',
  Partnership: 'bg-amber-50 text-amber-800 border-amber-200',
  Regulation: 'bg-red-50 text-red-700 border-red-200',
  'Industry Trend': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Earnings: 'bg-teal-50 text-teal-700 border-teal-200',
}

export default function NewsCard({ item }) {
  const dateLabel = new Date(item.publishedDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <a
      href={item.sourceUrl}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            CATEGORY_STYLES[item.category] ?? CATEGORY_STYLES['Industry Trend']
          }`}
        >
          {item.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={12} /> {dateLabel}
        </span>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-slate-900 group-hover:text-brand-700">
        {item.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3">{item.summary}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(item.tags ?? []).map((tag) => (
          <TagBadge key={tag} kind="product">
            {tag}
          </TagBadge>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="font-medium text-slate-500">{item.source}</span>
        <span className="flex items-center gap-1 font-medium text-brand-600 group-hover:text-brand-700">
          Read story <ExternalLink size={14} />
        </span>
      </div>
    </a>
  )
}
