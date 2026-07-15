import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// UX convenience only - RLS + the admin-only RPCs are the real boundary.
export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
