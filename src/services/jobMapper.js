// Maps Supabase's snake_case jobs/job_applications rows into the camelCase
// shape the UI expects - same rationale as listingMapper.js/contentMapper.js.
// Jobs are their own domain (recruiting, not editorial content), hence a
// separate file from contentMapper.js.

export function mapJobRow(row) {
  const { listings, ...job } = row
  return {
    id: job.id,
    ownerId: job.owner_id,
    listingId: job.listing_id,
    title: job.title,
    category: job.category,
    description: job.description,
    employmentType: job.employment_type,
    experienceLevel: job.experience_level,
    location: job.location,
    remote: job.remote,
    salaryRange: job.salary_range,
    closesAt: job.closes_at,
    status: job.status,
    rejectionReason: job.rejection_reason,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    submittedAt: job.submitted_at,
    approvedAt: job.approved_at,
    listing: listings
      ? {
          id: listings.id,
          name: listings.name,
          slug: listings.slug,
          logoUrl: listings.logo_url,
          logoInitials: listings.logo_initials,
        }
      : null,
  }
}

export function mapApplicationRow(row) {
  const { jobs, ...application } = row
  return {
    id: application.id,
    jobId: application.job_id,
    applicantId: application.applicant_id,
    fullName: application.full_name,
    email: application.email,
    phone: application.phone,
    coverNote: application.cover_note,
    resumePath: application.resume_path,
    status: application.status,
    createdAt: application.created_at,
    updatedAt: application.updated_at,
    job: jobs
      ? {
          id: jobs.id,
          title: jobs.title,
          listing: jobs.listings
            ? { id: jobs.listings.id, name: jobs.listings.name, slug: jobs.listings.slug }
            : null,
        }
      : null,
  }
}

export const JOB_SELECT = `
  id, owner_id, listing_id, title, category, description, employment_type, experience_level,
  location, remote, salary_range, closes_at, status, rejection_reason,
  created_at, updated_at, submitted_at, approved_at, approved_by
`

export const APPLICATION_SELECT = `
  id, job_id, applicant_id, full_name, email, phone, cover_note, resume_path, status,
  created_at, updated_at
`
