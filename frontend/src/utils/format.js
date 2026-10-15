/** "Asha Verma" → "AV", "Kanak" → "K". Used for the round avatar. */
export function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** "Asha Verma" → "Asha". Used for greetings. */
export function getFirstName(name) {
  return (name || '').trim().split(/\s+/)[0] || 'there'
}

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

/** 120000 → "₹1,20,000" (Indian grouping). null / empty → "". */
export function formatINR(value) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return ''
  return INR.format(Number(value))
}

/** Whole days since an ISO date (0 = today). null when there is no date. */
export function daysSince(isoDate) {
  if (!isoDate) return null
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000)
}
