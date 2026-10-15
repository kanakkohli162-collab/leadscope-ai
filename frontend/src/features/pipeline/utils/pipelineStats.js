import { daysSince } from '@/utils/format'

// Same statuses as Lead Details (leadService maps them to the backend values)
export const COLUMNS = [
  { status: 'New', accent: '#4EB9E5' },
  { status: 'Contacted', accent: '#0497F6' },
  { status: 'Follow-up', accent: '#A78BFA' },
  { status: 'Interested', accent: '#F5A524' },
  { status: 'Converted', accent: '#34D399' },
  { status: 'Not Interested', accent: '#8A9BAD' },
]
export const STATUSES = COLUMNS.map((c) => c.status)
export const OPEN_STATUSES = ['New', 'Contacted', 'Follow-up', 'Interested']
export const STALE_DAYS = 7

/** Days without an update for an open lead (7+), else null → "No update in N days". */
export function staleDays(lead) {
  if (!OPEN_STATUSES.includes(lead.status)) return null
  const days = daysSince(lead.updatedAt)
  return days != null && days >= STALE_DAYS ? days : null
}

export const sumDeals = (leads) => leads.reduce((sum, l) => sum + (Number(l.dealValue) || 0), 0)

/*
 * How far each lead got: New 0 → Contacted 1 → Follow-up 2 → Interested 3 → Converted 4.
 * "Not Interested" leads were contacted (they answered no), so they count as reaching Contacted.
 */
const STAGE = { New: 0, Contacted: 1, 'Follow-up': 2, Interested: 3, Converted: 4, 'Not Interested': 1 }

/** How many leads reached each step: Saved → Contacted → Interested → Converted (for funnels). */
export function funnelCounts(leads) {
  const reached = (stage) => leads.filter((l) => (STAGE[l.status] ?? 0) >= stage).length
  return [
    { name: 'Saved', value: leads.length },
    { name: 'Contacted', value: reached(1) },
    { name: 'Interested', value: reached(3) },
    { name: 'Converted', value: reached(4) },
  ]
}

/** Conversion between steps, as % of the leads that reached the earlier step (null = no leads there yet). */
export function conversionRates(leads) {
  const reached = (stage) => leads.filter((l) => (STAGE[l.status] ?? 0) >= stage).length
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : null)
  const total = leads.length
  const contacted = reached(1)
  const interested = reached(3)
  const converted = reached(4)
  return [
    { from: 'New', to: 'Contacted', pct: pct(contacted, total), of: `${contacted} of ${total}` },
    { from: 'Contacted', to: 'Interested', pct: pct(interested, contacted), of: `${interested} of ${contacted}` },
    { from: 'Interested', to: 'Converted', pct: pct(converted, interested), of: `${converted} of ${interested}` },
  ]
}
