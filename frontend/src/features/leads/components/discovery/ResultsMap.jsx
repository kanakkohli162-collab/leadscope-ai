import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MapPinOff } from 'lucide-react'
import { LEVEL_COLORS } from './styles'

const INDIA_CENTER = [22.5, 79]
const hasLocation = (r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude)

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

/**
 * Search results on an OpenStreetMap map. Pins: High = orange, Medium = blue, Low = grey.
 * Loaded only when the user opens the Map view (keeps the page fast).
 */
export default function ResultsMap({ results, savedIdOf, savingId, onSave }) {
  const onMap = useMemo(() => results.filter(hasLocation), [results])
  const offMap = useMemo(() => results.filter((r) => !hasLocation(r)), [results])
  const points = useMemo(() => onMap.map((r) => [r.latitude, r.longitude]), [onMap])

  return (
    <div className="space-y-4 min-w-0">
      <div className="bg-card rounded-xl border border-slate-200 p-2">
        <div className="relative isolate z-0 h-[380px] sm:h-[520px] w-full rounded-lg overflow-hidden">
          <MapContainer center={INDIA_CENTER} zoom={5} scrollWheelZoom className="h-full w-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FitToPins points={points} />
            {onMap.map((r) => {
              const savedId = savedIdOf(r)
              return (
                <CircleMarker
                  key={r.id}
                  center={[r.latitude, r.longitude]}
                  radius={9}
                  pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: LEVEL_COLORS[r.priority], fillOpacity: 0.95 }}
                >
                  <Popup>
                    <div className="min-w-[180px]" style={{ color: '#202124' }}>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs mt-1">
                        Score: <b style={{ color: r.priority === 'Low' ? '#5F6368' : LEVEL_COLORS[r.priority] }}>{r.score}</b> ({r.priority})
                      </p>
                      <p className="text-xs">Main gap: {r.serviceGaps[0] || 'No major gaps'}</p>
                      {savedId ? (
                        <Link to={`/lead/${savedId}`} className="inline-block mt-2 text-xs font-semibold" style={{ color: '#188038' }}>
                          Saved · View lead →
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSave(r)}
                          disabled={savingId === r.id}
                          className="mt-2 text-xs font-semibold text-white rounded px-2.5 py-1"
                          style={{ background: '#0497F6' }}
                        >
                          {savingId === r.id ? 'Saving…' : 'Save'}
                        </button>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 pt-2 text-xs text-slate-500">
          {Object.entries(LEVEL_COLORS).map(([level, color]) => (
            <span key={level} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} /> {level}
            </span>
          ))}
          <span className="sm:ml-auto">{onMap.length} of {results.length} on the map</span>
        </div>
      </div>

      {offMap.length > 0 && (
        <div className="bg-card rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <MapPinOff size={16} className="text-slate-400" aria-hidden="true" /> Not on the map ({offMap.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">These businesses have no map position.</p>
          <ul className="mt-3 divide-y divide-line">
            {offMap.map((r) => (
              <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-slate-700">{r.name}</span>
                <span className="shrink-0 text-xs font-semibold" style={{ color: LEVEL_COLORS[r.priority] }}>{r.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
