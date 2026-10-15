import { useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { MapPinned, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { getCompetitors } from '@/services/leadService'

// Backend messages are already friendly; only network-type errors need rewording
function friendly(message = '') {
  if (/failed to fetch|networkerror|request failed/i.test(message)) {
    return "We couldn't reach LeadScope right now. Please check your connection and try again."
  }
  return message || 'Something went wrong. Please try again.'
}

function distanceText(m) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
}

export default function NearbyCompetitorsCard({ lead }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCompare() {
    setLoading(true)
    setError('')
    try {
      setResult(await getCompetitors(lead.id))
    } catch (e) {
      setResult(null)
      setError(friendly(e.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <WhitePanel bodyClassName="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <MapPinned size={18} className="text-aqua" />
            Nearby competitors
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            See how this business compares with similar businesses within 1 km. A strong point for your pitch.
          </p>
        </div>
        <button
          onClick={handleCompare}
          disabled={loading}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : result ? <RefreshCw size={16} /> : <MapPinned size={16} />}
          {loading ? 'Comparing…' : result ? 'Compare again' : 'Compare with nearby businesses'}
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Loading */}
      {loading && !result && (
        <div className="space-y-2" aria-hidden="true">
          <div className="h-4 w-3/4 rounded bg-inset animate-pulse" />
          <div className="h-3 w-full rounded-full bg-inset animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-inset animate-pulse" />
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-800 leading-relaxed">{result.insight}</p>

          {result.totalNearby > 0 ? (
            <>
              <div>
                <div className="flex h-3 rounded-full overflow-hidden bg-inset">
                  <div className="bg-emerald-500 transition-[width] duration-500" style={{ width: `${result.percentWithWebsite}%` }} />
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {result.percentWithWebsite}% of nearby businesses have a website ({result.withWebsite} of {result.totalNearby})
                </p>
              </div>

              <ul className="divide-y divide-line rounded-lg border border-line overflow-hidden">
                {result.nearby.map((b) => (
                  <li key={`${b.name}-${b.distanceMeters}`} className="flex items-center gap-3 px-3 py-2.5 bg-inset/40">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate">{b.name}</p>
                      <p className="text-xs text-slate-500">{distanceText(b.distanceMeters)} away</p>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${
                        b.hasWebsite
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {b.hasWebsite ? <CheckCircle size={12} /> : <XCircle size={12} />} Website
                    </span>
                  </li>
                ))}
              </ul>
              {result.totalNearby > result.nearby.length && (
                <p className="text-[11px] text-slate-500">Showing the {result.nearby.length} closest of {result.totalNearby}.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 border border-dashed border-line rounded-lg p-4 text-center">
              No similar businesses found within 1 km.
            </p>
          )}
          <p className="text-[11px] text-slate-500">Map data © OpenStreetMap contributors (via Geoapify).</p>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <p className="text-sm text-slate-500 border border-dashed border-line rounded-lg p-4 text-center">
          Press <b>Compare with nearby businesses</b> to see who else is close by and who has a website.
        </p>
      )}
    </WhitePanel>
  )
}
