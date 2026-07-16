import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getMyNewsById, updateMyNews } from '../services/newsService.js'
import NewsForm from '../components/NewsForm.jsx'

export default function EditNews() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    getMyNewsById(id)
      .then((n) => {
        if (!active) return
        if (!n) setNotFound(true)
        else setItem(n)
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

  async function handleSubmit(payload) {
    setError('')
    setSubmitting(true)
    try {
      await updateMyNews(id, payload)
      navigate('/dashboard/news')
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
        <h1 className="font-display text-xl font-bold text-slate-900">News item not found</h1>
        <p className="mt-2 text-slate-600">This item doesn&apos;t exist or isn&apos;t yours.</p>
        <Link to="/dashboard/news" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my news
        </Link>
      </div>
    )
  }

  if (item.status === 'approved' || item.status === 'archived') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-xl font-bold text-slate-900">This item can&apos;t be edited</h1>
        <p className="mt-2 text-slate-600">Approved and archived news items can&apos;t be changed here.</p>
        <Link to="/dashboard/news" className="mt-6 inline-block font-medium text-brand-600 hover:text-brand-700">
          Back to my news
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Edit news</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          {item.status === 'rejected'
            ? 'Update your submission, then resubmit it for review from the dashboard.'
            : 'Changes are saved immediately.'}
        </p>
      </div>
      <NewsForm
        initialValues={item}
        submitting={submitting}
        serverError={error}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
