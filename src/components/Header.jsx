import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X, Compass } from 'lucide-react'
import { CATEGORIES } from '../config/categories.js'
import { useAuth } from '../context/AuthContext.jsx'

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setMobileOpen(false)
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Compass size={20} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-slate-900">
            TravelTech Hub
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-brand-600"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              Categories <ChevronDown size={16} />
            </button>
            {dropdownOpen && (
              <div className="absolute left-1/2 top-full grid w-[560px] -translate-x-1/2 grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    to={cat.route}
                    className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                    onClick={() => setDropdownOpen(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/news" className="text-sm font-medium text-slate-700 hover:text-brand-600">
            News
          </Link>
          <Link to="/events" className="text-sm font-medium text-slate-700 hover:text-brand-600">
            Events
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-brand-600">
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="text-sm font-medium text-slate-700 hover:text-brand-600">
                    Admin
                  </Link>
                )}
                <button onClick={handleLogout} className="text-sm font-medium text-slate-700 hover:text-brand-600">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-brand-600">
                  Log in
                </Link>
                <Link to="/register" className="text-sm font-medium text-slate-700 hover:text-brand-600">
                  Register
                </Link>
              </>
            )}
          </div>
          <Link
            to="/add-business"
            className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 sm:inline-block"
          >
            List Your Business
          </Link>
          <button
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Categories
          </p>
          <div className="grid grid-cols-1 gap-1">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={cat.route}
                className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-100 pt-3">
            <Link
              to="/news"
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              News
            </Link>
            <Link
              to="/events"
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setMobileOpen(false)}
            >
              Events
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-100 pt-3">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg px-3 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
          <Link
            to="/add-business"
            className="mt-3 block rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white"
            onClick={() => setMobileOpen(false)}
          >
            List Your Business
          </Link>
        </div>
      )}
    </header>
  )
}
