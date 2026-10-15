import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, MapPinned, History, X, SlidersHorizontal, List, Map as MapIcon, Bookmark, Download, Lightbulb, AlertCircle,
} from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'
import { useToast } from '@/hooks/useToast'
import { searchBusinesses, createLead, getLeads } from '@/services/leadService'
import { storage, STORAGE_KEYS } from '@/utils/storage'
import { exportLeadsToExcel } from '../utils/exportLeads'
import CityInput from '../components/discovery/CityInput'
import CategoryPicker from '../components/discovery/CategoryPicker'
import SearchProgress from '../components/discovery/SearchProgress'
import ResultsSummary from '../components/discovery/ResultsSummary'
import ResultFilters from '../components/discovery/ResultFilters'
import { applyFilters, DEFAULT_FILTERS } from '../utils/discoveryFilters'
import ResultCard from '../components/discovery/ResultCard'
import ScoreBreakdownModal from '../components/discovery/ScoreBreakdownModal'
import { FOCUS, INPUT, chip } from '../components/discovery/styles'

// The map (Leaflet) is only downloaded when the user opens the Map view
const ResultsMap = lazy(() => import('../components/discovery/ResultsMap'))

const RESULT_LIMITS = [20, 50, 100]
const MAX_RECENT = 5

/** Same business in search results and in My Leads -> same key (name + address). */
const keyOf = (name, address) => `${name}|${address && address !== '—' ? address : ''}`.trim().toLowerCase()
const resultKey = (r) => keyOf(r.name, r.raw?.address)

/** Turns any error into plain words (no technical text). */
function friendlyError(err) {
  const msg = err?.message || ''
  if (err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'We could not reach the server. It may be waking up — please try again in a minute.'
  }
  if (/limit/i.test(msg)) return "Today's search limit is reached. Please try again in a minute, or tomorrow."
  if (/city not found|not responding|please enter/i.test(msg)) return msg   // already friendly (from our backend)
  if (/\(5\d\d\)/.test(msg)) return 'The server is starting up or busy. Please try again in a minute.'
  return 'Something went wrong with the search. Please try again.'
}

export default function LeadDiscoveryPage() {
  const toast = useToast()
  const navigate = useNavigate()

  // ---- form ----
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [area, setArea] = useState('')
  const [limit, setLimit] = useState(50)
  const [recent, setRecent] = useState(() => {
    const list = storage.get(STORAGE_KEYS.recentSearches, [])
    return Array.isArray(list) ? list.slice(0, MAX_RECENT) : []
  })

  // ---- search ----
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)            // all progress steps ticked
  const [searchedFor, setSearchedFor] = useState(null)
  const [error, setError] = useState('')

  // ---- results view ----
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [sort, setSort] = useState('score')
  const [view, setView] = useState('list')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const [scoreFor, setScoreFor] = useState(null)

  // ---- saved leads: business key -> lead id (for the "Saved" chip) ----
  const [savedIds, setSavedIds] = useState({})
  const [savingId, setSavingId] = useState(null)
  const [bulkSaving, setBulkSaving] = useState(false)

  useEffect(() => {
    let active = true
    getLeads()
      .then((leads) => {
        if (!active) return
        const map = {}
        leads.forEach((l) => { map[keyOf(l.name, l.address)] = l.id })
        setSavedIds((prev) => ({ ...map, ...prev }))
      })
      .catch(() => { /* "Saved" chips are a bonus; search still works */ })
    return () => { active = false }
  }, [])

  const savedIdOf = useCallback((r) => savedIds[resultKey(r)], [savedIds])

  const canSearch = city.trim() && category.trim()

  async function runSearch(q) {
    const query = { city: q.city.trim(), category: q.category.trim(), area: (q.area || '').trim() }
    if (!query.city || !query.category) return
    setCity(query.city)
    setCategory(query.category)
    setArea(query.area)
    setLoading(true)
    setDone(false)
    setError('')
    setSearchedFor(query)
    setSelected(new Set())
    setFilters(DEFAULT_FILTERS)
    setSheetOpen(false)

    // Remember it (newest first, no duplicates, max 5)
    const same = (s) => ['city', 'category', 'area'].every((k) => (s[k] || '').toLowerCase() === query[k].toLowerCase())
    const nextRecent = [query, ...recent.filter((s) => !same(s))].slice(0, MAX_RECENT)
    setRecent(nextRecent)
    storage.set(STORAGE_KEYS.recentSearches, nextRecent)

    try {
      const found = await searchBusinesses(query.city, query.category, { area: query.area, limit })
      setDone(true)
      await new Promise((r) => setTimeout(r, 400))   // let the user see all steps ticked
      setResults(found)
    } catch (err) {
      setError(friendlyError(err))
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  function clearRecent() {
    setRecent([])
    storage.remove(STORAGE_KEYS.recentSearches)
  }

  // ---- saving ----
  const saveResult = useCallback(async (r, { quiet = false } = {}) => {
    const existing = savedIds[resultKey(r)]
    if (existing) return existing
    setSavingId(r.id)
    try {
      const saved = await createLead(r.raw)
      setSavedIds((prev) => ({ ...prev, [resultKey(r)]: saved.id }))
      if (!quiet) toast.success(`${r.name} saved to My Leads`)
      return saved.id
    } catch {
      if (!quiet) toast.error(`Could not save ${r.name}. Please try again.`)
      return null
    } finally {
      setSavingId(null)
    }
  }, [savedIds, toast])

  const writeMessage = useCallback(async (r) => {
    const id = await saveResult(r, { quiet: true })   // a message needs a saved lead
    if (id) navigate(`/outreach?leadId=${id}`)
    else toast.error('Could not open Write Message. Please try again.')
  }, [saveResult, navigate, toast])

  const toggleSelect = useCallback((id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const showScore = useCallback((r) => setScoreFor(r), [])
  const closeScore = useCallback(() => setScoreFor(null), [])

  // ---- filtered view ----
  const visible = useMemo(() => applyFilters(results, filters, sort), [results, filters, sort])
  const selectedResults = useMemo(() => results.filter((r) => selected.has(r.id)), [results, selected])
  const allVisibleSelected = visible.length > 0 && visible.every((r) => selected.has(r.id))

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev)
      visible.forEach((r) => (allVisibleSelected ? next.delete(r.id) : next.add(r.id)))
      return next
    })
  }

  async function saveSelected() {
    const toSave = selectedResults.filter((r) => !savedIdOf(r))
    if (!toSave.length) {
      toast.success('All selected businesses are already saved')
      return
    }
    setBulkSaving(true)
    let ok = 0
    for (const r of toSave) {
      if (await saveResult(r, { quiet: true })) ok += 1
    }
    setBulkSaving(false)
    if (ok === toSave.length) toast.success(`${ok} ${ok === 1 ? 'lead' : 'leads'} saved to My Leads`)
    else toast.error(`Saved ${ok} of ${toSave.length}. Please try the rest again.`)
  }

  function pickSummary(key) {
    setFilters({
      ...DEFAULT_FILTERS,
      ...(key === 'hot' && { priority: 'High' }),
      ...(key === 'noWebsite' && { website: 'no' }),
      ...(key === 'noPhone' && { phone: 'no' }),
    })
  }

  // Escape closes the mobile filter sheet
  useEffect(() => {
    if (!sheetOpen) return undefined
    const onKey = (e) => e.key === 'Escape' && setSheetOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sheetOpen])

  const isDemo = results.length > 0 && results[0].source === 'Demo'
  const sourceLabel = isDemo ? 'Demo data' : (results[0]?.source || 'Live data')
  const showResults = searchedFor && !loading && !error && results.length > 0
  const filterProps = { filters, setFilters, sort, setSort }

  return (
    <div className="space-y-6 min-w-0">
      {/* ---------- Search form ---------- */}
      <form
        onSubmit={(e) => { e.preventDefault(); runSearch({ city, category, area }) }}
        className="bg-card rounded-xl border border-slate-200 p-4 sm:p-5"
      >
        <h2 className="text-lg font-semibold text-slate-800">Find Leads</h2>
        <p className="text-sm text-slate-500">Pick a city and a business type. We find the businesses and score who needs your help most.</p>

        {recent.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 mr-1">
              <History size={13} aria-hidden="true" /> Recent
            </span>
            {recent.map((s) => (
              <button
                key={`${s.city}|${s.category}|${s.area || ''}`}
                type="button"
                disabled={loading}
                onClick={() => runSearch(s)}
                className={`${chip(false)} disabled:opacity-60`}
              >
                {s.category} in {s.area ? `${s.area}, ` : ''}{s.city}
              </button>
            ))}
            <button type="button" onClick={clearRecent} className={`text-xs font-medium text-slate-400 hover:text-slate-700 underline underline-offset-2 rounded ${FOCUS}`}>
              Clear
            </button>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CityInput value={city} onChange={setCity} />
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        <div className="mt-5 pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] gap-4 sm:items-end">
          <div>
            <label htmlFor="lead-area" className="block text-sm font-medium text-slate-700 mb-1.5">
              Area <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <div className="relative">
              <MapPinned className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                id="lead-area"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                maxLength={60}
                className={`${INPUT} pl-10 pr-4`}
                placeholder="e.g. Vijay Nagar"
              />
            </div>
          </div>
          <div>
            <label htmlFor="lead-limit" className="block text-sm font-medium text-slate-700 mb-1.5">Results</label>
            <select
              id="lead-limit"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full sm:w-28 px-3 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {RESULT_LIMITS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={loading || !canSearch}
              aria-describedby={!canSearch ? 'search-hint' : undefined}
              className={`w-full sm:w-auto px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-md flex items-center justify-center gap-2 motion-safe:transition-colors ${FOCUS}`}
            >
              <Search size={18} aria-hidden="true" />
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>
        {!canSearch && (
          <p id="search-hint" className="mt-2 text-xs text-slate-400 sm:text-right">Choose a city and a business type</p>
        )}
      </form>

      {/* ---------- While searching ---------- */}
      {loading && <SearchProgress key={`${searchedFor?.city}-${searchedFor?.category}`} city={searchedFor?.city} done={done} />}

      {/* ---------- Error ---------- */}
      {error && !loading && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <AlertCircle size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p>{error}</p>
            <button type="button" onClick={() => runSearch(searchedFor)} className={`mt-2 font-semibold text-red-200 underline underline-offset-2 rounded ${FOCUS}`}>
              Try again
            </button>
          </div>
        </div>
      )}

      {/* ---------- Before the first search ---------- */}
      {!searchedFor && !loading && (
        <div className="bg-card rounded-xl border border-dashed border-slate-300 p-8 sm:p-10 text-center text-sm text-slate-500">
          New here? Try <b className="text-slate-700">Indore</b> + <b className="text-slate-700">Restaurants</b> to see how it works.
        </div>
      )}

      {/* ---------- No results ---------- */}
      {searchedFor && !loading && !error && results.length === 0 && (
        <div className="bg-card rounded-xl border border-slate-200 p-8 text-center">
          <Lightbulb size={28} className="mx-auto text-marigold-500" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">
            No {searchedFor.category.toLowerCase()} found in {searchedFor.area ? `${searchedFor.area}, ` : ''}{searchedFor.city}
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Tip: try a bigger nearby city, a broader type (for example “Clinics” instead of a specialist){searchedFor.area ? ', or leave the Area box empty' : ''}.
          </p>
        </div>
      )}

      {/* ---------- Results ---------- */}
      {showResults && (
        <>
          {isDemo && (
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              Demo mode: showing sample businesses. Real results appear once a data source API key is added.
            </p>
          )}

          <ResultsSummary results={results} onPick={pickSummary} />

          <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-6 items-start">
            {/* Desktop filter panel */}
            <aside className="hidden lg:block bg-card rounded-xl border border-slate-200 p-4 sticky top-4" aria-label="Filters">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <SlidersHorizontal size={16} aria-hidden="true" /> Filters
              </h3>
              <ResultFilters {...filterProps} />
            </aside>

            <div className="min-w-0 space-y-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    className={`w-4 h-4 accent-primary-600 ${FOCUS}`}
                  />
                  Select all
                </label>
                <p className="text-sm text-slate-500">
                  {visible.length} of {results.length} shown · Source: {sourceLabel}
                </p>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className={`lg:hidden ${chip(false)}`}
                  >
                    <SlidersHorizontal size={14} aria-hidden="true" /> Filters
                  </button>
                  <div className="inline-flex rounded-full border border-line bg-inset p-0.5" role="group" aria-label="Results view">
                    {[['list', 'List', List], ['map', 'Map', MapIcon]].map(([v, label, Icon]) => (
                      <button
                        key={v}
                        type="button"
                        aria-pressed={view === v}
                        onClick={() => setView(v)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${FOCUS} ${
                          view === v ? 'bg-primary-600 text-white' : 'text-slate-600 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={14} aria-hidden="true" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="bg-card rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-500">
                  No businesses match these filters.{' '}
                  <button type="button" onClick={() => { setFilters(DEFAULT_FILTERS); setSort('score') }} className={`font-semibold text-aqua underline underline-offset-2 rounded ${FOCUS}`}>
                    Reset filters
                  </button>
                </div>
              ) : view === 'map' ? (
                <Suspense fallback={<PageLoader />}>
                  <ResultsMap results={visible} savedIdOf={savedIdOf} savingId={savingId} onSave={saveResult} />
                </Suspense>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                  {visible.map((r) => (
                    <ResultCard
                      key={r.id}
                      result={r}
                      savedId={savedIdOf(r)}
                      saving={savingId === r.id}
                      selected={selected.has(r.id)}
                      onToggleSelect={toggleSelect}
                      onSave={saveResult}
                      onWriteMessage={writeMessage}
                      onShowScore={showScore}
                    />
                  ))}
                </div>
              )}

              {/* Sticky bar for selected results */}
              {selectedResults.length > 0 && (
                <div className="sticky bottom-4 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-primary-600 bg-deepsea/95 backdrop-blur px-4 py-3 shadow-lg shadow-black/40">
                  <p className="text-sm font-semibold text-slate-800 mr-auto">{selectedResults.length} selected</p>
                  <button
                    type="button"
                    onClick={saveSelected}
                    disabled={bulkSaving}
                    className={`inline-flex items-center gap-1.5 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-60 px-3 py-1.5 text-sm font-semibold text-white ${FOCUS}`}
                  >
                    <Bookmark size={14} aria-hidden="true" /> {bulkSaving ? 'Saving…' : 'Save selected'}
                  </button>
                  <button
                    type="button"
                    onClick={() => exportLeadsToExcel(selectedResults)}
                    className={`inline-flex items-center gap-1.5 rounded-md border border-line bg-inset hover:bg-line px-3 py-1.5 text-sm font-medium text-slate-700 ${FOCUS}`}
                  >
                    <Download size={14} aria-hidden="true" /> Export selected to Excel
                  </button>
                  <button type="button" onClick={() => setSelected(new Set())} aria-label="Clear selection" className={`p-1.5 rounded-md text-slate-400 hover:text-slate-800 ${FOCUS}`}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ---------- Mobile filter sheet ---------- */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSheetOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Filters" className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-auto rounded-t-2xl border-t border-line bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal size={16} aria-hidden="true" /> Filters
              </h3>
              <button type="button" onClick={() => setSheetOpen(false)} aria-label="Close filters" className={`p-1.5 rounded-md text-slate-400 hover:text-slate-800 ${FOCUS}`}>
                <X size={20} />
              </button>
            </div>
            <ResultFilters {...filterProps} />
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className={`mt-6 w-full rounded-md bg-primary-600 hover:bg-primary-700 py-2.5 text-sm font-semibold text-white ${FOCUS}`}
            >
              Show {visible.length} {visible.length === 1 ? 'result' : 'results'}
            </button>
          </div>
        </div>
      )}

      {scoreFor && <ScoreBreakdownModal result={scoreFor} onClose={closeScore} />}
    </div>
  )
}
