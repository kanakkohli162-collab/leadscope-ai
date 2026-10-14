import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Trash2, FileSpreadsheet, FileText } from 'lucide-react'
import { exportLeadsToExcel, exportLeadsToPdf } from '../utils/exportLeads'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { updateLeadStatus, deleteLead } from '@/services/leadService'
import { countBy, matchesSearch } from '../utils/leadStats'
import { useLeads } from '../hooks/useLeads'

const statuses = ['All', 'New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Not Interested']

export default function MyLeadsPage() {
  const { leads, setLeads, loading, error } = useLeads()
  const [activeStatus, setActiveStatus] = useState('All')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const statusCounts = useMemo(() => ({ All: leads.length, ...countBy(leads, 'status') }), [leads])

  const filtered = useMemo(
    () => leads.filter((l) =>
      (activeStatus === 'All' || l.status === activeStatus) && matchesSearch(l, deferredSearch)),
    [leads, activeStatus, deferredSearch],
  )

  async function changeStatus(id, status) {
    try {
      const updated = await updateLeadStatus(id, status)
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
    } catch (e) {
      alert(e.message)
    }
  }

  async function removeLead(id) {
    if (!window.confirm('Delete this lead?')) return
    try {
      await deleteLead(id)
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Leads</h1>
          <p className="text-sm text-slate-500 mt-1">Track and update the leads you've saved</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Export: exports the leads currently shown (respects tab + search) */}
          {filtered.length > 0 && (
            <>
              <button
                onClick={() => exportLeadsToExcel(filtered)}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <FileSpreadsheet size={18} className="text-green-600" />
                Export Excel
              </button>
              <button
                onClick={() => exportLeadsToPdf(filtered)}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium px-4 py-2.5 rounded-lg transition-colors"
              >
                <FileText size={18} className="text-red-500" />
                Export PDF
              </button>
            </>
          )}
          <Link
            to="/lead-discovery"
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={18} />
            Find Leads
          </Link>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((status) => (
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
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Last Updated</th>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-500">Loading your leads…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-red-600">{error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No leads yet. <Link to="/lead-discovery" className="text-primary-600 font-medium">Find your first leads →</Link>
                  </td>
                </tr>
              )}
              {!loading && !error && filtered.map((lead) => (
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
                    <select
                      value={lead.status}
                      onChange={(e) => changeStatus(lead.id, e.target.value)}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {statuses.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{lead.lastContacted}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => removeLead(lead.id)}
                      title="Delete lead"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
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