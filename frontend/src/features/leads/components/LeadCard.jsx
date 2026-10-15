import { memo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Star, Globe } from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'

/**
 * One result card on the Lead Discovery page.
 * memo → when the filters change, cards whose `lead` didn't change are not re-rendered.
 */
function LeadCard({ lead }) {
  return (
    <div className="bg-card rounded-xl border border-slate-200 p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center text-primary-600 font-bold text-sm">
            {lead.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{lead.name}</h3>
            <p className="text-xs text-slate-500">{lead.category}</p>
          </div>
        </div>
        <ScoreCircle score={lead.score} size="sm" />
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin size={12} />
          {lead.location}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-amber-500">
            <Star size={12} fill="currentColor" />
            {lead.rating} ({lead.reviews} reviews)
          </span>
          {lead.hasWebsite ? (
            <span className="flex items-center gap-1 text-green-400">
              <Globe size={12} /> Website
            </span>
          ) : (
            <span className="flex items-center gap-1 text-red-400">
              <Globe size={12} /> No website
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <PriorityBadge priority={lead.priority} />
        <Link
          to={`/lead/${lead.id}`}
          className="text-sm font-medium text-primary-600 hover:text-aqua"
        >
          View Details →
        </Link>
      </div>
    </div>
  )
}

export default memo(LeadCard)
