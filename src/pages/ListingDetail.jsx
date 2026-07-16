import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Mail, Phone, Globe, MapPin, Calendar, BadgeCheck, Star, AlertCircle } from 'lucide-react'
import TagBadge from '../components/TagBadge.jsx'
import SeoHead from '../components/SeoHead.jsx'
import { getTheme } from '../config/theme.js'
import { getListingBySlug } from '../services/listingService.js'

export default function ListingDetail() {
  const { slug } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getListingBySlug(slug)
      .then((data) => {
        if (active) setListing(data)
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
  }, [slug])

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

  if (!listing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Listing not found</h1>
        <p className="mt-2 text-slate-600">This vendor may not exist or hasn&apos;t been approved yet.</p>
        <Link to="/" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to home
        </Link>
      </div>
    )
  }

  const theme = getTheme(listing.category?.color)
  const websiteHost = listing.website ? listing.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: listing.name,
    description: listing.description,
    ...(listing.website && { url: listing.website }),
    ...(listing.logoUrl && { logo: listing.logoUrl }),
    ...(listing.founded && { foundingDate: String(listing.founded) }),
  }

  return (
    <div>
      <SeoHead
        title={`${listing.name} | TravelTech Hub`}
        description={listing.description}
        path={`/vendor/${listing.slug}`}
        image={listing.logoUrl}
        jsonLd={jsonLd}
      />
      <div className={`bg-gradient-to-br ${theme.gradient}`}>
        <div className="mx-auto max-w-5xl px-4 py-12 text-white sm:px-6 lg:px-8">
          {listing.category && (
            <Link to={listing.category.route} className="text-sm font-medium text-white/80 hover:text-white">
              {listing.category.name}
            </Link>
          )}
          <div className="mt-3 flex items-start gap-4">
            {listing.logoUrl ? (
              <img
                src={listing.logoUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm"
              />
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/20 font-display text-xl font-bold text-white">
                {listing.logoInitials}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="break-words font-display text-3xl font-bold sm:text-4xl">{listing.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/90">
                {listing.headquarters && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {listing.headquarters}
                  </span>
                )}
                {listing.founded && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} /> Founded {listing.founded}
                  </span>
                )}
                {listing.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-medium">
                    <BadgeCheck size={14} /> Verified
                  </span>
                )}
                {listing.featured && (
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 font-medium">
                    <Star size={14} /> Featured
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="font-display text-lg font-semibold text-slate-900">About</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{listing.description}</p>
            </section>

            {listing.features.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold text-slate-900">Key features</h2>
                <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {listing.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${theme.solid}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {listing.usps.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold text-slate-900">Why choose them</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.usps.map((u) => (
                    <TagBadge key={u} kind="usp">
                      {u}
                    </TagBadge>
                  ))}
                </div>
              </section>
            )}

            {listing.products.length > 0 && (
              <section>
                <h2 className="font-display text-lg font-semibold text-slate-900">Products</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {listing.products.map((p) => (
                    <TagBadge key={p} kind="product">
                      {p}
                    </TagBadge>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-semibold text-slate-900">Details</h3>
              <dl className="mt-3 space-y-3 text-sm">
                {listing.pricingModel && (
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Pricing model</dt>
                    <dd className="font-medium text-slate-900">{listing.pricingModel}</dd>
                  </div>
                )}
                {listing.priceRange && (
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Price range</dt>
                    <dd className="font-medium text-slate-900">{listing.priceRange}</dd>
                  </div>
                )}
              </dl>
              {listing.targetMarkets.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Target markets
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {listing.targetMarkets.map((m) => (
                      <TagBadge key={m} kind="market">
                        {m}
                      </TagBadge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-sm font-semibold text-slate-900">Contact</h3>
              <div className="mt-3 space-y-2.5 text-sm text-slate-600">
                {listing.website && (
                  <a
                    href={listing.website}
                    target="_blank"
                    rel="noreferrer"
                    title={`Visit ${listing.name}'s website (${websiteHost})`}
                    className="flex min-w-0 items-center gap-2 hover:text-brand-600"
                  >
                    <Globe size={15} className="shrink-0" />
                    <span className="truncate">{websiteHost}</span>
                  </a>
                )}
                {listing.email && (
                  <a href={`mailto:${listing.email}`} className="flex min-w-0 items-center gap-2 hover:text-brand-600">
                    <Mail size={15} className="shrink-0" />
                    <span className="truncate">{listing.email}</span>
                  </a>
                )}
                {listing.phone && (
                  <a href={`tel:${listing.phone}`} className="flex min-w-0 items-center gap-2 hover:text-brand-600">
                    <Phone size={15} className="shrink-0" />
                    <span className="truncate">{listing.phone}</span>
                  </a>
                )}
                {!listing.email && !listing.phone && (
                  <p className="text-xs text-slate-400">
                    Direct contact details haven&apos;t been verified yet - use the website above.
                  </p>
                )}
              </div>
              {listing.website && (
                <a
                  href={listing.website}
                  target="_blank"
                  rel="noreferrer"
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg ${theme.solid} px-3 py-2.5 text-sm font-medium text-white transition ${theme.solidHover}`}
                >
                  <Globe size={15} /> Visit website
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
