// Visually distinct tag styles per tag "kind" so users can scan a card's
// products / geography / pricing tags at a glance.
const KIND_STYLES = {
  product: 'bg-slate-100 text-slate-700 border-slate-200',
  feature: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  market: 'bg-blue-50 text-blue-700 border-blue-200',
  pricingModel: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  priceRange: 'bg-amber-50 text-amber-800 border-amber-200',
  usp: 'bg-purple-50 text-purple-700 border-purple-200',
  hiring: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export default function TagBadge({ kind = 'product', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${KIND_STYLES[kind]} ${className}`}
    >
      {children}
    </span>
  )
}
