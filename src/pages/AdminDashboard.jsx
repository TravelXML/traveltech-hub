import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPendingListings } from '../services/adminService.js'

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPendingListings()
      .then((rows) => setPendingCount(rows.length))
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">Admin dashboard</h1>
      <p className="mt-2 text-slate-600">Review submissions and manage the directory.</p>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          to="/admin/listings?status=pending"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <p className="font-display text-3xl font-bold text-amber-800">{pendingCount ?? '—'}</p>
          <h2 className="mt-1 font-display text-lg font-semibold text-amber-900">Pending submissions</h2>
          <p className="mt-1 text-sm text-amber-700">Awaiting review</p>
        </Link>
        <Link
          to="/admin/listings"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">All listings</h2>
          <p className="mt-2 text-sm text-slate-600">Browse, search and moderate every listing.</p>
        </Link>
      </div>
    </div>
  )
}
