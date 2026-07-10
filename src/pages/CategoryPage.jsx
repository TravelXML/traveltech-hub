import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Navigate } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { getCategoryById } from '../config/categories.js'
import { getTheme } from '../config/theme.js'
import { getListings } from '../services/listingService.js'
import { useListingFilters } from '../hooks/useListingFilters.js'
import SearchBar from '../components/SearchBar.jsx'
import FilterSidebar from '../components/FilterSidebar.jsx'
import ListingCard from '../components/ListingCard.jsx'
import TagBadge from '../components/TagBadge.jsx'

export default function CategoryPage() {
  const { categoryId } = useParams()
  const [searchParams] = useSearchParams()
  const category = getCategoryById(categoryId)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    getListings(categoryId).then((data) => {
      setListings(data)
      setLoading(false)
    })
  }, [categoryId])

  const filters = useListingFilters(listings)

  // Seed the search box from a `?q=` param (used by global search results).
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) filters.setSearch(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  if (!category) return <Navigate to="/" replace />

  const theme = getTheme(category.color)

  return (
    <div>
      <div className={`bg-gradient-to-br ${theme.gradient}`}>
        <div className="mx-auto max-w-7xl px-4 py-12 text-white sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{category.name}</h1>
          <p className="mt-3 max-w-2xl text-white/90">{category.description}</p>
          <p className="mt-4 text-sm font-medium text-white/80">
            {loading ? 'Loading…' : `${listings.length} providers listed`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-1 font-display text-base font-semibold text-slate-900">Filters</h3>
              <FilterSidebar filters={filters} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchBar
                value={filters.search}
                onChange={filters.setSearch}
                placeholder={`Search within ${category.shortName}...`}
                className="flex-1"
              />
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-medium text-slate-700 shadow-sm lg:hidden"
              >
                <SlidersHorizontal size={16} /> Filters
              </button>
              <select
                value={filters.sortBy}
                onChange={(e) => filters.setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              >
                <option value={filters.sortOptions.NAME_ASC}>Sort: Name (A-Z)</option>
                <option value={filters.sortOptions.FOUNDED_ASC}>Sort: Founded year</option>
              </select>
            </div>

            {filters.activeFilters.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {filters.activeFilters.map((chip, i) => (
                  <button
                    key={`${chip.type}-${chip.value}-${i}`}
                    onClick={chip.onRemove}
                    className="group"
                  >
                    <TagBadge kind={chip.type === 'search' ? 'product' : chip.type}>
                      <span className="flex items-center gap-1">
                        {chip.type === 'search' ? `"${chip.value}"` : chip.value}
                        <X size={12} />
                      </span>
                    </TagBadge>
                  </button>
                ))}
                <button
                  onClick={filters.clearAll}
                  className="text-sm font-medium text-slate-500 underline hover:text-slate-700"
                >
                  Clear all
                </button>
              </div>
            )}

            <p className="mt-4 text-sm text-slate-500">
              {loading ? 'Loading…' : `${filters.resultCount} result${filters.resultCount === 1 ? '' : 's'}`}
            </p>

            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
              {filters.filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} color={category.color} />
              ))}
            </div>

            {!loading && filters.filteredListings.length === 0 && (
              <div className="mt-12 rounded-2xl border border-dashed border-slate-300 py-16 text-center text-slate-500">
                No listings match your filters. Try clearing some filters.
              </div>
            )}
          </div>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="w-80 max-w-[85vw] overflow-y-auto bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-slate-900">Filters</h3>
              <button onClick={() => setDrawerOpen(false)} aria-label="Close filters">
                <X size={20} />
              </button>
            </div>
            <FilterSidebar filters={filters} />
            <button
              onClick={() => setDrawerOpen(false)}
              className={`mt-4 w-full rounded-lg ${theme.solid} py-2.5 text-sm font-semibold text-white`}
            >
              Show {filters.resultCount} results
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
