import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Globe, Clock, Star,
  AlertTriangle, CheckCircle, Lightbulb, Save, Send
} from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import WhitePanel from '@/components/ui/WhitePanel'
import PageLoader from '@/components/ui/PageLoader'
import { updateLeadStatus, updateLeadNotes } from '@/services/leadService'
import { useLead } from '../hooks/useLeads'
import LeadNotFound from '../components/LeadNotFound'
import ReviewSentimentCard from '../components/ReviewSentimentCard'
import NearbyCompetitorsCard from '../components/NearbyCompetitorsCard'
import ContactSocialCard from '../components/ContactSocialCard'

const statuses = ['New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Not Interested']

export default function LeadDetailsPage() {
  const { id } = useParams()
  const { lead, setLead, loading, error } = useLead(id)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  // When the lead arrives from the backend, put its notes in the text box
  useEffect(() => { if (lead) setNotes(lead.notes) }, [lead])

  if (loading) return <PageLoader />
  if (error || !lead) return <LeadNotFound id={id} />

  async function changeStatus(status) {
    try {
      setLead(await updateLeadStatus(lead.id, status))
    } catch (e) {
      alert(e.message)
    }
  }

  async function saveNotes() {
    setSaving(true)
    setSavedMsg('')
    try {
      setLead(await updateLeadNotes(lead.id, notes))
      setSavedMsg('Notes saved')
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/my-leads" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to My Leads
      </Link>

      {/* Header Card */}
      <WhitePanel>
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <img src={lead.image} alt={lead.name} className="w-full md:w-48 h-36 object-cover rounded-xl bg-inset" />
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{lead.name}</h1>
                <p className="text-slate-500 mt-0.5">{lead.category} • {lead.location}</p>
                <p className="text-xs text-slate-400 mt-1">Source: {lead.source} · Updated {lead.lastContacted}</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreCircle score={lead.score} size="lg" />
                <PriorityBadge priority={lead.priority} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" /> {lead.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" /> {lead.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{lead.website || 'No website'}</span>
                {lead.website && (
                  <Link
                    to={`/website-checker?url=${encodeURIComponent(lead.website)}&leadId=${lead.id}`}
                    className="shrink-0 text-xs font-medium text-primary-600 hover:text-aqua border border-line rounded-full px-2.5 py-0.5"
                  >
                    Check website
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={16} className="text-slate-400" /> {lead.hours}
              </div>
              {lead.rating > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-500">
                  <Star size={16} fill="currentColor" /> {lead.rating} ({lead.reviews} reviews)
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="text-slate-500">Status:</span>
                <select
                  value={lead.status}
                  onChange={(e) => changeStatus(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </WhitePanel>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunities */}
        <WhitePanel>
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Opportunities
          </h3>
          {lead.serviceGaps.length === 0 ? (
            <p className="text-sm text-slate-500">No gaps detected yet.</p>
          ) : (
            <div className="space-y-2">
              {lead.serviceGaps.map((gap, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} /> {gap}
                </div>
              ))}
            </div>
          )}
        </WhitePanel>

        {/* Why this lead + action */}
        <div className="space-y-4">
          <WhitePanel>
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              Why this lead?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{lead.aiReason}</p>
            <div className="mt-4 rounded-xl border border-primary-600/30 bg-primary-600/10 p-4">
              <h3 className="font-semibold text-aqua-light mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                Suggested Pitch
              </h3>
              <p className="text-sm text-slate-700">{lead.recommendedAction}</p>
            </div>
          </WhitePanel>
        </div>
        <WhitePanel bodyClassName="flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-3">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSavedMsg('') }}
            rows={6}
            placeholder="e.g. Called on Monday, interested in a website, call back Friday"
            className="flex-1 w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={saveNotes}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-md text-sm"
            >
              <Save size={16} /> {saving ? 'Saving…' : 'Save Notes'}
            </button>
            {savedMsg && <span className="text-sm text-green-400">{savedMsg}</span>}
          </div>
        </WhitePanel>
      </div>

      {/* Contact & social (from the business's own website) */}
      <ContactSocialCard lead={lead} onLeadChange={setLead} />

      {/* Review Sentiment (AI / NLP) */}
      <ReviewSentimentCard lead={lead} />

      {/* Nearby competitors (Geoapify, within 1 km) */}
      <NearbyCompetitorsCard lead={lead} />

      {/* Actions */}
      <WhitePanel as="div" bodyClassName="flex flex-wrap items-center gap-3 !py-4">
        <Link
          to={`/outreach?leadId=${lead.id}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
        >
          <Send size={18} /> Write Message
        </Link>
      </WhitePanel>
    </div>
  )
}


