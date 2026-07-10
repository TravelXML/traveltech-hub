import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8">
      <h1 className="font-display text-6xl font-bold text-slate-900">404</h1>
      <p className="mt-4 text-lg text-slate-600">This page doesn't exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        Back to home
      </Link>
    </div>
  )
}
