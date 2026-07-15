import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertCircle, BadgeCheck, Star } from 'lucide-react'
import {
  getListingByIdForAdmin,
  approveListing,
  rejectListing,
  archiveListing,
  setListingFeatured,
  setListingVerified,
} from '../services/adminService.js'
import TagBadge from '../components/TagBadge.jsx'

export default function AdminListingDetail() {
  const { id } = useParams()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  function load() {
    setLoading(true)
    getListingByIdForAdmin(id)
      .then(setListing)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function runAction(action, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return
    setBusy(true)
    setActionError('')
    try {
      await action()
      load()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleReject(e) {
    e.preventDefault()
    if (!rejectReason.trim()) {
      setActionError('A rejection reason is required.')
      return
    }
    await runAction(() => rejectListing(id, rejectReason.trim()), 'Reject this listing?')
    setShowRejectForm(false)
    setRejectReason('')
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }
  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <p className="mt-4 text-slate-600">{error}</p>
      </div>
    )
  }
  if (!listing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Listing not found</h1>
        <Link to="/admin/listings" className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to all listings
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/admin/listings" className="text-sm font-medium text-slate-500 hover:text-slate-700">
        ← Back to all listings
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-slate-900">{listing.name}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
              {listing.status}
            </span>
            {listing.verified && (
              <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
            {listing.featured && (
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                <Star size={12} /> Featured
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {listing.category?.name} · Owner: {listing.ownerId ?? 'Imported (no owner)'}
          </p>
        </div>
      </div>

      {actionError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {listing.status === 'pending' && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                runAction(() => approveListing(id), `Approve "${listing.name}"? It will become publicly visible.`)
              }
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Approve
            </button>
            <button
              disabled={busy}
              onClick={() => setShowRejectForm((v) => !v)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Reject
            </button>
          </>
        )}
        {listing.status !== 'archived' && (
          <button
            disabled={busy}
            onClick={() =>
              runAction(() => archiveListing(id), `Archive "${listing.name}"? It will be removed from public view.`)
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Archive
          </button>
        )}
        {listing.status === 'approved' && (
          <>
            <button
              disabled={busy}
              onClick={() => runAction(() => setListingFeatured(id, !listing.featured))}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {listing.featured ? 'Unfeature' : 'Feature'}
            </button>
            <button
              disabled={busy}
              onClick={() => runAction(() => setListingVerified(id, !listing.verified))}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {listing.verified ? 'Unverify contact' : 'Verify contact'}
            </button>
          </>
        )}
      </div>

      {showRejectForm && (
        <form onSubmit={handleReject} className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <label className="mb-1 block text-sm font-medium text-red-800">
            Rejection reason (required, shown to the owner)
          </label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/40"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              Confirm rejection
            </button>
            <button
              type="button"
              onClick={() => setShowRejectForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {listing.status === 'rejected' && listing.rejectionReason && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Rejection reason:</strong> {listing.rejectionReason}
        </p>
      )}

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h2>
          <p className="mt-2 text-slate-700">{listing.description}</p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Contact</h2>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <div>
                <dt className="inline text-slate-500">Email: </dt>
                <dd className="inline">{listing.email || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Phone: </dt>
                <dd className="inline">{listing.phone || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Website: </dt>
                <dd className="inline">{listing.website || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">HQ: </dt>
                <dd className="inline">{listing.headquarters || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Founded: </dt>
                <dd className="inline">{listing.founded || '—'}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Pricing</h2>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <div>
                <dt className="inline text-slate-500">Model: </dt>
                <dd className="inline">{listing.pricingModel || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Range: </dt>
                <dd className="inline">{listing.priceRange || '—'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {listing.features.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Features</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {listing.features.map((f) => (
                <TagBadge key={f}>{f}</TagBadge>
              ))}
            </div>
          </section>
        )}
        {listing.usps.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">USPs</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
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
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Products</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {listing.products.map((p) => (
                <TagBadge key={p} kind="product">
                  {p}
                </TagBadge>
              ))}
            </div>
          </section>
        )}
        {listing.targetMarkets.length > 0 && (
          <section>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Target markets</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {listing.targetMarkets.map((m) => (
                <TagBadge key={m} kind="market">
                  {m}
                </TagBadge>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
