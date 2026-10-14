import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Globe, Clock, Star,
  AlertTriangle, CheckCircle, Lightbulb, Save, Send
} from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import PageLoader from '@/components/ui/PageLoader'
import { updateLeadStatus, updateLeadNotes } from '@/services/leadService'
import { useLead } from '../hooks/useLeads'
import LeadNotFound from '../components/LeadNotFound'
import ReviewSentimentCard from '../components/ReviewSentimentCard'

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
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <img src={lead.image} alt={lead.name} className="w-full md:w-48 h-36 object-cover rounded-xl bg-slate-100" />
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
                <Globe size={16} className="text-slate-400" /> {lead.website || 'No website'}
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
                  className="border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Opportunities */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Opportunities
          </h3>
          {lead.serviceGaps.length === 0 ? (
            <p className="text-sm text-slate-500">No gaps detected yet.</p>
          ) : (
            <div className="space-y-2">
              {lead.serviceGaps.map((gap, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  <AlertTriangle size={14} /> {gap}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Why this lead + action */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              Why this lead?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{lead.aiReason}</p>
          </div>
          <div className="bg-primary-50 rounded-xl border border-primary-100 p-5">
            <h3 className="font-semibold text-primary-800 mb-2 flex items-center gap-2">
              <CheckCircle size={18} />
              Suggested Pitch
            </h3>
            <p className="text-sm text-primary-700">{lead.recommendedAction}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col">
          <h3 className="font-semibold text-slate-800 mb-3">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setSavedMsg('') }}
            rows={6}
            placeholder="e.g. Called on Monday, interested in a website, call back Friday"
            className="flex-1 w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={saveNotes}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium px-4 py-2 rounded-lg text-sm"
            >
              <Save size={16} /> {saving ? 'Saving…' : 'Save Notes'}
            </button>
            {savedMsg && <span className="text-sm text-green-600">{savedMsg}</span>}
          </div>
        </div>
      </div>

      {/* Review Sentiment (AI / NLP) */}
      <ReviewSentimentCard lead={lead} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to={`/outreach?leadId=${lead.id}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Send size={18} /> Write Message
        </Link>
      </div>
    </div>
  )
}


