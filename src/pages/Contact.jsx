import ContactForm from '../components/ContactForm.jsx'
import SeoHead from '../components/SeoHead.jsx'

export default function Contact() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <SeoHead
        title="Contact Us | TravelPin"
        description="Have feedback or a question for TravelPin? Send us a message and we'll get back to you."
        path="/contact"
      />
      <div className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">Contact Us</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Have feedback, a question, or found something that needs fixing? Send us a message and we&apos;ll get
          back to you.
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
