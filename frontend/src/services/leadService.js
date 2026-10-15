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
    locationApproximate: Boolean(l.locationApproximate), // only the city / area was found, not the exact place
    rating: l.rating ?? 0,
    reviews: l.reviewCount ?? 0,
    score: l.score ?? 0,
    priority: PRIORITY_TO_UI[l.priority] || 'Low',
    status: STATUS_TO_UI[l.status] || 'New',
    lastContacted: timeAgo(l.updatedAt),
    updatedAt: l.updatedAt || null,
    createdAt: l.createdAt || null,
    dealValue: l.dealValue ?? null,                     // rupees, null = not set
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
    // Contacts & social (null = not checked yet, see enrichLead)
    emails: (l.email || '').split(',').map((s) => s.trim()).filter(Boolean),
    instagramUrl: l.instagramUrl || null,
    facebookUrl: l.facebookUrl || null,
    linkedinUrl: l.linkedinUrl || null,
    twitterUrl: l.twitterUrl || null,
    youtubeUrl: l.youtubeUrl || null,
    whatsappUrl: l.whatsappUrl || null,
    socialPresence: l.socialPresence || null,   // Strong / Weak / None
    enrichedAt: l.enrichedAt || null,
  }
}

export const getLeads = async () => (await request('/leads')).map(toUiLead)

export const getLead = async (id) => toUiLead(await request(`/leads/${id}`))

/** Saves a lead. `alreadySaved: true` = this business was already in My Leads (the existing lead is returned). */
export const createLead = async (data) => {
  const saved = await request('/leads', { method: 'POST', body: JSON.stringify(data) })
  return { ...toUiLead(saved), alreadySaved: Boolean(saved.alreadySaved) }
}

export const updateLeadStatus = async (id, uiStatus) =>
  toUiLead(await request(`/leads/${id}/status?status=${STATUS_TO_API[uiStatus] || uiStatus}`, { method: 'PUT' }))

export const updateLeadNotes = async (id, notes) =>
  toUiLead(await request(`/leads/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }))

/** PUT /api/leads/:id/deal-value — rupees (whole number), or null to clear it */
export const updateDealValue = async (id, dealValue) =>
  toUiLead(await request(`/leads/${id}/deal-value`, { method: 'PUT', body: JSON.stringify({ dealValue }) }))

export const deleteLead = (id) => request(`/leads/${id}`, { method: 'DELETE' })

export const getDashboardSummary = () => request('/dashboard/summary')

/**
 * POST /api/search -> { results, duplicatesRemoved }: scored businesses (not saved yet).
 * `area` (optional) narrows the search to part of the city; `limit` = max results.
 * Each result keeps the original backend object in `raw`, so "Add to My Leads"
 * can send it straight to POST /api/leads, plus `scoreBreakdown` for "Why this score?".
 */
export const searchBusinesses = async (city, category, { area = '', limit } = {}) => {
  const res = await request('/search', { method: 'POST', body: JSON.stringify({ city, category, area, limit }) })
  return {
    results: (res.results || []).map((l, i) => ({ ...toUiLead(l), id: `result-${i}`, raw: l, scoreBreakdown: l.scoreBreakdown || [] })),
    duplicatesRemoved: res.duplicatesRemoved || 0,
  }
}

/**
 * "Find businesses here" (Opportunity Map): businesses of a type within `radius` metres of a map point.
 * Same answer shape as searchBusinesses.
 */
export const searchNearby = async (lat, lon, category, { radius = 1500, limit = 50 } = {}) => {
  const res = await request('/search', { method: 'POST', body: JSON.stringify({ category, lat, lon, radius, limit }) })
  return {
    results: (res.results || []).map((l, i) => ({ ...toUiLead(l), id: `nearby-${i}`, raw: l })),
    duplicatesRemoved: res.duplicatesRemoved || 0,
  }
}

// ---------- Contacts & social (lead enrichment) ----------

/**
 * POST /api/leads/:id/enrich -> reads the lead's own website for emails, social links and WhatsApp.
 * { emails[], instagramUrl, facebookUrl, linkedinUrl, twitterUrl, youtubeUrl, whatsappUrl,
 *   socialCount, socialPresence, bestChannel, bestChannelReason, lead }
 */
export const enrichLead = async (id) => {
  const res = await request(`/leads/${id}/enrich`, { method: 'POST' })
  return { ...res, lead: toUiLead(res.lead) }
}

// ---------- Write Message (AI / template) ----------

/**
 * POST /api/leads/:id/message
 * options: { service, channel: email|whatsapp|linkedin, tone: Friendly|Professional|Short, language: English|Hindi|Hinglish, versions: 1|2 }
 * -> { source: "AI" | "Template", note, messages: [{ subject, body }], message, used: { businessName, category, city, gaps[] } }
 */
export const generateMessage = (id, options) =>
  request(`/leads/${id}/message`, { method: 'POST', body: JSON.stringify(options) })

/** POST /api/leads/:id/message/sequence -> { source, note, steps: [{ day, label, subject, body }], used } */
export const generateSequence = (id, options) =>
  request(`/leads/${id}/message/sequence`, { method: 'POST', body: JSON.stringify(options) })

// ---------- Insights AI summary ----------

/** POST /api/insights/summary with aggregated counts only (no personal data) -> { summary, recommendations[] } */
export const getInsightSummary = (counts) =>
  request('/insights/summary', { method: 'POST', body: JSON.stringify(counts) })

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