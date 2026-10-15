import L from 'leaflet'

export const INDIA_CENTER = [22.5, 79]
export const CITY_ZOOM = 12
export const MAX_ROUTE_STOPS = 5

/** Pin colours. Score mode: High orange, Medium blue, Low grey. Website mode: none red, has website green. */
export const SCORE_COLORS = {
  High: { color: '#F5A524', label: 'High (70+)' },
  Medium: { color: '#0497F6', label: 'Medium (40–69)' },
  Low: { color: '#8A9BAD', label: 'Low (below 40)' },
}
export const WEBSITE_COLORS = {
  none: { color: '#EF4444', label: 'No website' },
  has: { color: '#22C55E', label: 'Has website' },
}

export const levelOf = (score) => (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low')
export const hasLocation = (l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude)
export const pinColor = (lead, mode) =>
  mode === 'website'
    ? (lead.hasWebsite ? WEBSITE_COLORS.has.color : WEBSITE_COLORS.none.color)
    : SCORE_COLORS[levelOf(lead.score)].color

/**
 * Approximate location: the backend says only the city / area was geocoded,
 * or 2+ different leads sit on exactly the same point (usually the city centre).
 */
export function markApproximate(leads) {
  const count = {}
  leads.forEach((l) => {
    if (!hasLocation(l)) return
    const k = `${l.latitude.toFixed(5)},${l.longitude.toFixed(5)}`
    count[k] = (count[k] || 0) + 1
  })
  return leads.map((l) => ({
    ...l,
    approximate: hasLocation(l) && (l.locationApproximate || count[`${l.latitude.toFixed(5)},${l.longitude.toFixed(5)}`] > 1),
  }))
}

// ---- Leaflet icons (cached, so markers don't redraw on every render) ----

const iconCache = {}

/** Round coloured pin; `temporary` = dashed ring for "Find businesses here" results; `inRoute` = route stop number. */
export function pinIcon(color, { temporary = false, inRoute = null } = {}) {
  const key = `${color}|${temporary}|${inRoute}`
  if (!iconCache[key]) {
    const size = inRoute ? 24 : 18
    const style = temporary
      ? `background:${color}55;border:2px dashed #FFFFFF;`
      : `background:${color};border:2px solid #FFFFFF;`
    iconCache[key] = L.divIcon({
      className: '',
      html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;${style}box-shadow:0 1px 4px rgba(0,0,0,.55);color:#01081A;font:700 12px Figtree,sans-serif">${inRoute || ''}</span>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
    })
  }
  return iconCache[key]
}

/** Deep-ocean cluster bubble with the number of leads inside. */
export function clusterIcon(cluster) {
  const n = cluster.getChildCount()
  const size = n < 10 ? 34 : n < 50 ? 40 : 48
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:rgba(4,151,246,.9);border:3px solid rgba(255,255,255,.85);box-shadow:0 0 0 6px rgba(4,151,246,.25);color:#FFFFFF;font:700 13px Figtree,sans-serif">${n}</span>`,
    iconSize: [size, size],
  })
}

/** Google Maps directions through the stops in order (no API key needed). */
export const googleRouteUrl = (stops) =>
  `https://www.google.com/maps/dir/${stops.map((s) => `${s.latitude},${s.longitude}`).join('/')}`
