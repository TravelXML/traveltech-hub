import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getCategories, submitListing, setMyListingLogo } from '../services/listingService.js'
import { uploadListingLogo } from '../services/storageService.js'
import ListingForm from './ListingForm.jsx'

export default function AddBusinessForm() {
  const { user, loading: authLoading } = useAuth()
  const [categories, setCategories] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (user) getCategories().then(setCategories).catch(() => setCategories([]))
  }, [user])

  async function handleSubmit(payload, logoFile, captchaToken) {
    setServerError('')
    setSubmitting(true)
    try {
      const { id } = await submitListing(payload, captchaToken)
      if (logoFile) {
        try {
          const logoUrl = await uploadListingLogo({ userId: user.id, listingId: id, file: logoFile })
          await setMyListingLogo(id, logoUrl)
        } catch (logoErr) {
          // The listing itself was created successfully - a logo failure
          // shouldn't block that. It can be added later from the dashboard.
          console.error('Logo upload failed:', logoErr)
        }
      }
      setResult({ name: payload.name })
    } catch (err) {
      setServerError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) {
    return <div className="flex min-h-[30vh] items-center justify-center text-slate-500">Loading…</div>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h2 className="font-display text-2xl font-bold text-slate-900">Log in to list your business</h2>
        <p className="mt-2 text-slate-600">
          Create a free account to submit a listing - we&apos;ll review it before it goes live.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Create an account
          </Link>
        </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-emerald-800">Thanks - you&apos;re on the list!</h2>
        <p className="mt-2 text-emerald-700">
          Your submission for <strong>{result.name}</strong> is <strong>pending review</strong>. Our team will
          check it over before it goes live - you can track its status from your dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/dashboard/listings"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            View my listings
          </Link>
          <button
            onClick={() => setResult(null)}
            className="rounded-lg border border-emerald-300 px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Submit another business
          </button>
        </div>
      </div>
    )
  }

  return (
    <ListingForm
      categories={categories}
      initialValues={{}}
      submitting={submitting}
      serverError={serverError}
      submitLabel="Submit Listing"
      submittingLabel="Submitting…"
      requireCaptcha
      onSubmit={handleSubmit}
    />
  )
}
