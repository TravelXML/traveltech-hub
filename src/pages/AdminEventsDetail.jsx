import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { getEventByIdForAdmin, approveEvent, rejectEvent, archiveEvent } from '../services/adminService.js'

export default function AdminEventsDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)

  function load() {
    setLoading(true)
    getEventByIdForAdmin(id)
      .then(setItem)
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
    await runAction(() => rejectEvent(id, rejectReason.trim()), 'Reject this event?')
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
  if (!item) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Event not found</h1>
        <Link to="/admin/events" className="mt-4 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to all events
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link to="/admin/events" className="text-sm font-medium text-slate-500 hover:text-slate-700">
        ← Back to all events
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-slate-900">{item.name}</h1>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700">
              {item.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {item.format} · Owner: {item.ownerId ?? 'Imported (no owner)'}
          </p>
        </div>
      </div>

      {actionError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        {item.status === 'pending' && (
          <>
            <button
              disabled={busy}
              onClick={() =>
                runAction(() => approveEvent(id), `Approve "${item.name}"? It will become publicly visible.`)
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
        {item.status !== 'archived' && (
          <button
            disabled={busy}
            onClick={() =>
              runAction(() => archiveEvent(id), `Archive "${item.name}"? It will be removed from public view.`)
            }
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Archive
          </button>
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

      {item.status === 'rejected' && item.rejectionReason && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <strong>Rejection reason:</strong> {item.rejectionReason}
        </p>
      )}

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Description</h2>
          <p className="mt-2 text-slate-700">{item.description}</p>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">When &amp; where</h2>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <div>
                <dt className="inline text-slate-500">Dates: </dt>
                <dd className="inline">{item.startDate} – {item.endDate}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Location: </dt>
                <dd className="inline">{item.city}, {item.country}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Venue: </dt>
                <dd className="inline">{item.venue || '—'}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">Details</h2>
            <dl className="mt-2 space-y-1 text-sm text-slate-700">
              <div>
                <dt className="inline text-slate-500">Host: </dt>
                <dd className="inline">{item.host || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Audience: </dt>
                <dd className="inline">{item.audience || '—'}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Website: </dt>
                <dd className="inline">{item.website || '—'}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}
