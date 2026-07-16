// Maps Supabase's snake_case news/events rows into the camelCase shape the
// existing UI already expects (NewsCard.jsx, EventCard.jsx, NewsPage.jsx,
// EventsPage.jsx) - same rationale as listingMapper.js.

export function mapNewsRow(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id,
    ownerId: row.owner_id,
    title: row.title,
    summary: row.summary,
    source: row.source,
    sourceUrl: row.source_url,
    category: row.category,
    tags: row.tags ?? [],
    publishedDate: row.published_date,
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
  }
}

export function mapEventRow(row) {
  return {
    id: row.id,
    legacyId: row.legacy_id,
    ownerId: row.owner_id,
    name: row.name,
    host: row.host,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    city: row.city,
    country: row.country,
    venue: row.venue,
    format: row.format,
    audience: row.audience,
    website: row.website,
    status: row.status,
    rejectionReason: row.rejection_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
  }
}

export const NEWS_SELECT = `
  id, legacy_id, owner_id, title, summary, source, source_url, category, tags, published_date,
  status, rejection_reason, created_at, updated_at, submitted_at, approved_at, approved_by
`

export const EVENTS_SELECT = `
  id, legacy_id, owner_id, name, host, description, start_date, end_date, city, country, venue, format,
  audience, website, status, rejection_reason, created_at, updated_at, submitted_at, approved_at, approved_by
`
