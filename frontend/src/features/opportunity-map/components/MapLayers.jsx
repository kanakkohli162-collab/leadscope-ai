import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap, useMapEvents } from 'react-leaflet'
import { INDIA_CENTER, CITY_ZOOM } from '../utils/mapHelpers'

/**
 * Fits the map to the visible pins (with padding) whenever `fitKey` changes (filters / first load).
 * If every pin is on the same point, zooms to city level instead of region level.
 */
export function FitToPins({ points, fitKey }) {
  const map = useMap()
  const pointsRef = useRef(points)
  pointsRef.current = points

  useEffect(() => {
    const pts = pointsRef.current
    const unique = new Set(pts.map(([a, b]) => `${a.toFixed(5)},${b.toFixed(5)}`))
    if (pts.length === 0) map.setView(INDIA_CENTER, 5)
    else if (unique.size === 1) map.setView(pts[0], pts.length > 1 ? CITY_ZOOM : 15)
    else map.fitBounds(pts, { padding: [40, 40], maxZoom: 16 })
  }, [map, fitKey])
  return null
}

/** Zooms to a group of points (e.g. a clicked "Top area"). `focus` = { points, id } — a new id re-zooms. */
export function FocusOn({ focus }) {
  const map = useMap()
  useEffect(() => {
    if (!focus?.points?.length) return
    const unique = new Set(focus.points.map(([a, b]) => `${a},${b}`))
    if (unique.size === 1) map.setView(focus.points[0], Math.max(map.getZoom(), 14))
    else map.fitBounds(focus.points, { padding: [40, 40], maxZoom: 16 })
  }, [map, focus])
  return null
}

/** Tells the page where the map centre is (for "Find businesses here"). */
export function CenterTracker({ onChange }) {
  const map = useMapEvents({ moveend: () => onChange(map.getCenter()) })
  useEffect(() => { onChange(map.getCenter()) }, [map, onChange])
  return null
}

/**
 * Heatmap layer (leaflet.heat), weighted by lead score.
 * The plugin attaches itself to the global `L`, so it is loaded after Leaflet, only when Heatmap is chosen.
 */
export function HeatLayer({ points }) {
  const map = useMap()
  const layerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    if (!window.L) window.L = L
    import('leaflet.heat').then(() => {
      if (cancelled || !window.L.heatLayer) return
      layerRef.current = window.L.heatLayer(points, {
        radius: 28, blur: 20, max: 1, minOpacity: 0.35,
        gradient: { 0.3: '#0497F6', 0.6: '#4EB9E5', 0.8: '#F5A524', 1: '#EF4444' },
      }).addTo(map)
    })
    return () => {
      cancelled = true
      if (layerRef.current) map.removeLayer(layerRef.current)
      layerRef.current = null
    }
  }, [map, points])
  return null
}
