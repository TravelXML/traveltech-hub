import AddJobForm from '../components/AddJobForm.jsx'

export default function AddJob() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Post a Job</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Hiring for your travel tech company? Post a role for job seekers to find. Submissions are reviewed
          before going live.
        </p>
      </div>
      <AddJobForm />
    </div>
  )
}
