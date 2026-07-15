// Mirrors public.slugify() in supabase/migrations/001_initial_schema.sql -
// used by scripts/generate-seed.mjs to pre-compute slugs for seed data.
// (The live app never generates slugs client-side; submit_listing() and
// update_my_listing() do that server-side using the SQL version of this
// same logic.)
export function slugify(input) {
  const base = String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return base || 'listing'
}

/** Returns a slug guaranteed not to collide with anything in `usedSlugs`, adding -2, -3, ... as needed. */
export function uniqueSlug(input, usedSlugs) {
  const base = slugify(input)
  let candidate = base
  let suffix = 1
  while (usedSlugs.has(candidate)) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }
  usedSlugs.add(candidate)
  return candidate
}
