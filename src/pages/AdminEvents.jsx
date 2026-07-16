import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAllEvents } from '../services/adminService.js'
import SearchBar from '../components/SearchBar.jsx'

const STATUSES = ['pending', 'approved', 'rejected', 'draft', 'archived']

const STATUS_STYLES = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-slate-200 text-slate-600',
}

export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || ''
  const q = searchParams.get('q') || ''
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getAllEvents({ status: status || undefined, search: q || undefined })
      .then((rows) => active && setItems(rows))
      .catch((err) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [status, q])

  function setStatus(next) {
    const params = new URLSearchParams(searchParams)
    if (next) params.set('status', next)
    else params.delete('status')
    setSearchParams(params)
  }

  function setSearch(value) {
    const params = new URLSearchParams(searchParams)
    if (value) params.set('q', value)
    else params.delete('q')
    setSearchParams(params)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">All events</h1>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatus('')}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium ${
            !status ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600 hover:border-brand-400'
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize ${
              status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 text-slate-600 hover:border-brand-400'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 max-w-md">
        <SearchBar value={q} onChange={setSearch} placeholder="Search by name or description..." />
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-8 text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
          No events match.
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                to={`/admin/events/${item.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-900">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.city}, {item.country} · {item.startDate}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[item.status]}`}
                >
                  {item.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
