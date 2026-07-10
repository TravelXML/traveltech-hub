import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import CategoryCard from '../components/CategoryCard.jsx'
import { getCategories } from '../services/listingService.js'

export default function Home() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    getCategories().then(setCategories)
  }, [])

  return (
    <div>
      <Hero />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">Browse by category</h2>
          <p className="mt-2 text-slate-600">12 sections covering the full travel technology stack.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

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
