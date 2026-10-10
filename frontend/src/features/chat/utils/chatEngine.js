/**
 * The chatbot's "brain" — keyword matching over the mock leads.
 *
 * Kept separate from any React component so that when you connect a real
 * AI backend you only replace `getAIResponse` (e.g. with a fetch call)
 * and the UI stays untouched.
 */
import { leads } from '@/mocks'

const MAX_LIST = 10 // never dump 50 lines into a chat bubble

const CATEGORY_KEYWORDS = {
  gynecolog: 'Gynecologist',
  cardiolog: 'Cardiologist',
  dental: 'Dental Clinic',
  dentist: 'Dental Clinic',
  hospital: 'Hospital',
  pharmac: 'Pharmacy',
  lab: 'Diagnostic Lab',
  diagnostic: 'Diagnostic Lab',
}
const LOCATIONS = [...new Set(leads.map((l) => l.location))]

const line = (l) => `• ${l.name} (${l.location}) – Score: ${l.score}`

function formatList(items, render = line) {
  const shown = items.slice(0, MAX_LIST).map(render).join('\n')
  const more = items.length > MAX_LIST ? `\n…and ${items.length - MAX_LIST} more` : ''
  return shown + more
}

/** Pull optional location / category filters out of the question. */
function extractFilters(q) {
  const location = LOCATIONS.find((loc) => q.includes(loc.toLowerCase()))
  const categoryKey = Object.keys(CATEGORY_KEYWORDS).find((k) => q.includes(k))
  return { location, category: categoryKey && CATEGORY_KEYWORDS[categoryKey] }
}

function applyFilters(list, { location, category }) {
  return list.filter(
    (l) => (!location || l.location === location) && (!category || l.category === category),
  )
}

/** "2 gynecologist leads in Noida", "1 lead", "29 leads" … reads naturally for any filter combo */
function leadsPhrase(count, { location, category }, adjective = '') {
  const words = [count]
  if (adjective) words.push(adjective)
  if (category) words.push(category.toLowerCase())
  words.push(count === 1 ? 'lead' : 'leads')
  if (location) words.push(`in ${location}`)
  return words.join(' ')
}

export function getAIResponse(query) {
  const q = query.toLowerCase()
  const filters = extractFilters(q)
  const scoped = applyFilters(leads, filters)
  const byScore = (a, b) => b.score - a.score

  if (q.includes('high-priority') || q.includes('high priority')) {
    const high = scoped.filter((l) => l.priority === 'High').sort(byScore)
    if (!high.length) return `I couldn't find any ${leadsPhrase(0, filters, 'high-priority').slice(2)}.`
    return `I found ${leadsPhrase(high.length, filters, 'high-priority')}:\n\n${formatList(high)}`
  }

  if (q.includes('website')) {
    const noWeb = scoped.filter((l) => !l.hasWebsite).sort(byScore)
    return `Found ${leadsPhrase(noWeb.length, filters)} without a website:\n\n${formatList(noWeb)}`
  }

  const topMatch = q.match(/top\s*(\d+)/)
  if (topMatch || q.includes('top leads') || q.includes('best leads')) {
    const n = Math.min(Number(topMatch?.[1]) || 10, MAX_LIST)
    const top = [...scoped].sort(byScore).slice(0, n)
    return `Here are your top ${leadsPhrase(top.length, filters)} by score:\n\n${top
      .map((l, i) => `${i + 1}. ${l.name} – Score: ${l.score} (${l.priority})`)
      .join('\n')}`
  }

  if (q.includes('contacted')) {
    const thisWeek = scoped
      .filter((l) => l.status !== 'New' && l.lastContactedDays <= 7)
      .sort((a, b) => a.lastContactedDays - b.lastContactedDays)
    return `This week you contacted ${leadsPhrase(thisWeek.length, filters)}:\n\n${formatList(
      thisWeek,
      (l) => `• ${l.name} – ${l.status}, ${l.lastContacted}`,
    )}`
  }

  if (q.includes('poor review') || q.includes('bad review') || q.includes('low rating')) {
    const poor = scoped.filter((l) => l.rating < 4).sort((a, b) => a.rating - b.rating)
    return `${leadsPhrase(poor.length, filters)} with ratings below 4★:\n\n${formatList(
      poor,
      (l) => `• ${l.name} – ${l.rating}★ (${l.reviews} reviews)`,
    )}\n\nThese may benefit from review management services.`
  }

  if (filters.location || filters.category) {
    return `You have ${leadsPhrase(scoped.length, filters)}:\n\n${formatList([...scoped].sort(byScore))}`
  }

  const highCount = leads.filter((l) => l.priority === 'High').length
  return `I searched your lead database for "${query}". You have ${leads.length} total leads with ${highCount} high-priority ones. Try asking about a city (e.g. "leads in Lucknow"), a category ("dental clinics"), "top 5 leads" or "poor reviews".`
}
