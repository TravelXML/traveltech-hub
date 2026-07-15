import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getCategories, getMyListingById, updateMyListing, setMyListingLogo } from '../services/listingService.js'
import { uploadListingLogo } from '../services/storageService.js'
import ListingForm from '../components/ListingForm.jsx'

function toFormValues(listing) {
  return {
    ...listing,
    founded: listing.founded != null ? String(listing.founded) : '',
    email: listing.email ?? '',
    phone: listing.phone ?? '',
    website: listing.website ?? '',
    headquarters: listing.headquarters ?? '',
  }
}

export default function EditListing() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getCategories(), getMyListingById(id)])
      .then(([cats, l]) => {
        if (!active) return
        setCategories(cats)
        if (!l) setNotFound(true)
        else setListing(l)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [id])

  async function handleSubmit(payload, logoFile) {
    setError('')
    setSubmitting(true)
    try {
      await updateMyListing(id, payload)
      if (logoFile) {
        const logoUrl = await uploadListingLogo({ userId: user.id, listingId: id, file: logoFile })
        await setMyListingLogo(id, logoUrl)
      }
      navigate('/dashboard/listings')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-slate-500">Loading…</div>
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">Listing not found</h1>
        <p className="mt-2 text-slate-600">This listing doesn&apos;t exist or isn&apos;t yours.</p>
        <Link to="/dashboard/listings" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my listings
        </Link>
      </div>
    )
  }

  if (listing.status === 'approved' || listing.status === 'archived') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">This listing can&apos;t be edited</h1>
        <p className="mt-2 text-slate-600">Approved and archived listings can&apos;t be changed here.</p>
        <Link to="/dashboard/listings" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my listings
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Edit listing</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          {listing.status === 'rejected'
            ? 'Update your listing, then resubmit it for review from the dashboard.'
            : 'Changes are saved immediately.'}
        </p>
      </div>
      <ListingForm
        categories={categories}
        initialValues={toFormValues(listing)}
        initialLogoUrl={listing.logoUrl}
        submitting={submitting}
        serverError={error}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
