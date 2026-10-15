import { useState } from 'react'
import { Contact, Loader2, RefreshCw, Mail, MessageCircle, Send } from 'lucide-react'
import { enrichLead } from '@/services/leadService'
import SocialIcons from './SocialIcons'
import { bestChannel, toWhatsAppNumber } from '../utils/contactChannel'

const PRESENCE_STYLE = {
  Strong: 'bg-green-500/15 border-green-500/40 text-green-300',
  Weak: 'bg-marigold-500/15 border-marigold-500/40 text-marigold-400',
  None: 'bg-red-500/10 border-red-500/40 text-red-300',
}

function friendly(err) {
  if (err instanceof TypeError || /failed to fetch|networkerror/i.test(err?.message || '')) {
    return "We couldn't reach LeadScope right now. Please check your connection and try again."
  }
  return err?.message || 'Something went wrong. Please try again.'
}

/**
 * Contact & social: email, social profiles and WhatsApp found on the business's own website,
 * the social presence label and the best way to contact them.
 */
export default function ContactSocialCard({ lead, onLeadChange }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const best = bestChannel(lead)
  const whatsappLink = lead.whatsappUrl || (toWhatsAppNumber(lead.phone) ? `https://wa.me/${toWhatsAppNumber(lead.phone)}` : null)

  async function findContacts() {
    setLoading(true)
    setError('')
    try {
      const res = await enrichLead(lead.id)
      onLeadChange(res.lead)
    } catch (e) {
      setError(friendly(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Contact size={18} className="text-aqua" aria-hidden="true" />
            Contact &amp; social
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Only what the business shows publicly on its own website.
          </p>
        </div>
        {lead.website && (
          <button
            type="button"
            onClick={findContacts}
            disabled={loading}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2.5 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua"
          >
            {loading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" />
              : lead.enrichedAt ? <RefreshCw size={16} aria-hidden="true" /> : <Contact size={16} aria-hidden="true" />}
            {loading ? 'Reading website…' : lead.enrichedAt ? 'Check again' : 'Find contacts'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400" role="alert">{error}</p>}

      {!lead.website && (
        <p className="text-sm text-slate-500">This business has no website, so there is nothing to read contacts from.</p>
      )}

      {lead.website && !lead.enrichedAt && !loading && !error && (
        <p className="text-sm text-slate-500">Click <b className="text-slate-700">Find contacts</b> to look for an email, social profiles and WhatsApp on their website.</p>
      )}

      {lead.enrichedAt && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Email</p>
              {lead.emails.length ? (
                <ul className="space-y-1">
                  {lead.emails.map((email) => (
                    <li key={email}>
                      <a href={`mailto:${email}`} className="inline-flex items-center gap-1.5 text-sm text-aqua hover:text-aqua-light break-all">
                        <Mail size={14} className="shrink-0" aria-hidden="true" /> {email}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No email shown on their website</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Social profiles</p>
              <div className="flex flex-wrap items-center gap-3">
                <SocialIcons lead={lead} size={15} />
                {lead.socialPresence && (
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${PRESENCE_STYLE[lead.socialPresence] || PRESENCE_STYLE.None}`}>
                    {lead.socialPresence} social presence
                  </span>
                )}
              </div>
            </div>
            {whatsappLink && (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-green-400 hover:text-green-300"
              >
                <MessageCircle size={15} aria-hidden="true" /> Open WhatsApp chat
              </a>
            )}
          </div>

          <div className="rounded-xl border border-primary-600/30 bg-primary-600/10 p-4 h-fit">
            <p className="text-xs font-semibold uppercase tracking-wide text-aqua-light flex items-center gap-1.5">
              <Send size={13} aria-hidden="true" /> Best way to contact
            </p>
            <p className="mt-1.5 text-lg font-bold text-slate-800">{best.channel}</p>
            <p className="text-sm text-slate-600 mt-0.5">{best.reason}</p>
            <p className="text-[11px] text-slate-400 mt-3">Checked {new Date(lead.enrichedAt).toLocaleDateString('en-IN')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
