import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Hero from '../components/Hero.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import NewsCard from '../components/NewsCard.jsx'
import EventCard from '../components/EventCard.jsx'
import { getCategories, getNews, getEvents } from '../services/listingService.js'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [news, setNews] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    getCategories().then(setCategories)
    getNews().then((items) => setNews(items.slice(0, 3)))
    getEvents().then((items) => {
      const today = new Date().toISOString().slice(0, 10)
      setEvents(items.filter((e) => e.endDate >= today).slice(0, 3))
    })
  }, [])

  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">Browse by category</h2>
          <p className="mt-2 text-slate-600">
            {categories.length} sections covering the full travel technology stack.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {news.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-900">Latest news</h2>
                <p className="mt-2 text-slate-600">Funding, launches and trends in travel tech.</p>
              </div>
              <Link
                to="/news"
                className="hidden shrink-0 items-center gap-1 font-medium text-brand-600 hover:text-brand-700 sm:flex"
              >
                View all news <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {news.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
            <Link
              to="/news"
              className="mt-6 flex items-center justify-center gap-1 font-medium text-brand-600 hover:text-brand-700 sm:hidden"
            >
              View all news <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      {events.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-900">Upcoming events</h2>
                <p className="mt-2 text-slate-600">Trade shows and conferences worth planning around.</p>
              </div>
              <Link
                to="/events"
                className="hidden shrink-0 items-center gap-1 font-medium text-violet-600 hover:text-violet-700 sm:flex"
              >
                View all events <ArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <Link
              to="/events"
              className="mt-6 flex items-center justify-center gap-1 font-medium text-violet-600 hover:text-violet-700 sm:hidden"
            >
              View all events <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      )}

      <section className="bg-brand-600">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">
              Are you a travel technology provider?
            </h3>
            <p className="mt-2 max-w-xl text-brand-100">
              Get discovered by agencies, OTAs and hoteliers looking for exactly what you offer.
              Listing is free while we grow the directory.
            </p>
          </div>
          <Link
            to="/add-business"
            className="shrink-0 rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
          >
            Add Your Travel Business
          </Link>
        </div>
      </section>
    </div>
  )
}
