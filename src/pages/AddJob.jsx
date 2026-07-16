import AddJobForm from '../components/AddJobForm.jsx'
import SeoHead from '../components/SeoHead.jsx'

export default function AddJob() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SeoHead
        title="Post a Travel Tech Job | TravelPin"
        description="Hiring for your travel tech company? Post a role for job seekers to find. Submissions are reviewed before going live."
        path="/add-job"
      />
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
