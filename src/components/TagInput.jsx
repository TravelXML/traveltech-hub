import { useState } from 'react'
import { X } from 'lucide-react'

/** Free-text chip input shared by ListingForm/NewsForm - type a value, press
 * Enter or comma (or blur) to add it as a removable chip. */
export default function TagInput({ values, onChange, placeholder }) {
  const [draft, setDraft] = useState('')

  function addTag() {
    const v = draft.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setDraft('')
  }

  return (
    <div className="rounded-lg border border-slate-300 p-2 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30">
      <div className="mb-1.5 flex flex-wrap gap-1.5">
        {values.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700"
          >
            {tag}
            <button type="button" onClick={() => onChange(values.filter((t) => t !== tag))}>
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag()
          }
        }}
        onBlur={addTag}
        placeholder={placeholder}
        className="w-full border-none p-1 text-sm outline-none"
      />
    </div>
  )
}
