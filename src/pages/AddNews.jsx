import AddNewsForm from '../components/AddNewsForm.jsx'
import SeoHead from '../components/SeoHead.jsx'

export default function AddNews() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SeoHead
        title="Submit Travel News | TravelPin"
        description="Share a travel technology news item with the community. Submissions are reviewed before going live."
        path="/add-news"
      />
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Submit Travel News</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Share a travel technology news item with the community. Submissions are reviewed before going live.
        </p>
      </div>
      <AddNewsForm />
    </div>
  )
}
