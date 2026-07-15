import { describe, it, expect } from 'vitest'
import { mapListingRow, mapCategoryRow } from './listingMapper.js'

function baseRow(overrides = {}) {
  return {
    id: 'listing-1',
    legacy_id: 'legacy-1',
    owner_id: null,
    category_id: 'pms',
    name: 'Cloudbeds',
    slug: 'cloudbeds',
    logo_initials: 'CB',
    logo_url: null,
    description: 'A cloud PMS.',
    pricing_model: 'Subscription',
    price_range: '$$',
    email: 'sales@cloudbeds.com',
    phone: '+1-555-0100',
    website: 'https://www.cloudbeds.com',
    headquarters: 'San Diego, USA',
    founded: 2012,
    status: 'approved',
    featured: false,
    verified: false,
    contact_verified: false,
    rejection_reason: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    submitted_at: '2024-01-01T00:00:00Z',
    approved_at: '2024-01-02T00:00:00Z',
    listing_features: [
      { value: 'B', display_order: 1 },
      { value: 'A', display_order: 0 },
    ],
    listing_usps: [],
    listing_products: [],
    listing_target_markets: [{ value: 'Global' }],
    ...overrides,
  }
}

describe('mapListingRow - contact visibility rule', () => {
  it('nulls out email/phone by default when contact is not verified (public queries)', () => {
    const mapped = mapListingRow(baseRow({ contact_verified: false }))
    expect(mapped.email).toBeNull()
    expect(mapped.phone).toBeNull()
  })

  it('shows email/phone when contact_verified is true', () => {
    const mapped = mapListingRow(baseRow({ contact_verified: true }))
    expect(mapped.email).toBe('sales@cloudbeds.com')
    expect(mapped.phone).toBe('+1-555-0100')
  })

  it('shows email/phone regardless of verification when redactContact is false (owner/admin views)', () => {
    const mapped = mapListingRow(baseRow({ contact_verified: false }), { redactContact: false })
    expect(mapped.email).toBe('sales@cloudbeds.com')
    expect(mapped.phone).toBe('+1-555-0100')
  })
})

describe('mapListingRow - field mapping', () => {
  it('maps snake_case columns to the existing camelCase UI shape', () => {
    const mapped = mapListingRow(baseRow())
    expect(mapped).toMatchObject({
      id: 'listing-1',
      legacyId: 'legacy-1',
      logoInitials: 'CB',
      pricingModel: 'Subscription',
      priceRange: '$$',
      contactVerified: false,
    })
  })

  it('sorts child rows by display_order and flattens to a plain string array', () => {
    const mapped = mapListingRow(baseRow())
    expect(mapped.features).toEqual(['A', 'B'])
  })

  it('flattens target markets without needing a display_order', () => {
    const mapped = mapListingRow(baseRow())
    expect(mapped.targetMarkets).toEqual(['Global'])
  })
})

describe('mapCategoryRow', () => {
  it('maps snake_case category fields and applies the given listing count', () => {
    const mapped = mapCategoryRow(
      { id: 'pms', name: 'Property Management Systems', short_name: 'PMS', route: '/pms', description: 'd', color: 'indigo', icon: 'Building2' },
      18
    )
    expect(mapped).toEqual({
      id: 'pms',
      name: 'Property Management Systems',
      shortName: 'PMS',
      route: '/pms',
      dataFile: 'pms',
      description: 'd',
      color: 'indigo',
      icon: 'Building2',
      listingCount: 18,
    })
  })
})
