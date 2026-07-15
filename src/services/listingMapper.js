// Maps Supabase's snake_case listing rows (+ joined child tables) into the
// camelCase shape the existing UI already expects (ListingCard.jsx,
// useListingFilters.js, CategoryPage.jsx, ...) so those components didn't
// need to change when the data source did.

function sortedValues(rows) {
  return (rows ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((r) => r.value)
}

/**
 * @param {object} row - a row from `listings`, with `listing_features`,
 *   `listing_usps`, `listing_products` and `listing_target_markets`
 *   selected as nested arrays.
 * @param {object} [options]
 * @param {boolean} [options.redactContact=true] - when true (the default,
 *   used for every public-facing query), email/phone are nulled out unless
 *   contact_verified is true. Owner/admin views pass false so an owner can
 *   always see and edit the contact details they submitted.
 */
export function mapListingRow(row, { redactContact = true } = {}) {
  const showContact = row.contact_verified === true || !redactContact
  return {
    id: row.id,
    legacyId: row.legacy_id,
    ownerId: row.owner_id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    logoInitials: row.logo_initials,
    logoUrl: row.logo_url,
    description: row.description,
    features: sortedValues(row.listing_features),
    usps: sortedValues(row.listing_usps),
    products: sortedValues(row.listing_products),
    targetMarkets: (row.listing_target_markets ?? []).map((r) => r.value),
    pricingModel: row.pricing_model,
    priceRange: row.price_range,
    email: showContact ? row.email : null,
    phone: showContact ? row.phone : null,
    website: row.website,
    headquarters: row.headquarters,
    founded: row.founded,
    status: row.status,
    featured: row.featured,
    verified: row.verified,
    contactVerified: row.contact_verified,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
  }
}

export function mapCategoryRow(row, listingCount = 0) {
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    route: row.route,
    dataFile: row.id,
    description: row.description,
    color: row.color,
    icon: row.icon,
    listingCount,
  }
}

// The `listings` table select fragment reused by every query that needs
// full child-table data (public listing/detail views, owner and admin
// views). Keeping it here means every caller stays in sync automatically.
export const LISTING_SELECT = `
  id, legacy_id, owner_id, category_id, name, slug, logo_initials, logo_url, description,
  pricing_model, price_range, email, phone, website, headquarters, founded,
  status, featured, verified, contact_verified, rejection_reason,
  created_at, updated_at, submitted_at, approved_at, approved_by,
  listing_features(value, display_order),
  listing_usps(value, display_order),
  listing_products(value, display_order),
  listing_target_markets(value)
`
