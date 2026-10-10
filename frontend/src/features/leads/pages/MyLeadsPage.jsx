import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MoreHorizontal, Search } from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import StatusBadge from '@/components/ui/StatusBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { leads } from '@/mocks'
import { countBy, matchesSearch } from '../utils/leadStats'

const statuses = ['All', 'New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Not Interested']

// Counts per status never change for static data → compute once, outside the component
const statusCounts = { All: leads.length, ...countBy(leads, 'status') }

export default function MyLeadsPage() {
  const [activeStatus, setActiveStatus] = useState('All')
  const [search, setSearch] = useState('')

  // useDeferredValue lets typing stay instant; the 50-row filter runs right after
  const deferredSearch = useDeferredValue(search)

  // useMemo → only re-filter when the tab or search text actually changes
  const filtered = useMemo(
    () => leads.filter((l) =>
      (activeStatus === 'All' || l.status === activeStatus) && matchesSearch(l, deferredSearch)),
    [activeStatus, deferredSearch],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and track all your leads</p>
        </div>
        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors">
          <Plus size={18} />
          Add Lead
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {status} ({statusCounts[status] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Business Name</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Location</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Score</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Last Contacted</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link to={`/lead/${lead.id}`} className="font-medium text-slate-800 hover:text-primary-600">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{lead.location}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <ScoreCircle score={lead.score} size="sm" />
                      <PriorityBadge priority={lead.priority} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{lead.lastContacted}</td>
                  <td className="px-5 py-3.5">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
