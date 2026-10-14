import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, MapPin, Filter, X, Star, Globe, Plus, Check, AlertTriangle } from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { searchBusinesses, createLead } from '@/services/leadService'

const CATEGORY_SUGGESTIONS = [
  'Gynecologist', 'Dentist', 'Hospital', 'Restaurant', 'Gym', 'Salon',
  'Real Estate Agent', 'Coaching Institute', 'Cafe', 'Pharmacy',
]

export default function LeadDiscoveryPage() {
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ priority: '', hasWebsite: '' })
  // result id -> saved lead id (so the button turns into "Added")
  const [added, setAdded] = useState({})
  const [adding, setAdding] = useState(null)

  async function handleSearch(e) {
    e.preventDefault()
    if (!city.trim() || !category.trim()) {
      setError('Please enter a city and a business type.')
      return
    }
    setLoading(true)
    setError('')
    setAdded({})
    try {
      setResults(await searchBusinesses(city.trim(), category.trim()))
      setSearched(true)
    } catch (err) {
      setError(err.message)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  async function addToMyLeads(result) {
    setAdding(result.id)
    try {
      const saved = await createLead(result.raw)
      setAdded((prev) => ({ ...prev, [result.id]: saved.id }))
    } catch (err) {
      alert(err.message)
    } finally {
      setAdding(null)
    }
  }

  const visible = useMemo(() => results.filter((r) =>
    (!filters.priority || r.priority === filters.priority) &&
    (!filters.hasWebsite || (filters.hasWebsite === 'yes' ? r.hasWebsite : !r.hasWebsite))
  ), [results, filters])

  const isDemo = results.length > 0 && results[0].source === 'Demo'
  // Where the data came from: "Google", "Geoapify / OpenStreetMap" or "Demo"
  const sourceLabel = isDemo ? 'Demo data' : (results[0]?.source || 'Live data')

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800">Find Leads</h2>
        <p className="text-sm text-slate-500 mb-4">
          Enter a city and business type to find businesses that need digital services.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">City</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={60}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Noida, Lucknow..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Business type</label>
            <input
              type="text"
              list="category-suggestions"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={60}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Dentist, Restaurant..."
            />
            <datalist id="category-suggestions">
              {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Search size={18} />
              {loading ? 'Searching…' : 'Search'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Filter size={14} /> Filters:
          </div>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={filters.hasWebsite}
            onChange={(e) => setFilters({ ...filters, hasWebsite: e.target.value })}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Website</option>
            <option value="yes">Has website</option>
            <option value="no">No website</option>
          </select>
          <button
            type="button"
            onClick={() => setFilters({ priority: '', hasWebsite: '' })}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X size={12} /> Clear filters
          </button>
        </div>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isDemo && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Demo mode: showing sample businesses. Real results appear once a data source API key is added.
        </p>
      )}

      {searched && !loading && (
        <p className="text-sm text-slate-500">
          {visible.length} businesses found · Source: {sourceLabel} · sorted by best opportunity
        </p>
      )}

      {!searched && !loading && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          Try <b>Indore</b> + <b>Restaurant</b> to see how it works.
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map((r) => (
          <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
            <div className="flex items-start justify-between mb-3 gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm truncate">{r.name}</h3>
                <p className="text-xs text-slate-500">{r.category}</p>
              </div>
              <ScoreCircle score={r.score} size="sm" />
            </div>

            <div className="space-y-2 mb-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <MapPin size={12} /> <span className="truncate">{r.address}</span>
              </div>
              <div className="flex items-center gap-3">
                {/* Rating only when the data source has it (OpenStreetMap doesn't) */}
                {r.raw?.rating != null && (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Star size={12} fill="currentColor" /> {r.raw.rating} ({r.raw.reviewCount ?? 0} reviews)
                  </span>
                )}
                {r.hasWebsite ? (
                  <span className="flex items-center gap-1 text-green-600"><Globe size={12} /> Website</span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500"><Globe size={12} /> No website</span>
                )}
              </div>
            </div>

            {r.serviceGaps.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {r.serviceGaps.map((gap) => (
                  <span key={gap} className="inline-flex items-center gap-1 text-[11px] text-red-600 bg-red-50 rounded px-2 py-0.5">
                    <AlertTriangle size={10} /> {gap}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between">
              <PriorityBadge priority={r.priority} />
              {added[r.id] ? (
                <Link to={`/lead/${added[r.id]}`} className="inline-flex items-center gap-1 text-sm font-medium text-green-600">
                  <Check size={16} /> Added · View
                </Link>
              ) : (
                <button
                  onClick={() => addToMyLeads(r)}
                  disabled={adding === r.id}
                  className="inline-flex items-center gap-1 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 px-3 py-1.5 rounded-lg"
                >
                  <Plus size={14} /> {adding === r.id ? 'Adding…' : 'Add to My Leads'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}