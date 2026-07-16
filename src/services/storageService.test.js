import { describe, it, expect } from 'vitest'
import { validateLogoFile, MAX_LOGO_SIZE_BYTES, validateResumeFile, MAX_RESUME_SIZE_BYTES } from './storageService.js'

function makeFile({ name = 'logo.png', type = 'image/png', size = 1024 } = {}) {
  const file = new File([new Uint8Array(size)], name, { type })
  return file
}

describe('validateLogoFile', () => {
  it('rejects a missing file', () => {
    expect(validateLogoFile(null)).toMatch(/choose a file/i)
  })

  it('accepts a valid PNG under the size limit', () => {
    expect(validateLogoFile(makeFile({ type: 'image/png', name: 'logo.png' }))).toBeNull()
  })

  it('accepts PNG, JPEG, WebP and SVG', () => {
    expect(validateLogoFile(makeFile({ type: 'image/jpeg', name: 'logo.jpg' }))).toBeNull()
    expect(validateLogoFile(makeFile({ type: 'image/webp', name: 'logo.webp' }))).toBeNull()
    expect(validateLogoFile(makeFile({ type: 'image/svg+xml', name: 'logo.svg' }))).toBeNull()
  })

  it('rejects disallowed MIME types', () => {
    expect(validateLogoFile(makeFile({ type: 'application/pdf', name: 'logo.pdf' }))).toMatch(/PNG, JPEG, WebP or SVG/)
  })

  it('rejects a MIME/extension mismatch', () => {
    // A file claiming to be a PNG but named .exe should be rejected on extension.
    expect(validateLogoFile(makeFile({ type: 'image/png', name: 'logo.exe' }))).toMatch(/extension/i)
  })

  it('rejects files over the 2 MB limit', () => {
    const oversized = makeFile({ size: MAX_LOGO_SIZE_BYTES + 1 })
    expect(validateLogoFile(oversized)).toMatch(/2 MB/)
  })

  it('accepts a file exactly at the size limit', () => {
    const exact = makeFile({ size: MAX_LOGO_SIZE_BYTES })
    expect(validateLogoFile(exact)).toBeNull()
  })
})

describe('validateResumeFile', () => {
  it('rejects a missing file', () => {
    expect(validateResumeFile(null)).toMatch(/choose a file/i)
  })

  it('accepts a valid PDF under the size limit', () => {
    expect(validateResumeFile(makeFile({ type: 'application/pdf', name: 'resume.pdf' }))).toBeNull()
  })

  it('accepts DOC and DOCX', () => {
    expect(validateResumeFile(makeFile({ type: 'application/msword', name: 'resume.doc' }))).toBeNull()
    expect(
      validateResumeFile(
        makeFile({
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          name: 'resume.docx',
        })
      )
    ).toBeNull()
  })

  it('rejects disallowed MIME types', () => {
    expect(validateResumeFile(makeFile({ type: 'image/png', name: 'resume.png' }))).toMatch(/PDF, DOC or DOCX/)
  })

  it('rejects a MIME/extension mismatch', () => {
    expect(validateResumeFile(makeFile({ type: 'application/pdf', name: 'resume.exe' }))).toMatch(/extension/i)
  })

  it('rejects files over the 5 MB limit', () => {
    const oversized = makeFile({ type: 'application/pdf', name: 'resume.pdf', size: MAX_RESUME_SIZE_BYTES + 1 })
    expect(validateResumeFile(oversized)).toMatch(/5 MB/)
  })

  it('accepts a file exactly at the size limit', () => {
    const exact = makeFile({ type: 'application/pdf', name: 'resume.pdf', size: MAX_RESUME_SIZE_BYTES })
    expect(validateResumeFile(exact)).toBeNull()
  })
})
