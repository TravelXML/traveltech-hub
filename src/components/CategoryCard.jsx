import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'
import { getTheme } from '../config/theme.js'

export default function CategoryCard({ category }) {
  const theme = getTheme(category.color)
  const Icon = Icons[category.icon] ?? Icons.Building2
  const hoverBorder = theme.border.replace('-200', '-300')

  return (
    <Link
      to={category.route}
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-xl hover:${hoverBorder}`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} text-white shadow-sm transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-6`}
        >
          <Icon size={22} />
        </span>
        <h3 className="font-display text-lg font-semibold leading-tight text-slate-900">
          {category.name}
        </h3>
      </div>
      <p className="mt-3 flex-1 text-sm text-slate-600 line-clamp-3">{category.description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span
          className={`text-sm font-semibold ${theme.text} transition-transform duration-300 group-hover:scale-105`}
        >
          {category.listingCount ?? 0} listed
        </span>
        <span
          className={`flex items-center gap-1 text-sm font-medium text-slate-400 transition-all duration-300 group-hover:gap-2 group-hover:text-${category.color}-700`}
        >
          Browse
          <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
