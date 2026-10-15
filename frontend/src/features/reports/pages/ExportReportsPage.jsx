import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileSpreadsheet, FileText, Search } from 'lucide-react'
import WhitePanel from '@/components/ui/WhitePanel'
import PageLoader from '@/components/ui/PageLoader'
import PriorityBadge from '@/components/ui/PriorityBadge'
import { useToast } from '@/hooks/useToast'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { exportLeadsToExcel, exportLeadsToPdf } from '@/features/leads/utils/exportLeads'

const PRIORITIES = ['All', 'High', 'Medium', 'Low']
const STATUSES = ['All', 'New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Not Interested']
const PREVIEW_ROWS = 8
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const SELECT = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600'

/**
 * Reports & Export: filter the saved leads by city, priority and status, then download Excel or PDF
 * (same export code as My Leads).
 */
export default function ExportReportsPage() {
  const { leads, loading, error } = useLeads()
  const toast = useToast()
  const [city, setCity] = useState('All')
  const [priority, setPriority] = useState('All')
  const [status, setStatus] = useState('All')

  const cities = useMemo(() => [...new Set(leads.map((l) => l.location).filter(Boolean))].sort(), [leads])
  const filtered = useMemo(() => leads
    .filter((l) => (city === 'All' || l.location === city) && (priority === 'All' || l.priority === priority) && (status === 'All' || l.status === status))
    .sort((a, b) => b.score - a.score), [leads, city, priority, status])

  function exportAs(kind) {
    if (!filtered.length) return
    if (kind === 'excel') exportLeadsToExcel(filtered)
    else exportLeadsToPdf(filtered)
    toast.success(`${kind === 'excel' ? 'Excel' : 'PDF'} report with ${filtered.length} ${filtered.length === 1 ? 'lead' : 'leads'} is ready.`)
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Download size={22} className="text-aqua" aria-hidden="true" /> Reports &amp; Export</h1>
        <p className="text-sm text-slate-500 mt-1">Download your leads as an Excel sheet or a PDF report.</p>
      </div>

      {error ? (
        <WhitePanel as="div" bodyClassName="text-center"><p className="text-sm text-red-400">Couldn&apos;t load your leads. Please refresh the page.</p></WhitePanel>
      ) : !leads.length ? (
        <WhitePanel as="div" bodyClassName="text-center !p-8 sm:!p-10">
          <h2 className="text-lg font-semibold text-slate-800">Nothing to export yet</h2>
          <p className="text-sm text-slate-500 mt-1">Save some leads first, then come back to download them.</p>
          <Link to="/lead-discovery" className="inline-flex items-center gap-2 mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-md">
            <Search size={16} aria-hidden="true" /> Find Leads
          </Link>
        </WhitePanel>
      ) : (
        <>
          <WhitePanel title="Choose leads" subtitle="Only the leads that match these filters are exported.">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">City</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className={SELECT}>
                  <option value="All">All cities</option>
                  {cities.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">Priority</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={SELECT}>
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p === 'All' ? 'All priorities' : p}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={SELECT}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All statuses' : s}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => exportAs('excel')} disabled={!filtered.length}
                className={`inline-flex items-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}>
                <FileSpreadsheet size={17} aria-hidden="true" /> Download Excel
              </button>
              <button type="button" onClick={() => exportAs('pdf')} disabled={!filtered.length}
                className={`inline-flex items-center gap-2 rounded-md border border-line bg-inset hover:bg-line disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-slate-700 ${FOCUS}`}>
                <FileText size={17} className="text-red-400" aria-hidden="true" /> Download PDF
              </button>
              <p className="text-sm text-slate-500">
                <b className="text-slate-800">{filtered.length}</b> of {leads.length} leads selected
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-500">Excel opens in Excel or Google Sheets. PDF opens a printable report: choose “Save as PDF”.</p>
          </WhitePanel>

          <WhitePanel title="Preview" subtitle={filtered.length > PREVIEW_ROWS ? `First ${PREVIEW_ROWS} of ${filtered.length}, highest score first` : 'Highest score first'}>
            {filtered.length ? (
              <div className="overflow-x-auto -mx-1 px-1">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-line">
                      <th className="py-2 pr-3 font-semibold">Business</th>
                      <th className="py-2 pr-3 font-semibold">City</th>
                      <th className="py-2 pr-3 font-semibold">Score</th>
                      <th className="py-2 pr-3 font-semibold">Priority</th>
                      <th className="py-2 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {filtered.slice(0, PREVIEW_ROWS).map((l) => (
                      <tr key={l.id}>
                        <td className="py-2.5 pr-3"><Link to={`/lead/${l.id}`} className={`font-medium text-slate-800 hover:text-aqua rounded ${FOCUS}`}>{l.name}</Link></td>
                        <td className="py-2.5 pr-3 text-slate-600">{l.location || '—'}</td>
                        <td className="py-2.5 pr-3 font-semibold text-slate-800">{l.score}</td>
                        <td className="py-2.5 pr-3"><PriorityBadge priority={l.priority} /></td>
                        <td className="py-2.5 text-slate-600">{l.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No leads match these filters.</p>
            )}
          </WhitePanel>
        </>
      )}
    </div>
  )
}
