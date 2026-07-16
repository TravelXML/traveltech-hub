/** Consistent field label across every submission form (Listing/News/Event),
 * with a red asterisk marking required fields. */
export default function FieldLabel({ required = false, children }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-700">
      {children}
      {required && (
        <span className="text-red-500 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  )
}
