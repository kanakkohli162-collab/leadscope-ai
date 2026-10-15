import { useCallback, useMemo, useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import { MapPinned, Flame, MapPinOff, Crosshair, Loader2, X, Route, ExternalLink, Trash2 } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'
import { useToast } from '@/hooks/useToast'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { areaOf } from '@/features/leads/utils/leadArea'
import { friendlySearchError } from '@/features/leads/utils/searchErrors'
import { searchNearby, createLead } from '@/services/leadService'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import { FitToPins, FocusOn, CenterTracker, HeatLayer } from '../components/MapLayers'
import {
  INDIA_CENTER, MAX_ROUTE_STOPS, SCORE_COLORS, WEBSITE_COLORS,
  levelOf, hasLocation, pinColor, pinIcon, clusterIcon, markApproximate, googleRouteUrl,
} from '../utils/mapHelpers'

/**
 * Opportunity Map: the user's saved leads on an OpenStreetMap map (clustered pins or a heatmap),
 * the areas with the most hot leads, "Find businesses here" around the map centre,
 * and a route plan (up to 5 stops) that opens in Google Maps.
 */

const FILTERS = ['All', 'High', 'Medium', 'Low']
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const pill = (active) =>
  `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium ${FOCUS} ${
    active ? 'bg-primary-600 text-white' : 'bg-inset border border-line text-slate-600 hover:bg-line'
  }`

/** Two-option switch, e.g. Pins / Heatmap. */
function Toggle({ label, value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full border border-line bg-inset p-0.5" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 rounded-full text-sm font-medium ${FOCUS} ${value === v ? 'bg-primary-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

export default function OpportunityMapPage() {
  const { leads, setLeads, loading, error } = useLeads()
  const toast = useToast()
  const [level, setLevel] = useState('All')
  const [city, setCity] = useState('All')
  const [view, setView] = useState('pins')        // pins | heat
  const [colorMode, setColorMode] = useState('score') // score | website
  const [focus, setFocus] = useState(null)        // { points, id } → zoom to a top area
  const [route, setRoute] = useState([])          // lead ids, in visiting order

  // "Find businesses here"
  const [center, setCenter] = useState(null)
  const [findOpen, setFindOpen] = useState(false)
  const [findType, setFindType] = useState(() => {
    const recent = storage.get(STORAGE_KEYS.recentSearches, [])
    return (Array.isArray(recent) && recent[0]?.category) || 'Restaurants'
  })
  const [radius, setRadius] = useState(1500)
  const [finding, setFinding] = useState(false)
  const [nearby, setNearby] = useState([])
  const [savingId, setSavingId] = useState(null)

  const cities = useMemo(
    () => [...new Set(leads.map((l) => l.location).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [leads],
  )

  const inCity = useMemo(
    () => markApproximate(leads)
      .filter((l) => city === 'All' || l.location === city)
      .map((l) => ({ ...l, level: levelOf(l.score), area: areaOf(l) })),
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
  const heatPoints = useMemo(() => onMap.map((l) => [l.latitude, l.longitude, Math.max(0.05, l.score / 100)]), [onMap])

  // Top areas: most High-priority leads (for the chosen city)
  const topAreas = useMemo(() => {
    const groups = {}
    inCity.forEach((l) => {
      const g = (groups[`${l.area}|${l.location}`] ||= { area: l.area, city: l.location, high: 0, total: 0, points: [] })
      g.total += 1
      if (l.level === 'High') g.high += 1
      if (hasLocation(l)) g.points.push([l.latitude, l.longitude])
    })
    return Object.values(groups)
      .filter((g) => g.high > 0)
      .sort((a, b) => b.high - a.high || b.total - a.total)
      .slice(0, 5)
  }, [inCity])

  const routeStops = useMemo(
    () => route.map((id) => leads.find((l) => l.id === id)).filter((l) => l && hasLocation(l)),
    [route, leads],
  )

  const onCenter = useCallback((c) => setCenter(c), [])

  function toggleRoute(id) {
    setRoute((r) => {
      if (r.includes(id)) return r.filter((x) => x !== id)
      if (r.length >= MAX_ROUTE_STOPS) {
        toast.error(`A route can have up to ${MAX_ROUTE_STOPS} stops.`)
        return r
      }
      return [...r, id]
    })
  }

  async function findHere(e) {
    e.preventDefault()
    if (!center || !findType.trim()) return
    setFinding(true)
    try {
      const res = await searchNearby(center.lat, center.lng, findType.trim(), { radius })
      // Hide businesses that are already saved
      const saved = new Set(leads.map((l) => `${l.name}|${l.address}`.toLowerCase()))
      const fresh = res.results.filter((r) => hasLocation(r) && !saved.has(`${r.name}|${r.address}`.toLowerCase()))
      setNearby(fresh)
      if (!fresh.length) toast.error(`No new ${findType.trim().toLowerCase()} found within ${radius / 1000} km. Try another type or move the map.`)
      else toast.success(`Found ${fresh.length} ${fresh.length === 1 ? 'business' : 'businesses'} nearby. Dashed pins are not saved yet.`)
    } catch (err) {
      toast.error(friendlySearchError(err))
    } finally {
      setFinding(false)
    }
  }

  async function saveNearby(r) {
    setSavingId(r.id)
    try {
      const saved = await createLead(r.raw)
      setNearby((list) => list.filter((x) => x.id !== r.id))
      if (saved.alreadySaved) toast.success(`${r.name} is already in My Leads`)
      else {
        setLeads((all) => [...all, saved])
        toast.success(`${r.name} saved to My Leads`)
      }
    } catch {
      toast.error(`Could not save ${r.name}. Please try again.`)
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <PageLoader />

  if (error) {
    return (
      <WhitePanel as="div" bodyClassName="text-center !p-8 sm:!p-10">
        <h2 className="text-lg font-semibold text-slate-800">Couldn&apos;t load your leads</h2>
        <p className="text-sm text-slate-500 mt-1">Please refresh the page and try again.</p>
      </WhitePanel>
    )
  }

  if (!leads.length) {
    return (
      <WhitePanel as="div" bodyClassName="text-center !p-8 sm:!p-10">
        <MapPinned size={32} className="mx-auto text-aqua" />
        <h2 className="mt-3 text-lg font-semibold text-slate-800">No leads to show yet</h2>
        <p className="text-sm text-slate-500 mt-1">Save some leads first, then come back to see them on the map.</p>
        <Link to="/lead-discovery" className="inline-block mt-4 bg-primary-600 text-white font-medium px-5 py-2.5 rounded-md">
          Find Leads →
        </Link>
      </WhitePanel>
    )
  }

  const legend = colorMode === 'website' ? WEBSITE_COLORS : SCORE_COLORS

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Opportunity Map</h1>
        <p className="text-sm text-slate-500 mt-1">See where your leads are and which areas have the most hot leads.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by priority">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={level === f} onClick={() => setLevel(f)} className={pill(level === f)}>
              {f !== 'All' && <span className="w-2.5 h-2.5 rounded-full" style={{ background: SCORE_COLORS[f].color }} />}
              {f} <span className={level === f ? 'text-white/80' : 'text-slate-400'}>{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="sm:ml-auto flex items-center gap-2 text-sm text-slate-600">
          City
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="px-3 py-2 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
          >
            <option value="All">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6">
        {/* Map */}
        <WhitePanel as="div" bodyClassName="!p-2 sm:!p-3">
          {/* Map toolbar */}
          <div className="flex flex-wrap items-center gap-2 px-1 pb-2">
            <Toggle label="Map view" value={view} onChange={setView} options={[['pins', 'Pins'], ['heat', 'Heatmap']]} />
            <Toggle label="Colour pins by" value={colorMode} onChange={setColorMode} options={[['score', 'By score'], ['website', 'By website']]} />
            <button
              type="button"
              aria-expanded={findOpen}
              onClick={() => setFindOpen((o) => !o)}
              className={`sm:ml-auto ${pill(findOpen)}`}
            >
              <Crosshair size={14} aria-hidden="true" /> Find businesses here
            </button>
          </div>

          {findOpen && (
            <form onSubmit={findHere} className="mx-1 mb-2 flex flex-col sm:flex-row sm:items-end gap-2 rounded-lg border border-line bg-inset p-3">
              <label className="flex-1 text-xs font-medium text-slate-500">
                Business type
                <input
                  value={findType}
                  onChange={(e) => setFindType(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Cafes"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
                />
              </label>
              <label className="text-xs font-medium text-slate-500">
                Around the map centre
                <select
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="mt-1 w-full sm:w-28 px-3 py-2 border border-slate-300 bg-white rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  <option value={1000}>1 km</option>
                  <option value={1500}>1.5 km</option>
                  <option value={2000}>2 km</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={finding || !findType.trim() || !center}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold ${FOCUS}`}
              >
                {finding ? <Loader2 size={15} className="motion-safe:animate-spin" aria-hidden="true" /> : <Crosshair size={15} aria-hidden="true" />}
                {finding ? 'Searching…' : 'Search here'}
              </button>
              {nearby.length > 0 && (
                <button type="button" onClick={() => setNearby([])} className={`inline-flex items-center justify-center gap-1 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-800 ${FOCUS}`}>
                  <X size={14} aria-hidden="true" /> Clear {nearby.length} results
                </button>
              )}
            </form>
          )}

          <div className="relative isolate z-0 h-[380px] sm:h-[520px] w-full rounded-lg overflow-hidden">
            <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="h-full w-full">
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FitToPins points={points} fitKey={`${level}|${city}|${leads.length > 0}`} />
              <FocusOn focus={focus} />
              <CenterTracker onChange={onCenter} />

              {view === 'heat' ? (
                <HeatLayer points={heatPoints} />
              ) : (
                <MarkerClusterGroup chunkedLoading iconCreateFunction={clusterIcon} showCoverageOnHover={false} maxClusterRadius={50}>
                  {onMap.map((l) => {
                    const stop = route.indexOf(l.id)
                    return (
                      <Marker
                        key={l.id}
                        position={[l.latitude, l.longitude]}
                        icon={pinIcon(pinColor(l, colorMode), { inRoute: stop >= 0 ? stop + 1 : null })}
                      >
                        <Popup>
                          <div className="min-w-[190px]" style={{ color: '#202124' }}>
                            <p className="font-semibold text-sm">{l.name}</p>
                            <p className="text-xs" style={{ color: '#5F6368' }}>{l.area}{l.location && l.area !== l.location ? `, ${l.location}` : ''}</p>
                            {l.approximate && (
                              <p className="text-[11px] mt-1 font-semibold" style={{ color: '#B45309' }}>Approximate location</p>
                            )}
                            <p className="text-xs mt-1.5">
                              Score: <b style={{ color: l.level === 'Low' ? '#5F6368' : SCORE_COLORS[l.level].color }}>{l.score}</b> ({l.level})
                            </p>
                            <p className="text-xs">Main gap: {l.serviceGaps[0] || 'No major gaps'}</p>
                            <p className="text-xs">{l.hasWebsite ? 'Has a website' : 'No website'}</p>
                            <label className="mt-2 flex items-center gap-1.5 text-xs cursor-pointer">
                              <input type="checkbox" checked={stop >= 0} onChange={() => toggleRoute(l.id)} />
                              {stop >= 0 ? `Route stop ${stop + 1}` : 'Add to route'}
                            </label>
                            <Link to={`/lead/${l.id}`} className="inline-block mt-2 text-xs font-semibold" style={{ color: '#0497F6' }}>
                              View lead →
                            </Link>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MarkerClusterGroup>
              )}

              {/* "Find businesses here" results: dashed pins, not saved yet */}
              {nearby.map((r) => (
                <Marker key={r.id} position={[r.latitude, r.longitude]} icon={pinIcon(pinColor(r, colorMode), { temporary: true })}>
                  <Popup>
                    <div className="min-w-[180px]" style={{ color: '#202124' }}>
                      <p className="text-[11px] font-semibold" style={{ color: '#5F6368' }}>New · not saved yet</p>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs mt-1">Score: <b>{r.score}</b> ({levelOf(r.score)})</p>
                      <p className="text-xs">Main gap: {r.serviceGaps[0] || 'No major gaps'}</p>
                      <button
                        type="button"
                        onClick={() => saveNearby(r)}
                        disabled={savingId === r.id}
                        className="mt-2 text-xs font-semibold text-white rounded px-2.5 py-1"
                        style={{ background: '#0497F6' }}
                      >
                        {savingId === r.id ? 'Saving…' : 'Save'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-2 text-xs text-slate-500">
            {view === 'heat' ? (
              <span>Heatmap: brighter = more high-score leads</span>
            ) : Object.entries(legend).map(([key, v]) => (
              <span key={key} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: v.color }} /> {v.label}
              </span>
            ))}
            {nearby.length > 0 && <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400" /> Not saved yet</span>}
            <span className="sm:ml-auto">{onMap.length} of {visible.length} leads on the map</span>
          </div>
        </WhitePanel>

        <div className="space-y-6 min-w-0">
          {/* Top areas */}
          <WhitePanel as="div" className="h-fit">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Flame size={18} style={{ color: SCORE_COLORS.High.color }} /> Top areas
            </h3>
            <p className="text-xs text-slate-500 mt-1">Areas with the most High-priority leads. Click one to zoom in.</p>
            {topAreas.length ? (
              <ol className="mt-4 space-y-1">
                {topAreas.map((a, i) => (
                  <li key={`${a.area}-${a.city}`}>
                    <button
                      type="button"
                      disabled={!a.points.length}
                      onClick={() => { setView('pins'); setFocus({ points: a.points, id: Date.now() }) }}
                      title={a.points.length ? `Zoom to ${a.area}` : 'These leads have no map position'}
                      className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-inset disabled:hover:bg-transparent disabled:cursor-default ${FOCUS}`}
                    >
                      <span className="w-6 h-6 shrink-0 rounded-full bg-inset border border-line text-xs font-semibold text-slate-600 flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-800 truncate">{a.area}</span>
                        {a.city && a.city !== a.area && <span className="block text-xs text-slate-500 truncate">{a.city}</span>}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-sm font-bold" style={{ color: SCORE_COLORS.High.color }}>{a.high} high</span>
                        <span className="block text-[11px] text-slate-500">of {a.total} leads</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-slate-500 border border-dashed border-line rounded-lg p-4 text-center">
                No High-priority leads here yet.
              </p>
            )}
          </WhitePanel>

          {/* Route plan */}
          <WhitePanel as="div" className="h-fit">
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <Route size={18} className="text-aqua" aria-hidden="true" /> Route plan
              <span className="ml-auto text-xs font-medium text-slate-500">{routeStops.length} / {MAX_ROUTE_STOPS}</span>
            </h3>
            {routeStops.length ? (
              <>
                <ol className="mt-3 space-y-2">
                  {routeStops.map((l, i) => (
                    <li key={l.id} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-slate-700">{l.name}</span>
                      <button type="button" onClick={() => toggleRoute(l.id)} aria-label={`Remove ${l.name} from the route`} className={`p-1 rounded text-slate-400 hover:text-red-400 ${FOCUS}`}>
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                </ol>
                <a
                  href={googleRouteUrl(routeStops)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}
                >
                  <ExternalLink size={15} aria-hidden="true" /> Open route in Google Maps
                </a>
                <button type="button" onClick={() => setRoute([])} className={`mt-2 w-full text-xs text-slate-500 hover:text-slate-800 rounded ${FOCUS}`}>
                  Clear route
                </button>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">Open a pin and tick <b className="text-slate-700">Add to route</b> to plan visits (up to {MAX_ROUTE_STOPS} stops, in the order you add them).</p>
            )}
          </WhitePanel>
        </div>
      </div>

      {/* Leads without coordinates */}
      {offMap.length > 0 && (
        <WhitePanel as="div">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <MapPinOff size={18} className="text-slate-400" /> Not on map (no location)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            These leads were saved before locations were stored. Open a lead and use <b>Compare with nearby businesses</b> to add its location.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {offMap.map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-2.5">
                <span className="w-2.5 h-2.5 shrink-0 rounded-full" style={{ background: pinColor(l, colorMode) }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{l.name}</p>
                  <p className="text-xs text-slate-500 truncate">{l.address}</p>
                </div>
                <span className="text-xs text-slate-500 shrink-0">Score {l.score}</span>
                <Link to={`/lead/${l.id}`} className="text-xs font-semibold text-primary-600 hover:text-aqua shrink-0">View</Link>
              </li>
            ))}
          </ul>
        </WhitePanel>
      )}
    </div>
  )
}
