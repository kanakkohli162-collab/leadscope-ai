import { request } from './apiClient'

/**
 * Talks to the Spring Boot LeadController and DashboardController.
 * The backend uses businessName/city/NEW/HIGH; the pages use name/location/New/High,
 * so toUiLead() translates every lead once, here. Pages don't need to know.
 */

const STATUS_TO_UI = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  FOLLOW_UP: 'Follow-up',
  INTERESTED: 'Interested',
  WON: 'Converted',
  NOT_INTERESTED: 'Not Interested',
}
const STATUS_TO_API = Object.fromEntries(Object.entries(STATUS_TO_UI).map(([api, ui]) => [ui, api]))
const PRIORITY_TO_UI = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' }

function timeAgo(isoDate) {
  if (!isoDate) return '—'
  const minutes = Math.floor((Date.now() - new Date(isoDate).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hrs ago`
  return `${Math.floor(hours / 24)} days ago`
}

export function toUiLead(l) {
  const name = l.businessName || 'Unnamed business'
  const gaps = (l.opportunities || '').split(',').map((s) => s.trim()).filter(Boolean)
  return {
    id: l.id,
    name,
    category: l.category || '',
    location: l.city || '',
    address: l.address || '—',
    phone: l.phone || '—',
    website: l.website || null,
    hasWebsite: Boolean(l.website),
    latitude: l.latitude ?? null,
    longitude: l.longitude ?? null,
    rating: l.rating ?? 0,
    reviews: l.reviewCount ?? 0,
    score: l.score ?? 0,
    priority: PRIORITY_TO_UI[l.priority] || 'Low',
    status: STATUS_TO_UI[l.status] || 'New',
    lastContacted: timeAgo(l.updatedAt),
    image: `https://placehold.co/400x300?text=${encodeURIComponent(name)}`,
    hours: 'Not available',
    serviceGaps: gaps,
    serviceGapDetected: gaps.length > 0,
    websiteAnalysis: l.website ? 'Has website' : 'No Website',
    listingCompleteness: 'Not checked yet',
    reviewSentiment: 'Not analysed yet',
    aiReason: gaps.length ? `Opportunities found: ${gaps.join(', ')}.` : 'No major gaps detected yet.',
    recommendedAction: gaps.length ? 'Offer services that fix the gaps above.' : 'Monitor this lead.',
    notes: l.notes || '',
    source: l.source || 'Google',
    sentimentLabel: l.sentimentLabel || null,      // Positive / Neutral / Negative, null = not analysed
    sentimentScore: l.sentimentScore ?? null,
    websiteHealthScore: l.websiteHealthScore ?? null, // null = website not checked
    websiteOutdated: l.websiteOutdated ?? null,
  }
}

export const getLeads = async () => (await request('/leads')).map(toUiLead)

export const getLead = async (id) => toUiLead(await request(`/leads/${id}`))

export const createLead = async (data) =>
  toUiLead(await request('/leads', { method: 'POST', body: JSON.stringify(data) }))

export const updateLeadStatus = async (id, uiStatus) =>
  toUiLead(await request(`/leads/${id}/status?status=${STATUS_TO_API[uiStatus] || uiStatus}`, { method: 'PUT' }))

export const updateLeadNotes = async (id, notes) =>
  toUiLead(await request(`/leads/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }))

export const deleteLead = (id) => request(`/leads/${id}`, { method: 'DELETE' })

export const getDashboardSummary = () => request('/dashboard/summary')

/**
 * POST /api/search -> scored businesses (not saved yet).
 * `area` (optional) narrows the search to part of the city; `limit` = max results.
 * Each result keeps the original backend object in `raw`, so "Add to My Leads"
 * can send it straight to POST /api/leads, plus `scoreBreakdown` for "Why this score?".
 */
export const searchBusinesses = async (city, category, { area = '', limit } = {}) =>
  (await request('/search', { method: 'POST', body: JSON.stringify({ city, category, area, limit }) }))
    .map((l, i) => ({ ...toUiLead(l), id: `result-${i}`, raw: l, scoreBreakdown: l.scoreBreakdown || [] }))

// ---------- Write Message (AI / template) ----------

/** POST /api/leads/:id/message -> { message, source: "AI" | "Template" } */
export const generateMessage = (id, service, channel) =>
  request(`/leads/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ service, channel }),
  })

// ---------- Review Sentiment (NLP) ----------

/**
 * POST /api/ai/sentiment -> { positive, neutral, negative, total, score, overall, concerns[], summary }
 * With a leadId, the backend also saves the result on that lead (used by Insights).
 */
export const analyzeSentiment = (reviews, leadId) =>
  request('/ai/sentiment', {
    method: 'POST',
    body: JSON.stringify({ reviews, leadId }),
  })

// ---------- Nearby Competitor Check ----------

/**
 * GET /api/leads/:id/competitors -> { totalNearby, withWebsite, withoutWebsite, withPhone, percentWithWebsite,
 * leadHasWebsite, radiusMeters, nearby[{ name, distanceMeters, hasWebsite }], insight }
 */
export const getCompetitors = (leadId) => request(`/leads/${leadId}/competitors`)

// ---------- Website Checker ----------

/**
 * POST /api/tools/website-check -> { reachable, statusCode, finalUrl, https, loadTimeMs, mobileFriendly,
 * title, hasMetaDescription, copyrightYear, outdated, score, issues[], suggestion }
 * With a leadId, the backend also saves the health score + "outdated" on that lead (used by Insights).
 */
export const checkWebsite = (url, leadId) =>
  request('/tools/website-check', {
    method: 'POST',
    body: JSON.stringify({ url, leadId }),
  })