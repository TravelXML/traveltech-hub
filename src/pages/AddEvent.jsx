import AddEventForm from '../components/AddEventForm.jsx'

export default function AddEvent() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Submit a Travel Event</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          List a travel industry event for the community. Submissions are reviewed before going live.
        </p>
      </div>
      <AddEventForm />
    </div>
  )
}
