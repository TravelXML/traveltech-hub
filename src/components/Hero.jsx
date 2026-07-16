import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar.jsx'
import { searchAll } from '../services/listingService.js'
import { getTheme } from '../config/theme.js'
import heroBg from '../assets/hero-bg.jpg'

export default function Hero() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      searchAll(query).then((res) => {
        if (active) setResults(res.slice(0, 8))
      })
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const goToListing = (listing) => {
    setOpen(false)
    setQuery('')
    navigate(`${listing.category.route}?q=${encodeURIComponent(listing.name)}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white">
      {/* Low-opacity backdrop, not a full-strength background: at full
          strength the icons/pins sit directly behind the headline and
          search bar (illegible, worse once bg-cover crops it tighter on
          narrow viewports) - a soft wash keeps the "connected world" motif
          without competing with the text on top of it. */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
      />
      <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24 lg:px-8">
        <h1 className="bg-gradient-to-r from-brand-600 via-violet-600 to-fuchsia-600 bg-clip-text font-display text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
          Find your next travel technology partner
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Discover and compare the technology powering modern travel - PMS, CRS, aggregators,
          channel managers, wholesalers, OTAs and more, all in one place.
        </p>

        <div ref={containerRef} className="relative mx-auto mt-8 max-w-xl">
          <SearchBar
            value={query}
            onChange={(v) => {
              setQuery(v)
              setOpen(true)
            }}
            placeholder="Search all categories - company, product, feature..."
          />
          {open && query.trim() && (
            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-xl">
              {results.length === 0 ? (
                <p className="px-4 py-4 text-sm text-slate-500">No matches found.</p>
              ) : (
                <ul className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                  {results.map((listing) => {
                    const theme = getTheme(listing.category.color)
                    return (
                      <li key={`${listing.category.id}-${listing.id}`}>
                        <button
                          onClick={() => goToListing(listing)}
                          className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50"
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.solid} text-xs font-bold text-white`}
                          >
                            {listing.logoInitials}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {listing.name}
                            </span>
                            <span className={`block text-xs font-medium ${theme.text}`}>
                              {listing.category.name}
                            </span>
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
