import { useState } from 'react'
import { Link } from 'react-router-dom'
import { GripVertical, PenLine, Phone, MessageCircle, Clock, IndianRupee } from 'lucide-react'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { areaOf } from '@/features/leads/utils/leadArea'
import { toWhatsAppNumber } from '@/features/leads/utils/contactChannel'
import { formatINR } from '@/utils/format'
import { staleDays } from '../utils/pipelineStats'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const ACTION = `inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium border border-line bg-inset text-slate-600 hover:bg-line hover:text-slate-800 ${FOCUS}`
/** Deal value: shows "₹15,000" (click to edit) or "+ Add deal value". Enter / leaving the box saves, Escape cancels. */
function DealValue({ lead, onSave, onEditingChange }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')

  function start() {
    setText(lead.dealValue != null ? String(lead.dealValue) : '')
    setEditing(true)
    onEditingChange(true)
  }
  function stop(save) {
    setEditing(false)
    onEditingChange(false)
    if (!save) return
    const clean = text.replace(/[^\d]/g, '')
    const value = clean === '' ? null : Number(clean)
    if (value !== lead.dealValue) onSave(lead, value)
  }

  if (editing) {
    return (
      <label className="flex items-center gap-1 text-xs text-slate-500">
        <IndianRupee size={12} aria-hidden="true" />
        <span className="sr-only">Deal value in rupees for {lead.name}</span>
        <input
          autoFocus
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => stop(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); stop(true) }
            if (e.key === 'Escape') { e.preventDefault(); stop(false) }
          }}
          placeholder="15000"
          className="w-24 px-2 py-0.5 border border-primary-600 bg-inset rounded text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
      </label>
    )
  }
  return (
    <button
      type="button"
      onClick={start}
      title="Click to edit the deal value"
      className={`rounded text-xs font-semibold ${lead.dealValue != null ? 'text-green-300 hover:text-green-200' : 'text-slate-400 hover:text-slate-700'} ${FOCUS}`}
    >
      {lead.dealValue != null ? formatINR(lead.dealValue) : '+ Add deal value'}
    </button>
  )
}

export default function PipelineCard({ lead, statuses, saving, onMove, onDealValue, onDragStart, onDragEnd }) {
  const [editing, setEditing] = useState(false)
  const gap = lead.serviceGaps[0]
  const stale = staleDays(lead)
  const phone = lead.phone && lead.phone !== '—' ? lead.phone : null
  const whatsapp = toWhatsAppNumber(phone)

  return (
    <div
      draggable={!saving && !editing}
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      className={`group bg-card rounded-lg border border-line p-3 shadow-sm cursor-grab active:cursor-grabbing motion-safe:transition-opacity ${
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

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {stale && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-marigold-500/15 border border-marigold-500/40 text-marigold-400">
            <Clock size={11} aria-hidden="true" /> No update in {stale} days
          </span>
        )}
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

      <div className="mt-2.5">
        <DealValue lead={lead} onSave={onDealValue} onEditingChange={setEditing} />
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <Link to={`/outreach?leadId=${lead.id}`} className={ACTION}><PenLine size={12} aria-hidden="true" /> Write message</Link>
        {phone && (
          <a href={`tel:${phone.split(/[;,/]/)[0].replace(/[^\d+]/g, '')}`} className={ACTION}><Phone size={12} aria-hidden="true" /> Call</a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={ACTION}>
            <MessageCircle size={12} aria-hidden="true" /> WhatsApp
          </a>
        )}
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <label className="sr-only" htmlFor={`status-${lead.id}`}>Status of {lead.name}</label>
        <select
          id={`status-${lead.id}`}
          value={lead.status}
          disabled={saving}
          onChange={(e) => onMove(lead, e.target.value)}
          className="min-w-0 flex-1 px-2 py-1 border border-slate-300 bg-inset rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <Link to={`/lead/${lead.id}`} className={`shrink-0 text-xs font-semibold text-primary-600 hover:text-aqua rounded ${FOCUS}`}>
          View
        </Link>
      </div>
    </div>
  )
}
