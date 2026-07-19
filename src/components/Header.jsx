import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  Menu,
  X,
  LayoutGrid,
  Newspaper,
  CalendarDays,
  Briefcase,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  LogIn,
  UserPlus,
} from 'lucide-react'
import * as Icons from 'lucide-react'
import { CATEGORIES } from '../config/categories.js'
import { getTheme } from '../config/theme.js'
import { useAuth } from '../context/AuthContext.jsx'
import { LogoFull } from './Logo.jsx'
import { SITE_URL } from '../config/site.js'

/** A nav link with a leading icon that animates on hover - shared shape for
 * the desktop nav row and the mobile menu (mobile centers/pads/backgrounds
 * on hover since it's a tap target, not an inline text link). */
function NavLink({ to, icon: Icon, children, onClick, mobile = false }) {
  if (mobile) {
    return (
      <a
        href={`${SITE_URL}${to}`}
        onClick={onClick}
        className="group flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600"
      >
        <Icon size={15} className="transition-transform duration-200 group-hover:scale-110" />
        {children}
      </a>
    )
  }
  return (
    <a
      href={`${SITE_URL}${to}`}
      onClick={onClick}
      className="group flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-brand-600"
    >
      <Icon size={16} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
      {children}
    </a>
  )
}

function NavButton({ icon: Icon, children, onClick, mobile = false }) {
  return (
    <button
      onClick={onClick}
      className={
        mobile
          ? 'group flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600'
          : 'group flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-brand-600'
      }
    >
      <Icon size={mobile ? 15 : 16} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
      {children}
    </button>
  )
}

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
        <a href={SITE_URL} className="flex items-center shrink-0" onClick={() => setMobileOpen(false)}>
          <LogoFull height={50} />
        </a>

        <nav className="hidden items-center gap-6 md:flex">
          <div
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              className="group flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-brand-600"
              onClick={() => setDropdownOpen((v) => !v)}
            >
              <LayoutGrid size={16} className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-110" />
              Find a Partner
              <ChevronDown size={16} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute left-1/2 top-full grid w-[760px] -translate-x-1/2 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
                {CATEGORIES.map((cat) => {
                  const theme = getTheme(cat.color)
                  const Icon = Icons[cat.icon] ?? Icons.Building2
                  return (
                    <a
                      key={cat.id}
                      href={`${SITE_URL}${cat.route}`}
                      className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.bg50} ${theme.text} transition-transform duration-200 group-hover:scale-110`}
                      >
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-900">{cat.name}</span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-slate-500">
                          {cat.description}
                        </span>
                      </span>
                    </a>
                  )
                })}
              </div>
            )}
          </div>
          <NavLink to="/news" icon={Newspaper}>
            News
          </NavLink>
          <NavLink to="/events" icon={CalendarDays}>
            Events
          </NavLink>
          <NavLink to="/jobs" icon={Briefcase}>
            Jobs
          </NavLink>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <NavLink to="/dashboard" icon={LayoutDashboard}>
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" icon={ShieldCheck}>
                    Admin
                  </NavLink>
                )}
                <NavButton icon={LogOut} onClick={handleLogout}>
                  Log out
                </NavButton>
              </>
            ) : (
              <>
                <NavLink to="/login" icon={LogIn}>
                  Log in
                </NavLink>
                <NavLink to="/register" icon={UserPlus}>
                  Register
                </NavLink>
              </>
            )}
          </div>
          <a
            href={`${SITE_URL}/add-business`}
            className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-md sm:inline-block"
          >
            List Your Business
          </a>
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
            Find a Partner
          </p>
          <div className="grid grid-cols-1 gap-1">
            {CATEGORIES.map((cat) => (
              <a
                key={cat.id}
                href={`${SITE_URL}${cat.route}`}
                className="rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-600"
                onClick={() => setMobileOpen(false)}
              >
                {cat.name}
              </a>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 border-t border-slate-100 pt-3">
            <NavLink to="/news" icon={Newspaper} mobile onClick={() => setMobileOpen(false)}>
              News
            </NavLink>
            <NavLink to="/events" icon={CalendarDays} mobile onClick={() => setMobileOpen(false)}>
              Events
            </NavLink>
            <NavLink to="/jobs" icon={Briefcase} mobile onClick={() => setMobileOpen(false)}>
              Jobs
            </NavLink>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-100 pt-3">
            {user ? (
              <>
                <NavLink to="/dashboard" icon={LayoutDashboard} mobile onClick={() => setMobileOpen(false)}>
                  Dashboard
                </NavLink>
                {isAdmin && (
                  <NavLink to="/admin" icon={ShieldCheck} mobile onClick={() => setMobileOpen(false)}>
                    Admin
                  </NavLink>
                )}
                <NavButton icon={LogOut} mobile onClick={handleLogout}>
                  Log out
                </NavButton>
              </>
            ) : (
              <>
                <NavLink to="/login" icon={LogIn} mobile onClick={() => setMobileOpen(false)}>
                  Log in
                </NavLink>
                <NavLink to="/register" icon={UserPlus} mobile onClick={() => setMobileOpen(false)}>
                  Register
                </NavLink>
              </>
            )}
          </div>
          <a
            href={`${SITE_URL}/add-business`}
            className="mt-3 block rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white"
            onClick={() => setMobileOpen(false)}
          >
            List Your Business
          </a>
        </div>
      )}
    </header>
  )
}
