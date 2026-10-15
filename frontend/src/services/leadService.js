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
 * Each result keeps the original backend object in `raw`, so "Add to My Leads"
 * can send it straight to POST /api/leads.
 */
export const searchBusinesses = async (city, category) =>
  (await request('/search', { method: 'POST', body: JSON.stringify({ city, category }) }))
    .map((l, i) => ({ ...toUiLead(l), id: `result-${i}`, raw: l }))

// ---------- Write Message (AI / template) ----------

/** POST /api/leads/:id/message -> { message, source: "AI" | "Template" } */
export const generateMessage = (id, service, channel) =>
  request(`/leads/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ service, channel }),
  })

// ---------- Review Sentiment (NLP) ----------

/** POST /api/ai/sentiment -> { positive, neutral, negative, total, score, overall, concerns[], summary } */
export const analyzeSentiment = (reviews) =>
  request('/ai/sentiment', {
    method: 'POST',
    body: JSON.stringify({ reviews }),
  })

// ---------- Website Checker ----------

/**
 * POST /api/tools/website-check -> { reachable, statusCode, finalUrl, https, loadTimeMs, mobileFriendly,
 * title, hasMetaDescription, copyrightYear, outdated, score, issues[], suggestion }
 */
export const checkWebsite = (url) =>
  request('/tools/website-check', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })