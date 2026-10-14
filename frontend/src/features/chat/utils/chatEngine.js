/**
 * Ask AI: answers questions about the user's REAL saved leads.
 * Understands: priority, website, phone, city, category, status, reviews, counts, summary.
 * Filters can be combined, e.g. "high priority gyms in Lucknow without website".
 */

export const SUGGESTIONS = [
  'Show high-priority leads',
  'Which businesses have no website?',
  'Who should I contact first?',
  'Give me a summary',
]

const MAX_LIST = 8
const STATUS_WORDS = {
  'not interested': 'Not Interested',
  'follow-up': 'Follow-up',
  'follow up': 'Follow-up',
  followup: 'Follow-up',
  converted: 'Converted',
  won: 'Converted',
  interested: 'Interested',
  contacted: 'Contacted',
  new: 'New',
}

const line = (l) => `• ${l.name} (${l.location || '—'}) · Score ${l.score} · ${l.status}`

function list(items) {
  const shown = items.slice(0, MAX_LIST).map(line).join('\n')
  const more = items.length > MAX_LIST ? `\n…and ${items.length - MAX_LIST} more (see My Leads)` : ''
  return shown + more
}

const uniq = (arr) => [...new Set(arr.filter(Boolean))]

export function getAIResponse(query, leads = []) {
  const q = ` ${query.toLowerCase()} `

  // ---- greetings / help ----
  if (/\b(hi|hello|hey|help|what can you do)\b/.test(q)) {
    return "Hi! I can answer questions about your saved leads. Try:\n• Show high-priority leads\n• Which businesses have no website?\n• Leads from Noida\n• Show businesses with poor reviews\n• Give me a summary"
  }

  // ---- general questions (work even with no leads) ----
  if (/(how does|how is).*(scor)/.test(q) || q.includes('scoring')) {
    return "📈 Every business gets a score from 0 to 100 based on its digital gaps:\n• No website: biggest boost\n• Incomplete profile (no phone / opening hours)\n• Low rating or few reviews (when available)\n\n70+ = High priority, 40–69 = Medium, below 40 = Low."
  }
  if (q.includes('what should i search') || q.includes('what to search')) {
    return "🔎 Try a city + a business type that often lacks a website, e.g.:\n• Gyms in Lucknow\n• Dentists in Noida\n• Salons in Jaipur\n• Cafes in Chandigarh\n\nThen add the High-priority ones to My Leads."
  }

  if (leads.length === 0) {
    return 'You have no saved leads yet. Go to Find Leads, search a city and business type, and add some leads. Then ask me again!'
  }

  // ---- detect filters ----
  const city = uniq(leads.map((l) => l.location)).find((c) => q.includes(c.toLowerCase()))
  const category = uniq(leads.map((l) => l.category)).find((c) => {
    const lc = c.toLowerCase()
    return q.includes(lc) || q.includes(lc.replace(/s$/, '')) || q.includes(`${lc}s`)
  })
  const statusKey = Object.keys(STATUS_WORDS).find(
    (k) => q.includes(k) && !(k === 'interested' && q.includes('not interested')) && !(k === 'new' && q.includes('news')),
  )
  const status = statusKey && STATUS_WORDS[statusKey]
  const wantHigh = /(high|hot|top|best|priority|important)/.test(q) && !/(low|medium)/.test(q)
  const wantMedium = q.includes('medium')
  const wantLow = /\blow\b/.test(q) && !q.includes('rating')
  const noWebsite = /(no|without|missing|don'?t have|not have)\s*(a\s*)?website/.test(q) || q.includes('no site')
  const hasWebsite = /(with|has|have)\s*(a\s*)?website/.test(q) && !noWebsite
  const noPhone = /(no|without|missing)\s*(a\s*)?(phone|number|contact)/.test(q)

  // ---- poor reviews / low ratings (Synopsis 8.10 example) ----
  if (/(poor|bad|low|negative)\s*(review|rating)/.test(q)) {
    const rated = leads.filter((l) => typeof l.rating === 'number')
    if (!rated.length) {
      return "⭐ None of your saved leads have rating data yet. Ratings and reviews come from Google Places; the free OpenStreetMap source doesn't include them."
    }
    const poor = rated.filter((l) => l.rating < 3.5).sort((a, b) => a.rating - b.rating)
    return poor.length
      ? `Found ${poor.length} leads with poor ratings (below 3.5★):\n${poor.slice(0, MAX_LIST).map((l) => `• ${l.name} – ${l.rating}★ (${l.reviews} reviews)`).join('\n')}\n\nThese may need review-management help.`
      : 'Good news: none of your rated leads have poor ratings (below 3.5★).'
  }

  // ---- special intents ----
  if (/(summary|overview|report|stats|statistics)/.test(q)) {
    const high = leads.filter((l) => l.priority === 'High').length
    const noWeb = leads.filter((l) => !l.hasWebsite).length
    const conv = leads.filter((l) => l.status === 'Converted').length
    const cities = uniq(leads.map((l) => l.location))
    return `📊 Your lead summary:\n• Total leads: ${leads.length}\n• High priority: ${high}\n• No website: ${noWeb}\n• Converted: ${conv}\n• Cities: ${cities.join(', ') || '—'}`
  }

  if (/(contact first|call first|who should|start with|next lead)/.test(q)) {
    const todo = leads
      .filter((l) => l.status === 'New' || l.status === 'Follow-up')
      .sort((a, b) => b.score - a.score)
    if (!todo.length) return 'No new or follow-up leads right now. Find more leads to keep your pipeline full!'
    const top = todo[0]
    const rest = todo.slice(1, 4)
    return `🔥 Contact ${top.name} first (score ${top.score}).\nWhy: ${(top.serviceGaps || []).join(', ') || 'strong opportunity'}.\nSuggested pitch: ${top.recommendedAction}.${rest.length ? `\n\nNext in line:\n${list(rest)}` : ''}`
  }

  // ---- apply filters ----
  let result = [...leads]
  const used = []
  if (city) { result = result.filter((l) => l.location === city); used.push(`in ${city}`) }
  if (category) { result = result.filter((l) => l.category === category); used.push(category.toLowerCase()) }
  if (status) { result = result.filter((l) => l.status === status); used.push(`with status "${status}"`) }
  if (wantHigh) { result = result.filter((l) => l.priority === 'High'); used.push('high priority') }
  if (wantMedium) { result = result.filter((l) => l.priority === 'Medium'); used.push('medium priority') }
  if (wantLow) { result = result.filter((l) => l.priority === 'Low'); used.push('low priority') }
  if (noWebsite) { result = result.filter((l) => !l.hasWebsite); used.push('without a website') }
  if (hasWebsite) { result = result.filter((l) => l.hasWebsite); used.push('with a website') }
  if (noPhone) { result = result.filter((l) => !l.phone || l.phone === '—'); used.push('without a phone number') }

  result.sort((a, b) => b.score - a.score)
  const isCount = /(how many|count|number of|total)/.test(q)

  if (used.length === 0 && !isCount) {
    return "I didn't quite get that. You can ask things like:\n• Show high-priority leads\n• Which businesses have no website?\n• Leads from Noida\n• Show contacted leads\n• Give me a summary"
  }

  const label = used.length ? `leads ${used.join(', ')}` : 'leads'
  if (isCount) return `You have ${result.length} ${label}.`
  if (!result.length) return `No ${label} found. Try another filter, or find more leads.`
  return `Found ${result.length} ${label}:\n${list(result)}`
}