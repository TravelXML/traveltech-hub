import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Newspaper } from 'lucide-react'
import SearchBar from '../components/SearchBar.jsx'
import NewsCard from '../components/NewsCard.jsx'
import { getNews } from '../services/newsService.js'

export default function NewsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  useEffect(() => {
    getNews().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  const categories = useMemo(() => [...new Set(items.map((i) => i.category))].sort(), [items])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      if (category && item.category !== category) return false
      if (!q) return true
      return [item.title, item.summary, ...(item.tags ?? [])].join(' ').toLowerCase().includes(q)
    })
  }, [items, search, category])

  return (
    <div>
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700">
        <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Newspaper size={24} />
                </span>
                <h1 className="font-display text-3xl font-bold sm:text-4xl">Travel News</h1>
              </div>
              <p className="mt-3 max-w-2xl text-white/90">
                The latest funding, product launches, partnerships and industry trends across travel
                technology, curated from trade press.
              </p>
              <p className="mt-4 text-sm font-medium text-white/80">
                {loading ? 'Loading...' : `${items.length} stories`}
              </p>
            </div>
            <Link
              to="/add-news"
              className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
            >
              Submit News
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search news..." className="flex-1" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              category === ''
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-slate-300 text-slate-600 hover:border-brand-400'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat === category ? '' : cat)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                category === cat
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-brand-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {loading ? 'Loading...' : `${filtered.length} result${filtered.length === 1 ? '' : 's'}`}
        </p>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
          {filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
            No stories match your search.
          </div>
        )}
      </div>
    </div>
  )
}
