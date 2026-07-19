import { CATEGORIES } from '../config/categories.js'
import { LogoFull } from './Logo.jsx'
import { SITE_URL } from '../config/site.js'

export default function Footer() {
  const mid = Math.ceil(CATEGORIES.length / 2)
  const columns = [CATEGORIES.slice(0, mid), CATEGORIES.slice(mid)]

  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
          <div>
            <a href={SITE_URL} className="flex items-center">
              <LogoFull height={40} />
            </a>
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              The directory for discovering travel technology providers across every corner of
              the industry.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a href={`${SITE_URL}/news`} className="text-sm font-medium text-slate-400 hover:text-white">
                News
              </a>
              <a href={`${SITE_URL}/events`} className="text-sm font-medium text-slate-400 hover:text-white">
                Events
              </a>
              <a href={`${SITE_URL}/jobs`} className="text-sm font-medium text-slate-400 hover:text-white">
                Jobs
              </a>
              <a href={`${SITE_URL}/contact`} className="text-sm font-medium text-slate-400 hover:text-white">
                Feedback
              </a>
            </div>
          </div>
          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categories
              </h4>
              <ul className="mt-3 space-y-2">
                {col.map((cat) => (
                  <li key={cat.id}>
                    <a href={`${SITE_URL}${cat.route}`} className="text-sm text-slate-400 hover:text-white">
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()}{' '}
            <a href={SITE_URL} className="hover:text-white">
              travelpin.space
            </a>
          </p>
          <a href={`${SITE_URL}/add-business`} className="font-medium text-brand-400 hover:text-brand-300">
            List Your Business &rarr;
          </a>
        </div>
      </div>
    </footer>
  )
}
