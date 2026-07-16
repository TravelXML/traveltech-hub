import AddBusinessForm from '../components/AddBusinessForm.jsx'
import SeoHead from '../components/SeoHead.jsx'

export default function AddBusiness() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SeoHead
        title="List Your Travel Business | TravelPin"
        description="Get your travel technology business in front of agencies, hoteliers and OTAs searching for exactly what you offer. Free to list."
        path="/add-business"
      />
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
          List Your Travel Business
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Get in front of agencies, hoteliers and OTAs searching for exactly what you offer.
        </p>
      </div>
      <AddBusinessForm />
    </div>
  )
}
