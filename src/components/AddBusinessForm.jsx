import { useState } from 'react'
import { X } from 'lucide-react'
import { CATEGORIES } from '../config/categories.js'
import { submitListing } from '../services/listingService.js'

const PRICING_MODELS = ['Subscription', 'Per Booking', 'Commission', 'Freemium', 'Enterprise/Custom']
const PRICE_RANGES = ['$', '$$', '$$$']
const MARKETS = ['Global', 'Europe', 'APAC', 'India', 'North America', 'Middle East', 'LATAM', 'Africa']

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

const initialForm = {
  name: '',
  categoryId: '',
  description: '',
  features: [],
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

export default function AddBusinessForm() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const set = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  function toggleMarket(market) {
    setForm((f) => ({
      ...f,
      targetMarkets: f.targetMarkets.includes(market)
        ? f.targetMarkets.filter((m) => m !== market)
        : [...f.targetMarkets, market],
    }))
  }

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Business name is required.'
    if (!form.categoryId) e.categoryId = 'Please select a category.'
    if (!form.description.trim() || form.description.trim().length < 20)
      e.description = 'Description should be at least 20 characters.'
    if (form.features.length === 0) e.features = 'Add at least one feature.'
    if (form.products.length === 0) e.products = 'Add at least one product.'
    if (form.targetMarkets.length === 0) e.targetMarkets = 'Select at least one target market.'
    if (!form.pricingModel) e.pricingModel = 'Please select a pricing model.'
    if (!form.priceRange) e.priceRange = 'Please select a price range.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!/^[\d+\-()\s]{7,}$/.test(form.phone)) e.phone = 'Enter a valid phone number.'
    if (!/^https?:\/\/.+/i.test(form.website)) e.website = 'Website must start with http:// or https://'
    if (!form.headquarters.trim()) e.headquarters = 'Headquarters (City, Country) is required.'
    const year = Number(form.founded)
    if (!year || year < 1800 || year > new Date().getFullYear())
      e.founded = 'Enter a valid founding year.'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const payload = { ...form, founded: Number(form.founded) }
    // Future: this call will POST to a real backend endpoint instead of logging.
    await submitListing(payload)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-emerald-800">Thanks - you're on the list!</h2>
        <p className="mt-2 text-emerald-700">
          Your submission for <strong>{form.name}</strong> has been received. Our team will review it
          shortly (check your console for the payload that would be sent to the API).
        </p>
        <button
          onClick={() => {
            setForm(initialForm)
            setSubmitted(false)
          }}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Submit another business
        </button>
      </div>
    )
  }

  const inputClass = (field) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 ${
      errors[field] ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
    }`

  const FieldError = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-600">{errors[field]}</p> : null

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl space-y-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Business name</label>
        <input
          type="text"
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
          {CATEGORIES.map((c) => (
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
          value={form.description}
          onChange={(e) => set('description')(e.target.value)}
          className={inputClass('description')}
        />
        <FieldError field="description" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Key features</label>
        <TagInput values={form.features} onChange={set('features')} placeholder="Type a feature, press Enter" />
        <FieldError field="features" />
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
          <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email')(e.target.value)}
            className={inputClass('email')}
          />
          <FieldError field="email" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set('phone')(e.target.value)}
            className={inputClass('phone')}
          />
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
            value={form.founded}
            onChange={(e) => set('founded')(e.target.value)}
            className={inputClass('founded')}
          />
          <FieldError field="founded" />
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-brand-600 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Submit Listing
      </button>
    </form>
  )
}
