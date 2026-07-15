import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// UX convenience only - redirects a logged-out visitor to /login. The
// actual security boundary is Postgres RLS; this just avoids flashing
// protected UI before a request would fail anyway.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
