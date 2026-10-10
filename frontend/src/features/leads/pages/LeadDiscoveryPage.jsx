import { useState } from 'react'
import { Search, MapPin, Filter, X } from 'lucide-react'
import { leads } from '@/mocks'
import LeadCard from '../components/LeadCard'

export default function LeadDiscoveryPage() {
  const [location, setLocation] = useState('Noida')
  const [category, setCategory] = useState('Gynecologist')
  const [results, setResults] = useState(leads)
  const [filters, setFilters] = useState({
    rating: '',
    reviews: '',
    hasWebsite: '',
    priority: '',
  })

  const handleSearch = () => {
    let filtered = [...leads]
    if (location) {
      filtered = filtered.filter(l => l.location.toLowerCase().includes(location.toLowerCase()))
    }
    if (category) {
      filtered = filtered.filter(l => l.category.toLowerCase().includes(category.toLowerCase()))
    }
    if (filters.priority) {
      filtered = filtered.filter(l => l.priority === filters.priority)
    }
    if (filters.hasWebsite === 'yes') {
      filtered = filtered.filter(l => l.hasWebsite)
    } else if (filters.hasWebsite === 'no') {
      filtered = filtered.filter(l => !l.hasWebsite)
    }
    setResults(filtered)
  }

  const clearFilters = () => {
    setFilters({ rating: '', reviews: '', hasWebsite: '', priority: '' })
    setResults(leads)
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Find verified business leads</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Noida, Delhi..."
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option>Gynecologist</option>
              <option>Cardiologist</option>
              <option>Dental Clinic</option>
              <option>Hospital</option>
              <option>Pharmacy</option>
              <option>Diagnostic Lab</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Search size={18} />
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Filter size={14} />
            Filters:
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
            <option value="">Has Website</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <X size={12} /> Clear All
          </button>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">{results.length} results found</p>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((lead) => (
          <LeadCard key={lead.id} lead={lead} />
        ))}
      </div>
    </div>
  )
}
