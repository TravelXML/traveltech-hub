import { useState } from 'react'
import { Mail, Phone, Globe, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import TagBadge from './TagBadge.jsx'
import { getTheme } from '../config/theme.js'

export default function ListingCard({ listing, color }) {
  const [expanded, setExpanded] = useState(false)
  const theme = getTheme(color)
  const accentBorder = theme.ring.replace('ring-', 'border-')

  const websiteHost = listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

      <div className="flex flex-1 flex-col p-6">
        <div className={`-m-6 mb-4 flex items-start gap-4 border-b border-slate-100 p-6 pb-4 ${theme.bg50}`}>
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.solid} font-display text-base font-bold text-white shadow-sm`}
          >
            {listing.logoInitials}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg font-semibold text-slate-900">{listing.name}</h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin size={13} className={theme.text} /> {listing.headquarters}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className={theme.text} /> Founded {listing.founded}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 line-clamp-3">{listing.description}</p>

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

        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <a
            href={`mailto:${listing.email}`}
            className={`flex min-w-0 items-center gap-2 hover:${theme.text}`}
          >
            <Mail size={15} className={`shrink-0 ${theme.text}`} />
            <span className="truncate">{listing.email}</span>
          </a>
          <a href={`tel:${listing.phone}`} className={`flex min-w-0 items-center gap-2 hover:${theme.text}`}>
            <Phone size={15} className={`shrink-0 ${theme.text}`} />
            <span className="truncate">{listing.phone}</span>
          </a>
          <a
            href={listing.website}
            target="_blank"
            rel="noreferrer"
            title={`Visit ${listing.name}'s website (${websiteHost})`}
            className={`inline-flex w-fit items-center gap-2 rounded-lg ${theme.solid} px-3 py-1.5 text-sm font-medium text-white transition ${theme.solidHover}`}
          >
            <Globe size={15} className="shrink-0" />
            Visit website
          </a>
        </div>

        <button
          onClick={() => setExpanded((v) => !v)}
          className={`mt-4 flex items-center justify-center gap-1 rounded-lg border ${accentBorder} ${theme.bg50} py-2 text-sm font-semibold ${theme.text} transition hover:text-white ${theme.solid.replace('bg-', 'hover:bg-')}`}
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
    </div>
  )
}
