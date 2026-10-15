import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Globe, ListChecks, MessageCircle, AlertTriangle,
  Brain, CheckCircle
} from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { leads } from '@/mocks'
import { findLeadById } from '../utils/leadStats'
import LeadNotFound from '../components/LeadNotFound'

export default function AILeadAnalysisPage() {
  const { id } = useParams()
  const lead = findLeadById(leads, id)

  // Unknown id in the URL (e.g. /lead/999) → friendly message instead of a crash
  if (!lead) return <LeadNotFound id={id} />

  const analysisCards = [
    {
      title: 'Website Analysis',
      value: lead.websiteAnalysis,
      icon: Globe,
      status: lead.hasWebsite ? (lead.websiteAnalysis === 'Not Optimized' ? 'warning' : 'ok') : 'error',
    },
    {
      title: 'Listing Completeness',
      value: lead.listingCompleteness,
      icon: ListChecks,
      status: lead.listingCompleteness === 'Incomplete' ? 'warning' : 'ok',
    },
    {
      title: 'Review Sentiment',
      value: lead.reviewSentiment,
      icon: MessageCircle,
      status: lead.reviewSentiment.includes('Positive') ? 'ok' : 'warning',
    },
    {
      title: 'Service Gap Detection',
      value: lead.serviceGapDetected ? 'Yes' : 'No',
      icon: AlertTriangle,
      status: lead.serviceGapDetected ? 'error' : 'ok',
    },
  ]

  const statusStyles = {
    ok: 'bg-green-500/10 border-green-500/30 text-green-400',
    warning: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    error: 'bg-red-500/10 border-red-500/30 text-red-400',
  }

  return (
    <div className="space-y-6">
      <Link to={`/lead/${lead.id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
        <ArrowLeft size={16} /> Back to lead details
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-600/15 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">AI Lead Analysis</h1>
              <p className="text-sm text-slate-500">Detailed analysis of the lead using AI/NLP</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ScoreCircle score={lead.score} size="lg" />
            <PriorityBadge priority={lead.priority} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 p-3 bg-inset rounded-lg">
          <img src={lead.image} alt="" className="w-12 h-12 rounded-lg object-cover" />
          <div>
            <p className="font-semibold text-slate-800">{lead.name}</p>
            <p className="text-sm text-slate-500">{lead.category} • {lead.location}</p>
          </div>
        </div>
      </div>

      {/* Analysis Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analysisCards.map((card) => (
          <div
            key={card.title}
            className={`rounded-xl border p-5 ${statusStyles[card.status]}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon size={18} />
              <span className="text-sm font-medium">{card.title}</span>
            </div>
            <p className="text-lg font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* AI Generated Reason */}
      <div className="bg-card rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Brain size={18} className="text-primary-600" />
          AI Generated Reason
        </h3>
        <p className="text-slate-600 leading-relaxed">{lead.aiReason}</p>
      </div>

      {/* Recommended Action */}
      <div className="bg-primary-600/15 rounded-xl border border-primary-600/30 p-6">
        <h3 className="font-semibold text-aqua-light mb-2 flex items-center gap-2">
          <CheckCircle size={18} />
          Recommended Action
        </h3>
        <p className="text-aqua-light">{lead.recommendedAction}</p>
        <div className="mt-4">
          <Link
            to="/outreach"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
          >
            Generate Outreach Message
          </Link>
        </div>
      </div>
    </div>
  )
}
