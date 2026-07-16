import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar.jsx'
import { searchAll } from '../services/listingService.js'
import { getTheme } from '../config/theme.js'

// A loose network of connected nodes with a few map-pin markers - echoes the
// dashed flight-path + pin motifs already in Logo.jsx, reused here as a
// subtle "global, connected" backdrop behind the hero copy.
function NetworkMap() {
  // Two loose bands - one hugging the top edge, one the bottom - so the
  // network frames the headline/search instead of crossing through them.
  const topNodes = [
    { x: 70, y: 55 },
    { x: 290, y: 35 },
    { x: 510, y: 68 },
    { x: 730, y: 38 },
    { x: 950, y: 62 },
    { x: 1140, y: 42 },
  ]
  const bottomNodes = [
    { x: 140, y: 420 },
    { x: 380, y: 400 },
    { x: 630, y: 428 },
    { x: 870, y: 402 },
    { x: 1090, y: 418 },
  ]
  const topLinks = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
  ]
  const bottomLinks = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
  ]
  const topPinned = new Set([1, 4])
  const bottomPinned = new Set([2])

  function band(nodes, links, pinned, keyPrefix) {
    return (
      <g>
        {links.map(([a, b], i) => (
          <line
            key={`${keyPrefix}-l${i}`}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="1 8"
            strokeLinecap="round"
          />
        ))}
        {nodes.map((n, i) =>
          pinned.has(i) ? (
            <g key={`${keyPrefix}-n${i}`} transform={`translate(${n.x - 8} ${n.y - 21})`}>
              <path d="M8 0C3.6 0 0 3.6 0 8c0 6 8 15 8 15s8-9 8-15c0-4.4-3.6-8-8-8z" fill="#7c3aed" />
              <circle cx="8" cy="8" r="3" fill="#fff" />
            </g>
          ) : (
            <circle key={`${keyPrefix}-n${i}`} cx={n.x} cy={n.y} r="4.5" fill="#8b5cf6" />
          )
        )}
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 1200 470"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22]"
      aria-hidden="true"
    >
      {/* Two short edge-only links tying the bands together, kept near the
          far left/right so they don't cross the centered text column. */}
      <line x1={70} y1={55} x2={140} y2={420} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
      <line x1={1140} y1={42} x2={1090} y2={418} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
      {band(topNodes, topLinks, topPinned, 'top')}
      {band(bottomNodes, bottomLinks, bottomPinned, 'bottom')}
    </svg>
  )
}

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
      <NetworkMap />
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
