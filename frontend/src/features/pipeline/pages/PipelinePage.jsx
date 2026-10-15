import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, KanbanSquare, GripVertical } from 'lucide-react'
import ScoreCircle from '@/components/ui/ScoreCircle'
import PageLoader from '@/components/ui/PageLoader'
import { updateLeadStatus } from '@/services/leadService'
import { useToast } from '@/hooks/useToast'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { areaOf } from '@/features/leads/utils/leadArea'

/**
 * Pipeline (Synopsis 8.11 CRM and lead tracking): a Kanban board of the user's leads.
 * Drag a card to another column, or use its status dropdown (mobile / keyboard),
 * to change the lead's status. The change shows at once and is undone if saving fails.
 */

// Same statuses as Lead Details (leadService maps them to the backend values)
const COLUMNS = [
  { status: 'New', accent: '#4EB9E5' },
  { status: 'Contacted', accent: '#0497F6' },
  { status: 'Follow-up', accent: '#A78BFA' },
  { status: 'Interested', accent: '#F5A524' },
  { status: 'Converted', accent: '#34D399' },
  { status: 'Not Interested', accent: '#8A9BAD' },
]
const STATUSES = COLUMNS.map((c) => c.status)

function LeadCard({ lead, saving, onMove, onDragStart, onDragEnd }) {
  const gap = lead.serviceGaps[0]
  return (
    <div
      draggable={!saving}
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      className={`group bg-card rounded-lg border border-line p-3 shadow-sm cursor-grab active:cursor-grabbing transition-opacity ${
        saving ? 'opacity-60' : 'hover:border-primary-600'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <ScoreCircle score={lead.score} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate" title={lead.name}>{lead.name}</p>
          <p className="text-xs text-slate-500 truncate">{areaOf(lead)}</p>
        </div>
        <GripVertical size={16} className="shrink-0 text-slate-400 opacity-0 group-hover:opacity-100" aria-hidden="true" />
      </div>

      <div className="mt-2.5">
        {gap ? (
          <span className="inline-block max-w-full truncate text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400">
            {gap}
          </span>
        ) : (
          <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-inset border border-line text-slate-500">
            No major gaps
          </span>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <label className="sr-only" htmlFor={`status-${lead.id}`}>Status of {lead.name}</label>
        <select
          id={`status-${lead.id}`}
          value={lead.status}
          disabled={saving}
          onChange={(e) => onMove(lead, e.target.value)}
          className="min-w-0 flex-1 px-2 py-1 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Link to={`/lead/${lead.id}`} className="shrink-0 text-xs font-semibold text-primary-600 hover:text-aqua">
          View
        </Link>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { leads, setLeads, loading, error } = useLeads()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [dragging, setDragging] = useState(null) // lead id being dragged
  const [over, setOver] = useState(null)         // column status under the pointer
  const [saving, setSaving] = useState({})       // { [leadId]: true } while the API call runs

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? leads.filter((l) => l.name.toLowerCase().includes(q)) : leads
  }, [leads, query])

  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(STATUSES.map((s) => [s, []]))
    visible.forEach((l) => (groups[l.status] || groups.New).push(l))
    Object.values(groups).forEach((g) => g.sort((a, b) => b.score - a.score))
    return groups
  }, [visible])

  /** Optimistic move: update the board now, save in the background, undo on failure. */
  async function move(lead, status) {
    if (!lead || lead.status === status || saving[lead.id]) return
    const previous = lead.status
    const setStatus = (s) => setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, status: s } : l)))

    setStatus(status)
    setSaving((s) => ({ ...s, [lead.id]: true }))
    try {
      await updateLeadStatus(lead.id, status)
    } catch {
      setStatus(previous)
      toast.error(`Couldn't move ${lead.name} to ${status}. Please try again.`)
    } finally {
      setSaving((s) => {
        const next = { ...s }
        delete next[lead.id]
        return next
      })
    }
  }

  function handleDragStart(e, lead) {
    e.dataTransfer.setData('text/plain', String(lead.id))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(lead.id)
  }

  function handleDragEnd() {
    setDragging(null)
    setOver(null)
  }

  function handleDrop(e, status) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragging
    setOver(null)
    setDragging(null)
    move(leads.find((l) => String(l.id) === String(id)), status)
  }

  if (loading) return <PageLoader />

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-slate-200 p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Couldn&apos;t load your leads</h2>
        <p className="text-sm text-slate-500 mt-1">Please refresh the page and try again.</p>
      </div>
    )
  }

  if (!leads.length) {
    return (
      <div className="bg-card rounded-xl border border-slate-200 p-10 text-center">
        <KanbanSquare size={32} className="mx-auto text-aqua" />
        <h2 className="mt-3 text-lg font-semibold text-slate-800">Your pipeline is empty</h2>
        <p className="text-sm text-slate-500 mt-1">Save some leads first, then track them here from New to Converted.</p>
        <Link to="/lead-discovery" className="inline-block mt-4 bg-primary-600 text-white font-medium px-5 py-2.5 rounded-md">
          Find Leads →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Drag a lead to another column, or change its status on the card.</p>
        </div>
        <div className="relative sm:ml-auto sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search leads by name"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>
      </div>

      {query && visible.length === 0 && (
        <p className="text-sm text-slate-500">No leads match “{query}”.</p>
      )}

      {/* Board: scrolls sideways inside its own box, so the page never gets wider than the screen */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div className="flex gap-4 min-w-max">
          {COLUMNS.map(({ status, accent }) => {
            const cards = byStatus[status]
            const isOver = over === status
            return (
              <section
                key={status}
                aria-label={`${status}: ${cards.length} leads`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== status) setOver(status) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null) }}
                onDrop={(e) => handleDrop(e, status)}
                className={`w-72 shrink-0 flex flex-col rounded-xl border bg-inset/60 transition-colors ${
                  isOver ? 'border-primary-600 bg-primary-600/10' : 'border-line'
                }`}
                style={{ borderTop: `3px solid ${accent}` }}
              >
                <header className="flex items-center justify-between px-3 py-2.5">
                  <h2 className="text-sm font-semibold text-slate-800">{status}</h2>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-card border border-line text-slate-600">
                    {cards.length}
                  </span>
                </header>
                <div className="flex-1 space-y-2.5 px-2.5 pb-3 min-h-[120px] max-h-[65vh] overflow-y-auto">
                  {cards.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      saving={Boolean(saving[lead.id])}
                      onMove={move}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    />
                  ))}
                  {cards.length === 0 && (
                    <p className={`text-xs text-center py-6 rounded-lg border border-dashed ${isOver ? 'border-primary-600 text-slate-600' : 'border-line text-slate-500'}`}>
                      {dragging ? 'Drop here' : 'No leads'}
                    </p>
                  )}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
