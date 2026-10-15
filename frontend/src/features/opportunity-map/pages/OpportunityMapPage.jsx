import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPinned, Flame, MapPinOff } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { areaOf } from '@/features/leads/utils/leadArea'

/**
 * Opportunity Map: the user's saved leads on an OpenStreetMap map, pins coloured by score,
 * so they can see which areas have the most hot leads.
 */

const LEVELS = {
  High: { color: '#F5A524', label: 'High (70+)' },
  Medium: { color: '#0497F6', label: 'Medium (40–69)' },
  Low: { color: '#8A9BAD', label: 'Low (below 40)' },
}
const FILTERS = ['All', 'High', 'Medium', 'Low']
const INDIA_CENTER = [22.5, 79]

const levelOf = (score) => (score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low')
const hasLocation = (l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude)

/** Zooms the map to fit the pins every time the visible pins change. */
function FitToPins({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) map.setView(INDIA_CENTER, 5)
    else if (points.length === 1) map.setView(points[0], 15)
    else map.fitBounds(points, { padding: [32, 32], maxZoom: 15 })
  }, [map, points])
  return null
}

export default function OpportunityMapPage() {
  const { leads, loading, error } = useLeads()
  const [level, setLevel] = useState('All')
  const [city, setCity] = useState('All')

  const cities = useMemo(
    () => [...new Set(leads.map((l) => l.location).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [leads],
  )

  const inCity = useMemo(
    () => leads.filter((l) => city === 'All' || l.location === city).map((l) => ({ ...l, level: levelOf(l.score), area: areaOf(l) })),
    [leads, city],
  )

  const counts = useMemo(() => {
    const c = { All: inCity.length, High: 0, Medium: 0, Low: 0 }
    inCity.forEach((l) => { c[l.level] += 1 })
    return c
  }, [inCity])

  const visible = useMemo(() => inCity.filter((l) => level === 'All' || l.level === level), [inCity, level])
  const onMap = useMemo(() => visible.filter(hasLocation), [visible])
  const offMap = useMemo(() => visible.filter((l) => !hasLocation(l)), [visible])
  const points = useMemo(() => onMap.map((l) => [l.latitude, l.longitude]), [onMap])

  // Top areas: most High-priority leads (for the chosen city)
  const topAreas = useMemo(() => {
    const groups = {}
    inCity.forEach((l) => {
      const g = (groups[l.area] ||= { area: l.area, city: l.location, high: 0, total: 0 })
      g.total += 1
      if (l.level === 'High') g.high += 1
    })
    return Object.values(groups)
      .filter((g) => g.high > 0)
      .sort((a, b) => b.high - a.high || b.total - a.total)
      .slice(0, 5)
  }, [inCity])

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-slate-200 p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Couldn&apos;t load your leads</h2>
        <p className="text-sm text-slate-500 mt-1">Please refresh the page and try again.</p>
      </div>
    )
  }

  if (!leads.length) {
    return (
      <div className="bg-card rounded-xl border border-slate-200 p-10 text-center">
        <MapPinned size={32} className="mx-auto text-aqua" />
        <h2 className="mt-3 text-lg font-semibold text-slate-800">No leads to show yet</h2>
        <p className="text-sm text-slate-500 mt-1">Save some leads first, then come back to see them on the map.</p>
        <Link to="/lead-discovery" className="inline-block mt-4 bg-primary-600 text-white font-medium px-5 py-2.5 rounded-md">
          Find Leads →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Opportunity Map</h1>
        <p className="text-sm text-slate-500 mt-1">See where your leads are and which areas have the most hot leads.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by priority">
          {FILTERS.map((f) => {
            const active = level === f
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => setLevel(f)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium ${
                  active ? 'bg-primary-600 text-white' : 'bg-inset border border-line text-slate-600 hover:bg-line'
                }`}
              >
                {f !== 'All' && <span className="w-2.5 h-2.5 rounded-full" style={{ background: LEVELS[f].color }} />}
                {f} <span className={active ? 'text-white/80' : 'text-slate-400'}>{counts[f]}</span>
              </button>
            )
          })}
        </div>
        <label className="sm:ml-auto flex items-center gap-2 text-sm text-slate-600">
          City
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="All">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        {/* Map */}
        <div className="min-w-0 bg-card rounded-xl border border-slate-200 p-2">
          <div className="relative isolate z-0 h-[380px] sm:h-[520px] w-full rounded-lg overflow-hidden">
            <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FitToPins points={points} />
              {onMap.map((l) => (
                <CircleMarker
                  key={l.id}
                  center={[l.latitude, l.longitude]}
                  radius={9}
                  pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: LEVELS[l.level].color, fillOpacity: 0.95 }}
                >
                  <Popup>
                    <div className="min-w-[180px]" style={{ color: '#202124' }}>
                      <p className="font-semibold text-sm">{l.name}</p>
                      <p className="text-xs" style={{ color: '#5F6368' }}>{l.area}{l.location && l.area !== l.location ? `, ${l.location}` : ''}</p>
                      <p className="text-xs mt-1.5">
                        Score: <b style={{ color: LEVELS[l.level].color === '#8A9BAD' ? '#5F6368' : LEVELS[l.level].color }}>{l.score}</b> ({l.level})
                      </p>
                      <p className="text-xs">Main gap: {l.serviceGaps[0] || 'No major gaps'}</p>
                      <Link to={`/lead/${l.id}`} className="inline-block mt-2 text-xs font-semibold" style={{ color: '#0497F6' }}>
                        View lead →
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-2 text-xs text-slate-500">
            {Object.entries(LEVELS).map(([key, v]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} /> {v.label}
              </span>
            ))}
            <span className="sm:ml-auto">{onMap.length} of {visible.length} leads on the map</span>
          </div>
        </div>

        {/* Top areas */}
        <div className="bg-card rounded-xl border border-slate-200 p-5 h-fit">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Flame size={18} style={{ color: LEVELS.High.color }} /> Top areas
          </h3>
          <p className="text-xs text-slate-500 mt-1">Areas with the most High-priority leads</p>
          {topAreas.length ? (
            <ol className="mt-4 space-y-3">
              {topAreas.map((a, i) => (
                <li key={`${a.area}-${a.city}`} className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-inset border border-line text-xs font-semibold text-slate-600 flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{a.area}</p>
                    {a.city && a.city !== a.area && <p className="text-xs text-slate-500 truncate">{a.city}</p>}
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-sm font-bold" style={{ color: LEVELS.High.color }}>{a.high} high</span>
                    <span className="block text-[11px] text-slate-500">of {a.total} leads</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-slate-500 border border-dashed border-line rounded-lg p-4 text-center">
              No High-priority leads here yet.
            </p>
          )}
        </div>
      </div>

      {/* Leads without coordinates */}
      {offMap.length > 0 && (
        <div className="bg-card rounded-xl border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <MapPinOff size={18} className="text-slate-400" /> Not on map (no location)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            These leads were saved before locations were stored. Open a lead and use <b>Compare with nearby businesses</b> to add its location.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {offMap.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: LEVELS[l.level].color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{l.name}</p>
                  <p className="text-xs text-slate-500 truncate">{l.address}</p>
                </div>
                <span className="text-xs text-slate-500 shrink-0">Score {l.score}</span>
                <Link to={`/lead/${l.id}`} className="text-xs font-semibold text-primary-600 hover:text-aqua shrink-0">View</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
