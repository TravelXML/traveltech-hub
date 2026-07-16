import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth()

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold text-slate-900">
        Welcome{profile?.fullName ? `, ${profile.fullName}` : ''}
      </h1>
      <p className="mt-2 text-slate-600">{user?.email}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Link
          to="/dashboard/listings"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">My listings</h2>
          <p className="mt-2 text-sm text-slate-600">View, edit and resubmit your business listings.</p>
        </Link>
        <Link
          to="/add-business"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">Add a business</h2>
          <p className="mt-2 text-sm text-slate-600">Submit a new listing for review.</p>
        </Link>
        <Link
          to="/dashboard/news"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">My news</h2>
          <p className="mt-2 text-sm text-slate-600">View, edit and resubmit your news submissions.</p>
        </Link>
        <Link
          to="/dashboard/events"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">My events</h2>
          <p className="mt-2 text-sm text-slate-600">View, edit and resubmit your event submissions.</p>
        </Link>
        <Link
          to="/dashboard/jobs"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">My job postings</h2>
          <p className="mt-2 text-sm text-slate-600">Post jobs under your listings and review applicants.</p>
        </Link>
        <Link
          to="/dashboard/applications"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">My applications</h2>
          <p className="mt-2 text-sm text-slate-600">Track the jobs you&apos;ve applied to.</p>
        </Link>
        {isAdmin && (
          <Link
            to="/admin"
            className="rounded-2xl border border-brand-200 bg-brand-50 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:col-span-2"
          >
            <h2 className="font-display text-lg font-semibold text-brand-800">Admin dashboard</h2>
            <p className="mt-2 text-sm text-brand-700">Review pending submissions and manage listings.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
