/**
 * Area (locality) of a lead = the address part just before the city,
 * e.g. "…, Palasia, Indore, MP 452001" → "Palasia".
 * Falls back to the city when the address has no clear locality.
 */
export function areaOf(lead) {
  const city = (lead.location || '').trim()
  const parts = (lead.address || '').split(',').map((p) => p.trim()).filter(Boolean)
  const idx = city ? parts.findIndex((p) => p.toLowerCase().startsWith(city.toLowerCase())) : -1
  const candidate = idx > 0 ? parts[idx - 1] : null
  const looksLikeArea = candidate
    && candidate.toLowerCase() !== (lead.name || '').toLowerCase()
    && !/\d/.test(candidate)
  return looksLikeArea ? candidate : city || 'Unknown area'
}
