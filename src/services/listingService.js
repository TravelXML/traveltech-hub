// Single data-access layer for all listing data.
//
// Today this reads from static JSON bundled at build time. When a real
// backend exists, only the bodies of these functions need to change to
// `fetch('/api/...')` calls - every component in the app goes through this
// module, so no component code should need to change.

import { CATEGORIES, getCategoryById } from '../config/categories.js'

// Eagerly import every category JSON file so bundling stays static (works
// on GitHub Pages with no server). Keyed by dataFile name from categories.js.
const dataModules = import.meta.glob('../data/*.json', { eager: true })

function loadCategoryData(dataFile) {
  const match = Object.entries(dataModules).find(([path]) =>
    path.endsWith(`/${dataFile}.json`)
  )
  return match ? match[1].default ?? match[1] : { listings: [] }
}

/**
 * Returns the full category registry, each enriched with its live listing count.
 * Future API shape: GET /api/categories
 */
export async function getCategories() {
  return CATEGORIES.map((category) => {
    const data = loadCategoryData(category.dataFile)
    return { ...category, listingCount: data.listings?.length ?? 0 }
  })
}

/**
 * Returns all listings for a single category.
 * Future API shape: GET /api/categories/:id/listings
 */
export async function getListings(categoryId) {
  const category = getCategoryById(categoryId)
  if (!category) return []
  const data = loadCategoryData(category.dataFile)
  return data.listings ?? []
}

/**
 * Searches across every category by name, description and products.
 * Future API shape: GET /api/search?q=...
 */
export async function searchAll(query) {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const results = []
  for (const category of CATEGORIES) {
    const data = loadCategoryData(category.dataFile)
    for (const listing of data.listings ?? []) {
      const haystack = [
        listing.name,
        listing.description,
        ...(listing.products ?? []),
      ]
        .join(' ')
        .toLowerCase()

      if (haystack.includes(q)) {
        results.push({ ...listing, category })
      }
    }
  }
  return results
}

/**
 * Submits a new business listing for review.
 * Future API shape: POST /api/listings
 */
export async function submitListing(payload) {
  // TODO: replace with `await fetch('/api/listings', { method: 'POST', body: JSON.stringify(payload) })`
  console.log('New listing submission (would POST to /api/listings):', payload)
  return { success: true, id: `pending-${Date.now()}` }
}
