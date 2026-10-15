import { areaOf } from '@/features/leads/utils/leadArea'
import { funnelCounts } from '@/features/pipeline/utils/pipelineStats'

/**
 * Everything the Insights page shows, computed in the browser from the user's saved leads.
 */

export const RANGES = [
  { id: 'all', label: 'All time', days: null },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '7', label: 'Last 7 days', days: 7 },
]

const DAY = 86400000
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

function countBy(list, getKey) {
  const map = {}
  list.forEach((item) => {
    const k = getKey(item)
    if (k) map[k] = (map[k] || 0) + 1
  })
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** City / category / date filters. Leads without a saved date only appear in "All time". */
export function filterLeads(leads, { city, category, range }) {
  const days = RANGES.find((r) => r.id === range)?.days
  const since = days ? Date.now() - days * DAY : null
  return leads.filter((l) =>
    (city === 'All' || l.location === city) &&
    (category === 'All' || l.category === category) &&
    (!since || (l.createdAt && new Date(l.createdAt).getTime() >= since)))
}

/** Monday 00:00 of the week a date falls in. */
function weekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d
}

/** Leads saved per week (last 12 weeks that have data, gaps filled with 0). */
function savedByWeek(leads) {
  const dated = leads.filter((l) => l.createdAt)
  if (!dated.length) return []
  const counts = {}
  dated.forEach((l) => {
    const k = weekStart(l.createdAt).getTime()
    counts[k] = (counts[k] || 0) + 1
  })
  const last = weekStart(Date.now()).getTime()
  const first = Math.max(Math.min(...Object.keys(counts).map(Number)), last - 11 * 7 * DAY)
  const out = []
  for (let t = first; t <= last; t += 7 * DAY) {
    const label = new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    out.push({ name: label, value: counts[t] || 0 })
  }
  return out
}

export function computeInsights(leads) {
  const total = leads.length
  const withArea = leads.map((l) => ({ ...l, area: areaOf(l), hot: l.priority === 'High' }))
  const avg = total ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0
  const hot = withArea.filter((l) => l.hot)
  const contacted = leads.filter((l) => l.status !== 'New').length
  const converted = leads.filter((l) => l.status === 'Converted').length

  // Score histogram: 0–9, 10–19 … 90–100
  const histogram = Array.from({ length: 10 }, (_, i) => ({
    name: i === 9 ? '90–100' : `${i * 10}–${i * 10 + 9}`,
    min: i * 10,
    value: leads.filter((l) => Math.min(9, Math.floor((l.score || 0) / 10)) === i).length,
  }))

  const priority = ['High', 'Medium', 'Low'].map((p) => ({ name: p, value: leads.filter((l) => l.priority === p).length }))

  const websitesChecked = leads.filter((l) => l.websiteOutdated !== null).length
  const sentimentDone = leads.filter((l) => l.sentimentLabel).length
  const gaps = [
    { name: 'No website', value: leads.filter((l) => !l.hasWebsite).length },
    { name: 'No phone', value: leads.filter((l) => !l.phone || l.phone === '—').length },
    { name: 'Incomplete details', value: leads.filter((l) => l.serviceGaps.some((g) => /incomplete/i.test(g))).length },
    { name: 'Weak social', value: leads.filter((l) => l.serviceGaps.some((g) => /social/i.test(g))).length },
    { name: 'Outdated website', value: leads.filter((l) => l.websiteOutdated === true).length },
    { name: 'Negative reviews', value: leads.filter((l) => l.sentimentLabel === 'Negative').length },
  ].sort((a, b) => b.value - a.value)

  const categories = countBy(leads, (l) => l.category || 'Other').slice(0, 8)
  const areas = countBy(withArea, (l) => l.area).slice(0, 8)
  const funnel = funnelCounts(leads)
  const weekly = savedByWeek(leads)

  const sentiment = ['Positive', 'Neutral', 'Negative'].map((name) => ({
    name, value: leads.filter((l) => l.sentimentLabel === name).length,
  }))

  // Opportunity matrix: top 6 categories × top 6 areas, hot leads per cell
  const topCats = countBy(leads, (l) => l.category || 'Other').slice(0, 6).map((c) => c.name)
  const topAreas = countBy(withArea, (l) => l.area).slice(0, 6).map((a) => a.name)
  const cells = {}
  withArea.forEach((l) => {
    const k = `${l.category || 'Other'}|${l.area}`
    const c = (cells[k] ||= { total: 0, hot: 0, noWebsite: 0 })
    c.total += 1
    if (l.hot) c.hot += 1
    if (!l.hasWebsite) c.noWebsite += 1
  })
  const matrixMax = Math.max(1, ...topCats.flatMap((c) => topAreas.map((a) => cells[`${c}|${a}`]?.hot || 0)))
  const matrix = { categories: topCats, areas: topAreas, cells, max: matrixMax }

  // ---- smart insight cards ----
  const insights = []
  const catStats = countBy(leads, (l) => l.category || 'Other')
    .filter((c) => c.value >= 3)
    .map((c) => {
      const inCat = leads.filter((l) => (l.category || 'Other') === c.name)
      return { name: c.name, total: c.value, noWebsitePct: pct(inCat.filter((l) => !l.hasWebsite).length, c.value) }
    })
    .sort((a, b) => b.noWebsitePct - a.noWebsitePct || b.total - a.total)
  if (catStats[0]?.noWebsitePct >= 30) {
    insights.push({ tone: 'hot', text: `${catStats[0].noWebsitePct}% of ${catStats[0].name.toLowerCase()} have no website – best target for website services.` })
  }
  const hotAreas = countBy(hot, (l) => l.area)
  if (hotAreas[0]) insights.push({ tone: 'area', text: `${hotAreas[0].name} has the most hot leads (${hotAreas[0].value}).` })
  if (hot.length) {
    const hotContacted = hot.filter((l) => l.status !== 'New').length
    insights.push({
      tone: 'action',
      text: `You have contacted ${hotContacted} of ${hot.length} hot leads${hotContacted < hot.length ? ` – start with the top ${Math.min(10, hot.length - hotContacted)}.` : '. Great work!'}`,
      link: hotContacted < hot.length ? { to: '/my-leads?priority=High', label: 'Open hot leads' } : null,
    })
  }
  if (gaps[0]?.value) insights.push({ tone: 'gap', text: `The most common gap is “${gaps[0].name.toLowerCase()}” (${gaps[0].value} of ${total} leads). Lead with it in your pitch.` })
  if (contacted >= 5) insights.push({ tone: 'win', text: `${pct(converted, contacted)}% of contacted leads became clients (${converted} of ${contacted}).` })

  // ---- counts only (no names / phones / addresses) for the AI summary ----
  const aiCounts = {
    totalLeads: total,
    averageScore: avg,
    hotLeadsPercent: pct(hot.length, total),
    conversionRatePercent: pct(converted, contacted),
    priority: Object.fromEntries(priority.map((p) => [p.name, p.value])),
    gaps: Object.fromEntries(gaps.map((g) => [g.name, g.value])),
    topCategories: catStats.slice(0, 5).map((c) => ({ category: c.name, leads: c.total, noWebsitePercent: c.noWebsitePct })),
    topAreasByHotLeads: hotAreas.slice(0, 5).map((a) => ({ area: a.name, hotLeads: a.value })),
    funnel: Object.fromEntries(funnel.map((f) => [f.name, f.value])),
    hotLeadsNotContacted: hot.filter((l) => l.status === 'New').length,
  }

  return {
    total, avg,
    hotCount: hot.length,
    hotPct: pct(hot.length, total),
    contacted, converted,
    convRate: pct(converted, contacted),
    histogram, priority, gaps, categories, areas, funnel, weekly, sentiment, sentimentDone, websitesChecked,
    matrix, insights: insights.slice(0, 5), aiCounts,
  }
}
