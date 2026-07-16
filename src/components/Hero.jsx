import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Hotel, Ship, TrainFront, Building2, Globe2, Share2, Warehouse, CalendarCheck, Route, MapPin } from 'lucide-react'
import SearchBar from './SearchBar.jsx'
import { searchAll } from '../services/listingService.js'
import { getTheme } from '../config/theme.js'

// A network of connected nodes, each carrying the icon of an actual
// category from config/categories.js - literally "every corner of travel
// tech, connected in one directory." Two loose bands (top edge, bottom
// edge) frame the headline/search instead of crossing through them.
function NetworkMap() {
  const topNodes = [
    { x: 70, y: 55, Icon: Plane },
    { x: 290, y: 35, Icon: Hotel },
    { x: 510, y: 68, Icon: Ship },
    { x: 730, y: 38, Icon: TrainFront },
    { x: 950, y: 62, Icon: Building2 },
    { x: 1140, y: 42, Icon: Globe2 },
  ]
  const bottomNodes = [
    { x: 140, y: 420, Icon: Share2 },
    { x: 380, y: 400, Icon: Warehouse },
    { x: 630, y: 428, Icon: CalendarCheck },
    { x: 870, y: 402, Icon: Route },
    { x: 1090, y: 418, Icon: MapPin },
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

  function band(nodes, links, keyPrefix) {
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
        {nodes.map(({ x, y, Icon }, i) => (
          <g key={`${keyPrefix}-n${i}`}>
            <circle cx={x} cy={y} r="15" fill="#fff" stroke="#8b5cf6" strokeWidth="1.5" />
            <Icon x={x - 9} y={y - 9} width={18} height={18} color="#7c3aed" strokeWidth={2.2} />
          </g>
        ))}
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 1200 470"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.3]"
      aria-hidden="true"
    >
      {/* Two short edge-only links tying the bands together, kept near the
          far left/right so they don't cross the centered text column. */}
      <line x1={70} y1={55} x2={140} y2={420} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
      <line x1={1140} y1={42} x2={1090} y2={418} stroke="#8b5cf6" strokeWidth="2" strokeDasharray="1 8" strokeLinecap="round" />
      {band(topNodes, topLinks, 'top')}
      {band(bottomNodes, bottomLinks, 'bottom')}
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
