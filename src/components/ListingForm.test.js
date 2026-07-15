import { describe, it, expect } from 'vitest'
import { validateListingForm, EMPTY_LISTING_FORM } from './ListingForm.jsx'

function validForm(overrides = {}) {
  return {
    ...EMPTY_LISTING_FORM,
    name: 'Test Vendor',
    categoryId: 'pms',
    description: 'A sufficiently long description for validation purposes.',
    features: ['Feature A'],
    products: ['Product A'],
    targetMarkets: ['Global'],
    pricingModel: 'Subscription',
    priceRange: '$$',
    website: 'https://example.com',
    headquarters: 'City, Country',
    founded: '2020',
    ...overrides,
  }
}

describe('validateListingForm', () => {
  it('returns no errors for a fully valid form', () => {
    expect(validateListingForm(validForm())).toEqual({})
  })

  it('requires a business name', () => {
    expect(validateListingForm(validForm({ name: '' }))).toHaveProperty('name')
  })

  it('requires a category', () => {
    expect(validateListingForm(validForm({ categoryId: '' }))).toHaveProperty('categoryId')
  })

  it('requires a description of at least 20 characters', () => {
    expect(validateListingForm(validForm({ description: 'too short' }))).toHaveProperty('description')
  })

  it('requires at least one feature', () => {
    expect(validateListingForm(validForm({ features: [] }))).toHaveProperty('features')
  })

  it('does not require USPs (optional field)', () => {
    expect(validateListingForm(validForm({ usps: [] }))).not.toHaveProperty('usps')
  })

  it('requires at least one product', () => {
    expect(validateListingForm(validForm({ products: [] }))).toHaveProperty('products')
  })

  it('requires at least one target market', () => {
    expect(validateListingForm(validForm({ targetMarkets: [] }))).toHaveProperty('targetMarkets')
  })

  it('accepts a form with no email/phone (both optional)', () => {
    expect(validateListingForm(validForm({ email: '', phone: '' }))).toEqual({})
  })

  it('rejects an invalid email when one is provided', () => {
    expect(validateListingForm(validForm({ email: 'not-an-email' }))).toHaveProperty('email')
  })

  it('rejects an invalid phone when one is provided', () => {
    expect(validateListingForm(validForm({ phone: 'abc' }))).toHaveProperty('phone')
  })

  it('requires a website starting with http:// or https://', () => {
    expect(validateListingForm(validForm({ website: 'example.com' }))).toHaveProperty('website')
  })

  it('rejects a founding year in the future', () => {
    const nextYear = String(new Date().getFullYear() + 1)
    expect(validateListingForm(validForm({ founded: nextYear }))).toHaveProperty('founded')
  })

  it('rejects a founding year before 1800', () => {
    expect(validateListingForm(validForm({ founded: '1500' }))).toHaveProperty('founded')
  })

  it('rejects a business name over 200 characters', () => {
    expect(validateListingForm(validForm({ name: 'a'.repeat(201) }))).toHaveProperty('name')
  })
})
