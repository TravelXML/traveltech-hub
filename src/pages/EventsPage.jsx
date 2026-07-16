import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarRange } from 'lucide-react'
import SearchBar from '../components/SearchBar.jsx'
import EventCard from '../components/EventCard.jsx'
import SeoHead from '../components/SeoHead.jsx'
import { getEvents } from '../services/eventService.js'

export default function EventsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [format, setFormat] = useState('')

  useEffect(() => {
    getEvents().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  const formats = useMemo(() => [...new Set(items.map((i) => i.format))].sort(), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((event) => {
      if (format && event.format !== format) return false
      if (!q) return true
      return [event.name, event.host, event.description, event.city, event.country]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [items, search, format])

  const today = new Date().toISOString().slice(0, 10)
  const upcoming = filtered.filter((e) => e.endDate >= today)
  const past = filtered.filter((e) => e.endDate < today)

  return (
    <div>
      <SeoHead
        title="Travel Tech Events & Conferences | TravelPin"
        description="Trade shows, conferences and summits across the travel industry - who's hosting, where, and when."
        path="/events"
      />
      <div className="bg-gradient-to-br from-violet-500 to-violet-700">
        <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <CalendarRange size={24} />
                </span>
                <h1 className="font-display text-3xl font-bold sm:text-4xl">Travel Events</h1>
              </div>
              <p className="mt-3 max-w-2xl text-white/90">
                Trade shows, conferences and summits across the travel industry - who&apos;s hosting,
                where, and when.
              </p>
              <p className="mt-4 text-sm font-medium text-white/80">
                {loading ? 'Loading...' : `${items.length} events`}
              </p>
            </div>
            <Link
              to="/add-event"
              className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
            >
              Submit Event
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search events, hosts, cities..." className="flex-1" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFormat('')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              format === ''
                ? 'border-violet-600 bg-violet-600 text-white'
                : 'border-slate-300 text-slate-600 hover:border-violet-400'
            }`}
          >
            All formats
          </button>
          {formats.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f === format ? '' : f)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                format === f
                  ? 'border-violet-600 bg-violet-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-violet-400'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {loading ? 'Loading...' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
        </p>

        {!loading && upcoming.length > 0 && (
          <>
            <h2 className="mt-8 font-display text-xl font-bold text-slate-900">Upcoming</h2>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}

        {!loading && past.length > 0 && (
          <>
            <h2 className="mt-10 font-display text-xl font-bold text-slate-900">Past events</h2>
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
              {past.map((event) => (
                <EventCard key={event.id} event={event} isPast />
              ))}
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
            No events match your search.
          </div>
        )}
      </div>
    </div>
  )
}
