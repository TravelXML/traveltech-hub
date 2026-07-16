import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import SearchBar from '../components/SearchBar.jsx'
import JobCard from '../components/JobCard.jsx'
import SeoHead from '../components/SeoHead.jsx'
import { getJobs } from '../services/jobService.js'
import { JOB_CATEGORIES } from '../components/JobForm.jsx'

export default function JobsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [remoteOnly, setRemoteOnly] = useState(false)

  useEffect(() => {
    getJobs().then((data) => {
      setItems(data)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((job) => {
      if (category && job.category !== category) return false
      if (remoteOnly && !job.remote) return false
      if (!q) return true
      return [job.title, job.description, job.listing?.name, job.location].join(' ').toLowerCase().includes(q)
    })
  }, [items, search, category, remoteOnly])

  return (
    <div>
      <SeoHead
        title="Travel Tech Jobs | TravelPin"
        description="Engineering, product, data, sales, marketing, hotel management, finance, HR, design and more - roles from travel technology companies."
        path="/jobs"
      />
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-700">
        <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Briefcase size={24} />
                </span>
                <h1 className="font-display text-3xl font-bold sm:text-4xl">Travel Tech Jobs</h1>
              </div>
              <p className="mt-3 max-w-2xl text-white/90">
                Engineering, product, data, sales, marketing, hotel management, finance, HR, design and more -
                roles posted by travel technology companies in the directory.
              </p>
              <p className="mt-4 text-sm font-medium text-white/80">
                {loading ? 'Loading...' : `${items.length} open role${items.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <Link
              to="/add-job"
              className="shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
            >
              Post a Job
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search jobs, companies, locations..." className="flex-1" />
          <label className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500/30"
            />
            Remote only
          </label>
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
          {JOB_CATEGORIES.map((cat) => (
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
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="mt-12 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
            No jobs match your search.
          </div>
        )}
      </div>
    </div>
  )
}
