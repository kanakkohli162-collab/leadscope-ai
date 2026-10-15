import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Globe, Phone, Star, AlertTriangle, Bookmark, BookmarkCheck, ScanSearch, PenLine, MessageCircle, Loader2, Target, Contact } from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { FOCUS } from './styles'
import { toWhatsAppNumber } from '../../utils/contactChannel'
import SocialIcons from '../SocialIcons'

const ACTION = `inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium border border-line bg-inset text-slate-700 hover:bg-line hover:text-slate-800 disabled:opacity-60 ${FOCUS}`

/**
 * One search result: details, gaps, score (opens "Why this score?") and quick actions.
 * `savedLead` = the same business in My Leads (or undefined), used for "Saved", "Find contacts" and social icons.
 */
function ResultCard({
  result: r, savedLead, goodFit, saving, enriching, selected,
  onToggleSelect, onSave, onWriteMessage, onShowScore, onFindContacts,
}) {
  const savedId = savedLead?.id
  const phone = r.raw?.phone || null
  const whatsapp = toWhatsAppNumber(phone)
  const checkerUrl = `/website-checker?url=${encodeURIComponent(r.website || '')}${savedId ? `&leadId=${savedId}` : ''}`

  return (
    <div className={`bg-card rounded-xl border p-4 sm:p-5 flex flex-col min-w-0 ${selected ? 'border-primary-600 ring-1 ring-primary-600' : 'border-slate-200'}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(r.id)}
          aria-label={`Select ${r.name}`}
          className={`mt-1 w-4 h-4 shrink-0 accent-primary-600 cursor-pointer ${FOCUS}`}
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800 text-sm leading-snug break-words">{r.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {r.category && <span className="text-xs text-slate-500">{r.category}</span>}
            {savedId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/40 px-2 py-0.5 text-[11px] font-semibold text-green-300">
                <BookmarkCheck size={11} aria-hidden="true" /> Saved
              </span>
            )}
            {goodFit && (
              <span className="inline-flex items-center gap-1 rounded-full bg-marigold-500/15 border border-marigold-500/40 px-2 py-0.5 text-[11px] font-semibold text-marigold-400">
                <Target size={11} aria-hidden="true" /> Good fit for your service
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onShowScore(r)}
          className={`shrink-0 rounded-full flex flex-col items-center gap-0.5 ${FOCUS}`}
          aria-label={`Score ${r.score}. Why this score?`}
          title="Why this score?"
        >
          <ScoreCircle score={r.score} size="sm" />
          <span className="text-[10px] font-medium text-aqua underline decoration-dotted underline-offset-2">Why?</span>
        </button>
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <p className="flex items-start gap-2 text-slate-500">
          <MapPin size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> <span className="line-clamp-2 break-words">{r.address}</span>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {/* Rating only when the data source has it (OpenStreetMap doesn't) */}
          {r.raw?.rating != null && (
            <span className="flex items-center gap-1 text-amber-500">
              <Star size={12} fill="currentColor" aria-hidden="true" /> {r.raw.rating} ({r.raw.reviewCount ?? 0} reviews)
            </span>
          )}
          <span className={`flex items-center gap-1 ${r.hasWebsite ? 'text-green-400' : 'text-red-400'}`}>
            <Globe size={12} aria-hidden="true" /> {r.hasWebsite ? 'Website' : 'No website'}
          </span>
          <span className={`flex items-center gap-1 ${phone ? 'text-green-400' : 'text-red-400'}`}>
            <Phone size={12} aria-hidden="true" /> {phone ? 'Phone' : 'No phone'}
          </span>
        </div>
      </div>

      {r.serviceGaps.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {r.serviceGaps.map((gap) => (
            <span key={gap} className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-500/10 rounded px-2 py-0.5">
              <AlertTriangle size={10} aria-hidden="true" /> {gap}
            </span>
          ))}
        </div>
      )}

      {savedLead?.enrichedAt && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <SocialIcons lead={savedLead} size={13} />
          {savedLead.emails.length > 0 && (
            <a href={`mailto:${savedLead.emails[0]}`} className={`text-[11px] text-aqua hover:text-aqua-light truncate max-w-full rounded ${FOCUS}`}>
              {savedLead.emails[0]}
            </a>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
        <PriorityBadge priority={r.priority} />
        {savedId ? (
          <Link to={`/lead/${savedId}`} className={`text-xs font-semibold text-green-400 hover:text-green-300 rounded ${FOCUS}`}>
            View lead →
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onSave(r)}
            disabled={saving}
            className={`inline-flex items-center gap-1 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-60 px-3 py-1.5 rounded-md ${FOCUS}`}
          >
            {saving ? <Loader2 size={13} className="motion-safe:animate-spin" aria-hidden="true" /> : <Bookmark size={13} aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {r.hasWebsite && (
          <Link to={checkerUrl} className={ACTION}><ScanSearch size={13} aria-hidden="true" /> Check website</Link>
        )}
        {savedId && r.hasWebsite && (
          <button type="button" onClick={() => onFindContacts(savedLead)} disabled={enriching} className={ACTION}>
            {enriching ? <Loader2 size={13} className="motion-safe:animate-spin" aria-hidden="true" /> : <Contact size={13} aria-hidden="true" />}
            {enriching ? 'Finding…' : savedLead.enrichedAt ? 'Find contacts again' : 'Find contacts'}
          </button>
        )}
        <button type="button" onClick={() => onWriteMessage(r)} disabled={saving} className={ACTION}>
          <PenLine size={13} aria-hidden="true" /> Write message
        </button>
        {phone && (
          <a href={`tel:${phone.split(/[;,/]/)[0].replace(/[^\d+]/g, '')}`} className={ACTION}>
            <Phone size={13} aria-hidden="true" /> Call
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={ACTION}>
            <MessageCircle size={13} aria-hidden="true" /> WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}

export default memo(ResultCard)
