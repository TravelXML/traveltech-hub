import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, Globe, MapPin, Calendar, ChevronDown, ChevronUp, Heart, ThumbsUp, ThumbsDown } from 'lucide-react'
import TagBadge from './TagBadge.jsx'
import { getTheme } from '../config/theme.js'
import { useReaction } from '../hooks/useReaction.js'

export default function ListingCard({ listing, color }) {
  const [expanded, setExpanded] = useState(false)
  const theme = getTheme(color)
  const accentBorder = theme.ring.replace('ring-', 'border-')
  const { liked, vote, toggleLike, castVote } = useReaction(listing.id)

  const websiteHost = listing.website ? listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : null

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

      <div className="flex flex-1 flex-col p-6">
        <div className={`relative -m-6 mb-4 flex items-start gap-4 border-b border-slate-100 p-6 pb-4 ${theme.bg50}`}>
          {listing.logoUrl ? (
            <img
              src={listing.logoUrl}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl bg-white object-contain p-0.5 shadow-sm ring-1 ring-slate-200"
            />
          ) : (
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.solid} font-display text-base font-bold text-white shadow-sm`}
            >
              {listing.logoInitials}
            </span>
          )}
          <div className="min-w-0 flex-1 pr-16">
            <h3 title={listing.name} className="line-clamp-2 break-words font-display text-lg font-semibold leading-tight">
              <Link to={`/vendor/${listing.slug}`} className="text-slate-900 hover:text-brand-600">
                {listing.name}
              </Link>
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin size={13} className={theme.text} /> {listing.headquarters}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} className={theme.text} /> Founded {listing.founded}
              </span>
            </div>
          </div>

          <div className="absolute right-3 top-3 flex items-center gap-0.5">
            <button
              type="button"
              onClick={toggleLike}
              title={liked ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={liked}
              className={`rounded-full p-1.5 transition hover:bg-white/60 ${liked ? 'text-red-500' : 'text-slate-400'}`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => castVote('up')}
              title="Helpful"
              aria-pressed={vote === 'up'}
              className={`rounded-full p-1.5 transition hover:bg-white/60 ${vote === 'up' ? 'text-emerald-600' : 'text-slate-400'}`}
            >
              <ThumbsUp size={17} fill={vote === 'up' ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              onClick={() => castVote('down')}
              title="Not helpful"
              aria-pressed={vote === 'down'}
              className={`rounded-full p-1.5 transition hover:bg-white/60 ${vote === 'down' ? 'text-red-600' : 'text-slate-400'}`}
            >
              <ThumbsDown size={17} fill={vote === 'down' ? 'currentColor' : 'none'} />
            </button>
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
          {listing.email && (
            <a href={`mailto:${listing.email}`} className={`flex min-w-0 items-center gap-2 hover:${theme.text}`}>
              <Mail size={15} className={`shrink-0 ${theme.text}`} />
              <span className="truncate">{listing.email}</span>
            </a>
          )}
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className={`flex min-w-0 items-center gap-2 hover:${theme.text}`}>
              <Phone size={15} className={`shrink-0 ${theme.text}`} />
              <span className="truncate">{listing.phone}</span>
            </a>
          )}
          {!listing.email && !listing.phone && (
            <p className="text-xs text-slate-400">Contact details not yet verified.</p>
          )}
          {listing.website && (
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
          )}
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
