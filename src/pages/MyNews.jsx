import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { getMyNews, resubmitNews } from '../services/newsService.js'

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-slate-200 text-slate-600',
}

const EDITABLE_STATUSES = ['draft', 'pending', 'rejected']

export default function MyNews() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [resubmittingId, setResubmittingId] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    getMyNews()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleResubmit(id) {
    setResubmittingId(id)
    setError('')
    try {
      await resubmitNews(id)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setResubmittingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-slate-900">My news</h1>
        <Link
          to="/add-news"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Submit news
        </Link>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          You haven&apos;t submitted any news yet.
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-lg font-semibold text-slate-900">{item.title}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Submitted {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : '—'}
                  </p>
                  {item.status === 'rejected' && item.rejectionReason && (
                    <p className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      {item.rejectionReason}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {EDITABLE_STATUSES.includes(item.status) && (
                    <Link
                      to={`/dashboard/news/${item.id}/edit`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </Link>
                  )}
                  {item.status === 'rejected' && (
                    <button
                      onClick={() => handleResubmit(item.id)}
                      disabled={resubmittingId === item.id}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resubmittingId === item.id ? 'Resubmitting…' : 'Resubmit'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
