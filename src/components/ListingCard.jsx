import { useState } from 'react'
import { Mail, Phone, Globe, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import TagBadge from './TagBadge.jsx'
import { getTheme } from '../config/theme.js'

export default function ListingCard({ listing, color }) {
  const [expanded, setExpanded] = useState(false)
  const theme = getTheme(color)

  const websiteHost = listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.solid} font-display text-base font-bold text-white`}
        >
          {listing.logoInitials}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold text-slate-900">{listing.name}</h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin size={13} /> {listing.headquarters}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={13} /> Founded {listing.founded}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600 line-clamp-3">{listing.description}</p>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Key features
        </p>
        <ul className="space-y-1 text-sm text-slate-700">
          {(expanded ? listing.features : listing.features.slice(0, 3)).map((f) => (
            <li key={f} className="flex gap-2">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${theme.solid}`} />
              {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(expanded ? listing.usps : listing.usps.slice(0, 2)).map((usp) => (
          <TagBadge key={usp} kind="usp">
            {usp}
          </TagBadge>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(expanded ? listing.products : listing.products.slice(0, 3)).map((p) => (
          <TagBadge key={p} kind="product">
            {p}
          </TagBadge>
        ))}
        {listing.targetMarkets.map((m) => (
          <TagBadge key={m} kind="market">
            {m}
          </TagBadge>
        ))}
        <TagBadge kind="pricingModel">{listing.pricingModel}</TagBadge>
        <TagBadge kind="priceRange">{listing.priceRange}</TagBadge>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 sm:grid-cols-2">
        <a
          href={`mailto:${listing.email}`}
          className={`flex items-center gap-2 truncate hover:${theme.text}`}
        >
          <Mail size={15} className="shrink-0" /> <span className="truncate">{listing.email}</span>
        </a>
        <a href={`tel:${listing.phone}`} className={`flex items-center gap-2 hover:${theme.text}`}>
          <Phone size={15} className="shrink-0" /> {listing.phone}
        </a>
        <a
          href={listing.website}
          target="_blank"
          rel="noreferrer"
          className={`flex items-center gap-2 truncate hover:${theme.text} sm:col-span-2`}
        >
          <Globe size={15} className="shrink-0" /> <span className="truncate">{websiteHost}</span>
        </a>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className={`mt-4 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50`}
      >
        {expanded ? (
          <>
            Show less <ChevronUp size={16} />
          </>
        ) : (
          <>
            View details <ChevronDown size={16} />
          </>
        )}
      </button>
    </div>
  )
}
