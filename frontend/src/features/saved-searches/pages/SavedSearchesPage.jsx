import { Search, Play, Trash2, MoreHorizontal } from 'lucide-react'
import { savedSearches } from '@/mocks'
import { Link } from 'react-router-dom'

export default function SavedSearchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Saved Searches</h1>
          <p className="text-sm text-slate-500 mt-1">Quickly access your frequently used search criteria</p>
        </div>
        <Link
          to="/lead-discovery"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
        >
          <Search size={16} />
          New Search
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {savedSearches.map((search) => (
          <div
            key={search.id}
            className="bg-white rounded-xl border border-slate-200 p-5 card-hover"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Search size={18} className="text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{search.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Last used: {search.lastUsed}</p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <MoreHorizontal size={16} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                📍 {search.location}
              </span>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                🏷️ {search.category}
              </span>
            </div>

            <div className="flex gap-2">
              <Link
                to="/lead-discovery"
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                <Play size={14} />
                Run Search
              </Link>
              <button className="px-3 py-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
