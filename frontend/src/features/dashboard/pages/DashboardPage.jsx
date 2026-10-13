import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, AlertTriangle, Globe, Star, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '@/components/ui/StatCard'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import PageLoader from '@/components/ui/PageLoader'
import { getDashboardSummary } from '@/services/leadService'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { getCurrentUser } from '@/utils/currentUser'

export default function DashboardPage() {
  const user = getCurrentUser()
  const firstName = (user.name || '').split(' ')[0] || 'there'

  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const { leads } = useLeads()

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch((e) => setError(e.message))
  }, [])

  // { Noida: 2, Delhi: 1 }  ->  [{ name: 'Noida', value: 2 }, ...]
  const locationData = useMemo(
    () => Object.entries(summary?.leadsByCity || {}).map(([name, value]) => ({ name: name || 'Unknown', value })),
    [summary],
  )
  // Newest 5 leads (highest id = added most recently)
  const recentLeads = useMemo(() => [...leads].sort((a, b) => b.id - a.id).slice(0, 5), [leads])

  if (error) return <p className="text-red-600">{error}</p>
  if (!summary) return <PageLoader />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {firstName}! 👋</h1>
        <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your leads.</p>
      </div>

      {summary.totalLeads === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <h2 className="text-lg font-semibold text-slate-800">No leads yet</h2>
          <p className="text-sm text-slate-500 mt-1">Search a city and business type to find your first leads.</p>
          <Link to="/lead-discovery" className="inline-block mt-4 bg-primary-600 hover:bg-primary-700 text-white font-medium px-5 py-2.5 rounded-lg">
            Find your first leads →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Leads" value={summary.totalLeads} icon={Users} color="blue" />
            <StatCard title="High Priority" value={summary.highPriority} icon={AlertTriangle} color="red" />
            <StatCard title="No Website" value={summary.noWebsite} icon={Globe} color="amber" />
            <StatCard title="Low Ratings (below 3.5★)" value={summary.lowRatings} icon={Star} color="purple" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-base font-semibold text-slate-800 mb-4">Leads by City</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={locationData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
                  <Bar dataKey="value" name="Leads" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-800">Recent Leads</h3>
                <Link to="/my-leads" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {recentLeads.map((lead) => (
                  <Link key={lead.id} to={`/lead/${lead.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <ScoreCircle score={lead.score} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500">{lead.location}</p>
                    </div>
                    <PriorityBadge priority={lead.priority} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}