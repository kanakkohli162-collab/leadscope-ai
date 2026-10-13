/**
 * Pure functions that turn a list of leads into numbers/chart data.
 *
 * "Pure" = same input → same output, no side effects. That makes them:
 *  - easy to unit-test,
 *  - safe to call once at module level (data is static), and
 *  - reusable later when the list comes from the API instead of mocks.
 */

export const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }

/** Look up a lead by the :id route param (which is always a string). */
export const findLeadById = (leads, id) => leads.find((l) => l.id === Number(id))

/** Count how many leads share each value of `key`, e.g. { Noida: 10, Delhi: 6 }. */
export function countBy(leads, key) {
  return leads.reduce((acc, lead) => {
    acc[lead[key]] = (acc[lead[key]] || 0) + 1
    return acc
  }, {})
}

/**
 * Chart-ready [{ name, value }] sorted largest first.
 * Anything beyond `top` is merged into an "Others" bar so charts stay readable.
 */
export function toChartData(counts, top = 5) {
  const sorted = Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
  if (sorted.length <= top) return sorted
  const others = sorted.slice(top).reduce((sum, d) => sum + d.value, 0)
  return [...sorted.slice(0, top), { name: 'Others', value: others }]
}

export function getDashboardStats(leads) {
  return {
    totalLeads: leads.length,
    highPriority: leads.filter((l) => l.priority === 'High').length,
    needWebsite: leads.filter((l) => !l.hasWebsite).length,
    poorReviews: leads.filter((l) => l.rating < 4).length,
  }
}

/** Priority split as percentages for the donut chart. */
export function getPriorityDistribution(leads) {
  const counts = countBy(leads, 'priority')
  return ['High', 'Medium', 'Low'].map((name) => ({
    name,
    value: Math.round(((counts[name] || 0) / leads.length) * 100),
    color: PRIORITY_COLORS[name],
  }))
}

/** Text filter shared by Topbar search, My Leads and the chatbot. */
export function matchesSearch(lead, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [lead.name, lead.location, lead.category].some((field) => field.toLowerCase().includes(q))
}
