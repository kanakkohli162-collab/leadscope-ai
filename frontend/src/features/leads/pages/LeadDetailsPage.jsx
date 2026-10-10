import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Phone, Globe, Clock, Star,
  AlertTriangle, CheckCircle, Lightbulb, Brain
} from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { leads } from '@/mocks'
import { findLeadById } from '../utils/leadStats'
import LeadNotFound from '../components/LeadNotFound'

export default function LeadDetailsPage() {
  const { id } = useParams()
  const lead = findLeadById(leads, id)

  // Unknown id in the URL (e.g. /lead/999) → friendly message instead of a crash
  if (!lead) return <LeadNotFound id={id} />

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/lead-discovery" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to results
      </Link>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <img
            src={lead.image}
            alt={lead.name}
            className="w-full md:w-48 h-36 object-cover rounded-xl"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{lead.name}</h1>
                <p className="text-slate-500 mt-0.5">{lead.category} • {lead.location}</p>
              </div>
              <div className="flex items-center gap-3">
                <ScoreCircle score={lead.score} size="lg" />
                <PriorityBadge priority={lead.priority} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin size={16} className="text-slate-400" />
                {lead.address}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={16} className="text-slate-400" />
                {lead.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe size={16} className="text-slate-400" />
                {lead.website || 'No website'}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={16} className="text-slate-400" />
                {lead.hours}
              </div>
              <div className="flex items-center gap-2 text-sm text-amber-500">
                <Star size={16} fill="currentColor" />
                {lead.rating} ({lead.reviews} reviews)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Business Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Address</span>
              <span className="text-slate-800 text-right max-w-[60%]">{lead.address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Phone</span>
              <span className="text-slate-800">{lead.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Website</span>
              <span className="text-slate-800">{lead.website || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hours</span>
              <span className="text-slate-800">{lead.hours}</span>
            </div>
          </div>
        </div>

        {/* Service Gaps */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            Detected Service Gaps
          </h3>
          <div className="space-y-2">
            {lead.serviceGaps.map((gap, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertTriangle size={14} />
                {gap}
              </div>
            ))}
          </div>
        </div>

        {/* Why Important + Action */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" />
              Why this lead is important
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">{lead.aiReason}</p>
          </div>
          <div className="bg-primary-50 rounded-xl border border-primary-100 p-5">
            <h3 className="font-semibold text-primary-800 mb-2 flex items-center gap-2">
              <CheckCircle size={18} />
              Recommended Action
            </h3>
            <p className="text-sm text-primary-700">{lead.recommendedAction}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to={`/ai-analysis/${lead.id}`}
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Brain size={18} />
          View AI Analysis
        </Link>
        <Link
          to="/outreach"
          className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          Generate Outreach
        </Link>
      </div>
    </div>
  )
}
