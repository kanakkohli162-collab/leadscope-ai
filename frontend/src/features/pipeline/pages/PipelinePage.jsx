import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, KanbanSquare, Flame, Wallet, Trophy, TrendingUp, ArrowRight } from 'lucide-react'
import PageLoader from '@/components/ui/PageLoader'
import { updateLeadStatus, updateDealValue } from '@/services/leadService'
import { useToast } from '@/hooks/useToast'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { formatINR } from '@/utils/format'
import PipelineCard from '../components/PipelineCard'
import { COLUMNS, STATUSES, OPEN_STATUSES, sumDeals, conversionRates } from '../utils/pipelineStats'

/**
 * Pipeline (Synopsis 8.11 CRM and lead tracking): a Kanban board of the user's leads.
 * Drag a card to another column, or use its status dropdown (mobile / keyboard),
 * to change the lead's status. The change shows at once and is undone if saving fails.
 * Phones (< 768px) see one column at a time, picked with tabs.
 */

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'

export default function PipelinePage() {
  const { leads, setLeads, loading, error } = useLeads()
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [highOnly, setHighOnly] = useState(false)
  const [city, setCity] = useState('All')
  const [tab, setTab] = useState(STATUSES[0])   // column shown on phones
  const [dragging, setDragging] = useState(null) // lead id being dragged
  const [over, setOver] = useState(null)         // column status under the pointer
  const [saving, setSaving] = useState({})       // { [leadId]: true } while the API call runs

  const cities = useMemo(
    () => [...new Set(leads.map((l) => l.location).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [leads],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((l) =>
      (!q || l.name.toLowerCase().includes(q)) &&
      (!highOnly || l.priority === 'High') &&
      (city === 'All' || l.location === city))
  }, [leads, query, highOnly, city])

  const byStatus = useMemo(() => {
    const groups = Object.fromEntries(STATUSES.map((s) => [s, []]))
    visible.forEach((l) => (groups[l.status] || groups.New).push(l))
    Object.values(groups).forEach((g) => g.sort((a, b) => b.score - a.score))
    return groups
  }, [visible])

  const pipelineValue = useMemo(() => sumDeals(visible.filter((l) => OPEN_STATUSES.includes(l.status))), [visible])
  const wonValue = useMemo(() => sumDeals(byStatus.Converted), [byStatus])
  const rates = useMemo(() => conversionRates(visible), [visible])
  const filtered = query.trim() || highOnly || city !== 'All'

  const finishSaving = (id) => setSaving((s) => {
    const next = { ...s }
    delete next[id]
    return next
  })

  /** Optimistic move: update the board now, save in the background, undo on failure. */
  async function move(lead, status) {
    if (!lead || lead.status === status || saving[lead.id]) return
    const previous = lead
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, status, updatedAt: new Date().toISOString() } : l)))
    setSaving((s) => ({ ...s, [lead.id]: true }))
    try {
      const saved = await updateLeadStatus(lead.id, status)
      setLeads((all) => all.map((l) => (l.id === lead.id ? saved : l)))
      if (status === 'Converted') toast.success(`🎉 Client won! ${lead.name} is now Converted.`)
    } catch {
      setLeads((all) => all.map((l) => (l.id === lead.id ? previous : l)))
      toast.error(`Couldn't move ${lead.name} to ${status}. Please try again.`)
    } finally {
      finishSaving(lead.id)
    }
  }

  /** Optimistic deal value change, undone if saving fails. */
  async function changeDealValue(lead, dealValue) {
    const previous = lead
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, dealValue } : l)))
    setSaving((s) => ({ ...s, [lead.id]: true }))
    try {
      const saved = await updateDealValue(lead.id, dealValue)
      setLeads((all) => all.map((l) => (l.id === lead.id ? saved : l)))
    } catch (e) {
      setLeads((all) => all.map((l) => (l.id === lead.id ? previous : l)))
      toast.error(e.message || `Couldn't save the deal value for ${lead.name}. Please try again.`)
    } finally {
      finishSaving(lead.id)
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
    <div className="space-y-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1">Drag leads to update their status.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:ml-auto">
          <div className="rounded-xl border border-line bg-card px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><Wallet size={13} className="text-aqua" aria-hidden="true" /> Pipeline value</p>
            <p className="font-display text-lg font-bold text-slate-800">{formatINR(pipelineValue)}</p>
          </div>
          <div className="rounded-xl border border-line bg-card px-4 py-2.5">
            <p className="flex items-center gap-1.5 text-xs text-slate-500"><Trophy size={13} className="text-green-400" aria-hidden="true" /> Won value</p>
            <p className="font-display text-lg font-bold text-green-300">{formatINR(wonValue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <div className="relative sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            aria-label="Search leads by name"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={highOnly}
            onClick={() => setHighOnly((h) => !h)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border ${FOCUS} ${
              highOnly ? 'bg-marigold-500 border-marigold-500 text-abyss' : 'bg-inset border-line text-slate-600 hover:bg-line'
            }`}
          >
            <Flame size={14} aria-hidden="true" /> High only
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            City
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="px-3 py-2 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              <option value="All">All cities</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {filtered && (
            <button
              type="button"
              onClick={() => { setQuery(''); setHighOnly(false); setCity('All') }}
              className={`text-sm font-medium text-aqua hover:text-aqua-light rounded ${FOCUS}`}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered && visible.length === 0 && (
        <p className="text-sm text-slate-500">No leads match these filters.</p>
      )}

      {/* Phone tabs: one column at a time */}
      <div className="md:hidden -mx-1 px-1 overflow-x-auto" role="tablist" aria-label="Pipeline columns">
        <div className="flex gap-2 w-max pb-1">
          {COLUMNS.map(({ status, accent }) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={tab === status}
              onClick={() => setTab(status)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${FOCUS} ${
                tab === status ? 'bg-primary-600 border-primary-600 text-white' : 'bg-inset border-line text-slate-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: accent }} aria-hidden="true" />
              {status}
              <span className={tab === status ? 'text-white/80' : 'text-slate-400'}>{byStatus[status].length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Board: on desktop it scrolls sideways inside its own box; its height fits the cards (the page scrolls) */}
      <div className="md:overflow-x-auto pb-2 md:-mx-1 md:px-1">
        <div className="flex gap-4 md:min-w-max">
          {COLUMNS.map(({ status, accent }) => {
            const cards = byStatus[status]
            const isOver = over === status
            const total = sumDeals(cards)
            return (
              <section
                key={status}
                aria-label={`${status}: ${cards.length} leads`}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== status) setOver(status) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null) }}
                onDrop={(e) => handleDrop(e, status)}
                className={`${tab === status ? 'flex' : 'hidden'} md:flex w-full md:w-72 shrink-0 flex-col rounded-xl border bg-inset/60 motion-safe:transition-colors ${
                  isOver ? 'border-primary-600 bg-primary-600/10' : 'border-line'
                }`}
                style={{ borderTop: `3px solid ${accent}` }}
              >
                <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-800">{status}</h2>
                    <p className="text-[11px] text-slate-500">{total ? formatINR(total) : 'No deal value'}</p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-card border border-line text-slate-600">
                    {cards.length}
                  </span>
                </header>
                <div className="flex-1 space-y-2.5 px-2.5 pb-3 min-h-[96px]">
                  {cards.map((lead) => (
                    <PipelineCard
                      key={lead.id}
                      lead={lead}
                      statuses={STATUSES}
                      saving={Boolean(saving[lead.id])}
                      onMove={move}
                      onDealValue={changeDealValue}
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

      {/* Conversion rates */}
      <section className="bg-card rounded-xl border border-slate-200 p-4 sm:p-5" aria-labelledby="conversion-title">
        <h2 id="conversion-title" className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp size={16} className="text-aqua" aria-hidden="true" /> Conversion rates
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Of the leads that reached a step, how many moved on to the next one.</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {rates.map((r) => (
            <div key={r.from} className="rounded-lg border border-line bg-inset px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                {r.from} <ArrowRight size={12} aria-hidden="true" /> {r.to}
              </p>
              <p className="font-display text-2xl font-bold text-slate-800">{r.pct == null ? '—' : `${r.pct}%`}</p>
              <p className="text-[11px] text-slate-400">{r.of} leads</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
