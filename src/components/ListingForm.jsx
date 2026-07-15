import { useState } from 'react'
import { X } from 'lucide-react'
import { validateLogoFile } from '../services/storageService.js'

const PRICING_MODELS = ['Subscription', 'Per Booking', 'Commission', 'Freemium', 'Enterprise/Custom']
const PRICE_RANGES = ['$', '$$', '$$$']
const MARKETS = ['Global', 'Europe', 'APAC', 'India', 'North America', 'Middle East', 'LATAM', 'Africa']
const CURRENT_YEAR = new Date().getFullYear()

function TagInput({ values, onChange, placeholder }) {
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

export const EMPTY_LISTING_FORM = {
  name: '',
  categoryId: '',
  description: '',
  features: [],
  usps: [],
  products: [],
  targetMarkets: [],
  pricingModel: '',
  priceRange: '',
  email: '',
  phone: '',
  website: '',
  headquarters: '',
  founded: '',
}

export function validateListingForm(form) {
  const e = {}
  if (!form.name.trim()) e.name = 'Business name is required.'
  else if (form.name.trim().length > 200) e.name = 'Business name must be 200 characters or fewer.'
  if (!form.categoryId) e.categoryId = 'Please select a category.'
  if (!form.description.trim() || form.description.trim().length < 20)
    e.description = 'Description should be at least 20 characters.'
  else if (form.description.trim().length > 4000) e.description = 'Description must be 4000 characters or fewer.'
  if (form.features.length === 0) e.features = 'Add at least one feature.'
  if (form.products.length === 0) e.products = 'Add at least one product.'
  if (form.targetMarkets.length === 0) e.targetMarkets = 'Select at least one target market.'
  if (!form.pricingModel) e.pricingModel = 'Please select a pricing model.'
  if (!form.priceRange) e.priceRange = 'Please select a price range.'
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
  if (form.phone && !/^[\d+\-()\s]{7,20}$/.test(form.phone)) e.phone = 'Enter a valid phone number.'
  if (!form.website || !/^https?:\/\/.+/i.test(form.website))
    e.website = 'Website must start with http:// or https://'
  if (!form.headquarters.trim()) e.headquarters = 'Headquarters (City, Country) is required.'
  else if (form.headquarters.trim().length > 200) e.headquarters = 'Headquarters must be 200 characters or fewer.'
  const year = Number(form.founded)
  if (!year || year < 1800 || year > CURRENT_YEAR) e.founded = `Enter a valid founding year (1800-${CURRENT_YEAR}).`
  return e
}

/**
 * Shared field set for both "add a business" and "edit listing" - the two
 * flows differ only in initial values and what happens on submit, so that
 * orchestration (which RPC to call, whether to also upload a logo) stays
 * in the parent page rather than being duplicated here.
 */
export default function ListingForm({
  categories,
  initialValues,
  initialLogoUrl = null,
  submitLabel = 'Submit Listing',
  submittingLabel = 'Submitting…',
  submitting = false,
  serverError = '',
  onSubmit,
}) {
  const [form, setForm] = useState({ ...EMPTY_LISTING_FORM, ...initialValues })
  const [errors, setErrors] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [logoError, setLogoError] = useState('')
  const [logoPreview, setLogoPreview] = useState(initialLogoUrl)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  function toggleMarket(market) {
    setForm((f) => ({
      ...f,
      targetMarkets: f.targetMarkets.includes(market)
        ? f.targetMarkets.filter((m) => m !== market)
        : [...f.targetMarkets, market],
    }))
  }

  function handleLogoChange(e) {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setLogoFile(null)
      return
    }
    const validationError = validateLogoFile(file)
    if (validationError) {
      setLogoError(validationError)
      setLogoFile(null)
      return
    }
    setLogoError('')
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validateListingForm(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = { ...form, founded: Number(form.founded) }
    await onSubmit(payload, logoFile)
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
      errors[field] ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
    }`

  const FieldError = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p> : null

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl space-y-6">
      {serverError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Business name</label>
        <input
          type="text"
          maxLength={200}
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          className={inputClass('name')}
        />
        <FieldError field="name" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => set('categoryId')(e.target.value)}
          className={inputClass('categoryId')}
        >
          <option value="">Select a category...</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <FieldError field="categoryId" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          rows={4}
          maxLength={4000}
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          className={inputClass('description')}
        />
        <FieldError field="description" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Logo (optional)</label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo preview" className="h-14 w-14 rounded-xl border border-slate-200 object-contain p-1" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
              None
            </div>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleLogoChange}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
          />
        </div>
        <p className="mt-1 text-xs text-slate-500">PNG, JPEG, WebP or SVG, up to 2 MB. Shown once approved.</p>
        {logoError && <p className="mt-1 text-xs text-red-600">{logoError}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Key features</label>
        <TagInput values={form.features} onChange={set('features')} placeholder="Type a feature, press Enter" />
        <FieldError field="features" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">USPs (optional)</label>
        <TagInput values={form.usps} onChange={set('usps')} placeholder="What makes you stand out? Press Enter" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Products</label>
        <TagInput values={form.products} onChange={set('products')} placeholder="Type a product name, press Enter" />
        <FieldError field="products" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Target markets</label>
        <div className="flex flex-wrap gap-2">
          {MARKETS.map((market) => (
            <button
              type="button"
              key={market}
              onClick={() => toggleMarket(market)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                form.targetMarkets.includes(market)
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-brand-400'
              }`}
            >
              {market}
            </button>
          ))}
        </div>
        <FieldError field="targetMarkets" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Pricing model</label>
          <select
            value={form.pricingModel}
            onChange={(e) => set('pricingModel')(e.target.value)}
            className={inputClass('pricingModel')}
          >
            <option value="">Select...</option>
            {PRICING_MODELS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <FieldError field="pricingModel" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Price range</label>
          <select
            value={form.priceRange}
            onChange={(e) => set('priceRange')(e.target.value)}
            className={inputClass('priceRange')}
          >
            <option value="">Select...</option>
            {PRICE_RANGES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <FieldError field="priceRange" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Email (optional)</label>
          <input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} className={inputClass('email')} />
          <p className="mt-1 text-xs text-slate-500">Hidden publicly until verified by an admin.</p>
          <FieldError field="email" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
          <input type="tel" value={form.phone} onChange={(e) => set('phone')(e.target.value)} className={inputClass('phone')} />
          <FieldError field="phone" />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
        <input
          type="text"
          placeholder="https://"
          value={form.website}
          onChange={(e) => set('website')(e.target.value)}
          className={inputClass('website')}
        />
        <FieldError field="website" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Headquarters</label>
          <input
            type="text"
            placeholder="City, Country"
            maxLength={200}
            value={form.headquarters}
            onChange={(e) => set('headquarters')(e.target.value)}
            className={inputClass('headquarters')}
          />
          <FieldError field="headquarters" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Founded year</label>
          <input
            type="number"
            min={1800}
            max={CURRENT_YEAR}
            value={form.founded}
            onChange={(e) => set('founded')(e.target.value)}
            className={inputClass('founded')}
          />
          <FieldError field="founded" />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </form>
  )
}
