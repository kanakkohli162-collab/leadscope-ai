import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'

export default function LeadNotFound({ id }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
      <SearchX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h2 className="text-lg font-semibold text-slate-800">Lead not found</h2>
      <p className="text-sm text-slate-500 mt-1">No lead exists with id &quot;{id}&quot;.</p>
      <Link to="/my-leads" className="inline-block mt-4 text-sm font-medium text-primary-600 hover:text-primary-700">
        Back to My Leads
      </Link>
    </div>
  )
}
