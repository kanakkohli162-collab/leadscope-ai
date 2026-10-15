/** Find Leads helpers: client-side filter / sort of search results, and phone -> WhatsApp number. */

export const DEFAULT_FILTERS = { priority: '', website: 'any', phone: 'any', minScore: 0 }
export const SORTS = [
  { value: 'score', label: 'Score (highest first)' },
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'gaps', label: 'Most gaps' },
]

/** Applies the filters + sort to the current search results (all in the browser, no new search). */
export function applyFilters(results, filters, sort) {
  const list = results.filter((r) =>
    (!filters.priority || r.priority === filters.priority) &&
    (filters.website === 'any' || (filters.website === 'yes' ? r.hasWebsite : !r.hasWebsite)) &&
    (filters.phone === 'any' || (filters.phone === 'yes' ? Boolean(r.raw?.phone) : !r.raw?.phone)) &&
    r.score >= filters.minScore)
  if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name))
  if (sort === 'gaps') return [...list].sort((a, b) => b.serviceGaps.length - a.serviceGaps.length || b.score - a.score)
  return [...list].sort((a, b) => b.score - a.score)
}

/** Phone text -> digits in international format for wa.me (Indian numbers get 91 in front). */
export function toWhatsAppNumber(phone) {
  if (!phone) return null
  const first = phone.split(/[;,/]/)[0]          // OpenStreetMap sometimes lists several numbers
  let digits = first.replace(/\D/g, '')
  if (first.trim().startsWith('+')) return digits.length >= 8 ? digits : null
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`
  else if (digits.length === 10) digits = `91${digits}`
  return digits.length >= 8 ? digits : null
}
