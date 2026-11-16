
export const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' }

export const findLeadById = (leads, id) => leads.find((l) => l.id === Number(id))

export function countBy(leads, key) {
  return leads.reduce((acc, lead) => {
    acc[lead[key]] = (acc[lead[key]] || 0) + 1
    return acc
  }, {})
}

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

export function getPriorityDistribution(leads) {
  const counts = countBy(leads, 'priority')
  return ['High', 'Medium', 'Low'].map((name) => ({
    name,
    value: Math.round(((counts[name] || 0) / leads.length) * 100),
    color: PRIORITY_COLORS[name],
  }))
}

export function matchesSearch(lead, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [lead.name, lead.location, lead.category].some((field) => field.toLowerCase().includes(q))
}
