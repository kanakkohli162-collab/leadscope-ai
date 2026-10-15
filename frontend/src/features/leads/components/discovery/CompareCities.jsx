import { useState } from 'react'
import { Scale, Trophy, Loader2, X, AlertCircle } from 'lucide-react'
import { searchBusinesses } from '@/services/leadService'
import CityInput from './CityInput'
import { FOCUS } from './styles'
import { friendlySearchError } from '../../utils/searchErrors'

const COMPARE_LIMIT = 20   // small, to save the daily API quota

function statsOf(results) {
  const total = results.length
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0)
  const hot = results.filter((r) => r.score >= 70).length
  return {
    total,
    hot,
    hotPct: pct(hot),
    noWebsitePct: pct(results.filter((r) => !r.hasWebsite).length),
    noPhonePct: pct(results.filter((r) => !r.raw?.phone).length),
  }
}

/** Better market = bigger share of hot leads; if equal, more businesses without a website. */
function betterOf(a, b) {
  if (!a || !b || (!a.total && !b.total)) return null
  if (a.hotPct !== b.hotPct) return a.hotPct > b.hotPct ? 0 : 1
  if (a.noWebsitePct !== b.noWebsitePct) return a.noWebsitePct > b.noWebsitePct ? 0 : 1
  return null
}

/**
 * Compare cities: the same business type in two cities (20 results each),
 * side by side, with a "Better market" label.
 */
export default function CompareCities({ category, initialCity, onClose }) {
  const [cities, setCities] = useState([initialCity || '', ''])
  const [loading, setLoading] = useState(false)
  const [columns, setColumns] = useState(null)   // [{ city, stats } | { city, error }] x2

  const type = category.trim()
  const ready = type && cities[0].trim() && cities[1].trim() && cities[0].trim().toLowerCase() !== cities[1].trim().toLowerCase()

  async function compare(e) {
    e.preventDefault()
    if (!ready) return
    setLoading(true)
    setColumns(null)
    const names = cities.map((c) => c.trim())
    const answers = await Promise.allSettled(names.map((c) => searchBusinesses(c, type, { limit: COMPARE_LIMIT })))
    setColumns(answers.map((a, i) => (a.status === 'fulfilled'
      ? { city: names[i], stats: statsOf(a.value.results) }
      : { city: names[i], error: friendlySearchError(a.reason) })))
    setLoading(false)
  }

  const better = columns ? betterOf(columns[0].stats, columns[1].stats) : null

  return (
    <section className="bg-card rounded-xl border border-primary-600/50 p-4 sm:p-5" aria-labelledby="compare-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 id="compare-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Scale size={18} className="text-aqua" aria-hidden="true" /> Compare cities
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {type ? <>Compare <b className="text-slate-700">{type}</b> in two cities (top {COMPARE_LIMIT} each, to save your daily searches).</>
              : 'Choose a business type above first.'}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close compare cities" className={`p-1.5 rounded-md text-slate-400 hover:text-slate-800 ${FOCUS}`}>
          <X size={18} />
        </button>
      </div>

      <form onSubmit={compare} className="mt-4 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 md:items-end">
        {[0, 1].map((i) => (
          <CityInput
            key={i}
            label={`City ${i + 1}`}
            showPopular={false}
            value={cities[i]}
            onChange={(v) => setCities((c) => c.map((old, j) => (j === i ? v : old)))}
          />
        ))}
        <button
          type="submit"
          disabled={!ready || loading}
          className={`px-5 py-2.5 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold inline-flex items-center justify-center gap-2 ${FOCUS}`}
        >
          {loading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Scale size={16} aria-hidden="true" />}
          {loading ? 'Comparing…' : 'Compare'}
        </button>
      </form>

      {loading && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-live="polite">
          <p className="sr-only">Comparing cities…</p>
          {[0, 1].map((i) => <div key={i} className="h-44 rounded-xl bg-inset motion-safe:animate-pulse" aria-hidden="true" />)}
        </div>
      )}

      {columns && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4" aria-live="polite">
          {columns.map((col, i) => (
            <div key={col.city} className={`rounded-xl border p-4 ${better === i ? 'border-marigold-500 bg-marigold-500/10' : 'border-line bg-inset'}`}>
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-slate-800 truncate">{col.city}</h4>
                {better === i && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-marigold-500 px-2.5 py-0.5 text-xs font-bold text-abyss">
                    <Trophy size={12} aria-hidden="true" /> Better market
                  </span>
                )}
              </div>
              {col.error ? (
                <p className="mt-3 flex items-start gap-2 text-sm text-red-300"><AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {col.error}</p>
              ) : col.stats.total === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No {type.toLowerCase()} found here.</p>
              ) : (
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Businesses found', col.stats.total],
                    ['Hot leads (70+)', col.stats.hot],
                    ['Without website', `${col.stats.noWebsitePct}%`],
                    ['Without phone', `${col.stats.noPhonePct}%`],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-slate-500">{label}</dt>
                      <dd className="font-display text-xl font-bold text-slate-800">{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
          {better === null && columns.every((c) => c.stats?.total) && (
            <p className="sm:col-span-2 text-xs text-slate-500">Both cities look about the same for {type.toLowerCase()}.</p>
          )}
        </div>
      )}
    </section>
  )
}
