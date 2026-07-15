import { AlertTriangle } from 'lucide-react'
import { supabaseConfigError } from '../lib/supabase.js'

/**
 * Gates the whole app on Supabase being configured. Without this, every
 * page that queries Supabase would fail with a confusing "cannot read
 * properties of null" error instead of a clear setup message.
 */
export default function ConfigGuard({ children }) {
  if (!supabaseConfigError) return children

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <AlertTriangle size={24} />
        </span>
        <h1 className="mt-4 font-display text-xl font-bold text-slate-900">
          Supabase isn&apos;t configured yet
        </h1>
        <p className="mt-2 text-sm text-slate-600">{supabaseConfigError}</p>
        <p className="mt-4 text-xs text-slate-500">
          See <code className="rounded bg-white px-1.5 py-0.5">docs/local-development.md</code>{' '}
          for setup steps.
        </p>
      </div>
    </div>
  )
}
