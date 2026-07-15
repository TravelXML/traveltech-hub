import { describe, it, expect } from 'vitest'
import { slugify, uniqueSlug } from './slug.js'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Oracle OPERA Cloud')).toBe('oracle-opera-cloud')
  })

  it('strips punctuation and collapses repeated separators', () => {
    expect(slugify("Bob's Booking & Co.!!")).toBe('bob-s-booking-co')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugify('  --Leading and trailing--  ')).toBe('leading-and-trailing')
  })

  it('falls back to "listing" for input with no alphanumeric characters', () => {
    expect(slugify('!!!')).toBe('listing')
    expect(slugify('')).toBe('listing')
    expect(slugify(null)).toBe('listing')
  })
})

describe('uniqueSlug', () => {
  it('returns the plain slug when there is no collision', () => {
    const used = new Set()
    expect(uniqueSlug('Cloudbeds', used)).toBe('cloudbeds')
  })

  it('appends -2, -3, ... on collision, matching the SQL slugify() suffix loop', () => {
    const used = new Set(['cloudbeds', 'cloudbeds-2'])
    expect(uniqueSlug('Cloudbeds', used)).toBe('cloudbeds-3')
  })

  it('registers the returned slug so subsequent calls do not collide', () => {
    const used = new Set()
    const first = uniqueSlug('Mews', used)
    const second = uniqueSlug('Mews', used)
    expect(first).not.toBe(second)
    expect(used.has(first)).toBe(true)
    expect(used.has(second)).toBe(true)
  })
})
