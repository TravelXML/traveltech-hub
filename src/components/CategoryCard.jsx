import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { getTheme } from '../config/theme.js'

export default function CategoryCard({ category }) {
  const theme = getTheme(category.color)
  const Icon = Icons[category.icon] ?? Icons.Building2

  return (
    <Link
      to={category.route}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <span
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} text-white`}
      >
        <Icon size={24} />
      </span>
      <h3 className="font-display text-lg font-semibold text-slate-900">{category.name}</h3>
      <p className="mt-2 flex-1 text-sm text-slate-600 line-clamp-3">{category.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-sm font-semibold ${theme.text}`}>
          {category.listingCount ?? 0} listed
        </span>
        <span
          className={`text-sm font-medium text-slate-400 transition group-hover:${theme.text}`}
        >
          Browse &rarr;
        </span>
      </div>
    </Link>
  )
}
