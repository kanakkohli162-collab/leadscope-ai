import { Link } from 'react-router-dom'
import { Users, AlertTriangle, Globe, Star, ArrowRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '@/components/ui/StatCard'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { leads, weeklyChanges } from '@/mocks'
import { getCurrentUser } from '@/services/authService'
import { getFirstName } from '@/utils/format'
import { countBy, getDashboardStats, toChartData } from '@/features/leads/utils/leadStats'

// Computed ONCE when this file loads (the mock data never changes), not on every render.
const dashboardStats = getDashboardStats(leads)
const locationData = toChartData(countBy(leads, 'location'))
// "Recent" = the 5 most recently contacted leads
const recentLeads = [...leads].sort((a, b) => a.lastContactedDays - b.lastContactedDays).slice(0, 5)

export default function DashboardPage() {
  const user = getCurrentUser()

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Welcome back, {getFirstName(user.name)}! 👋</h1>
        <p className="text-slate-500 mt-1">Here&apos;s what&apos;s happening with your leads.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={dashboardStats.totalLeads}
          change={weeklyChanges.total}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="High Priority"
          value={dashboardStats.highPriority}
          change={weeklyChanges.highPriority}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Need Website"
          value={dashboardStats.needWebsite}
          change={weeklyChanges.needWebsite}
          icon={Globe}
          color="amber"
        />
        <StatCard
          title="Poor Reviews"
          value={dashboardStats.poorReviews}
          change={weeklyChanges.poorReviews}
          icon={Star}
          color="purple"
        />
      </div>

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Leads by Location */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-base font-semibold text-slate-800 mb-4">Leads by Location</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={locationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Leads */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-800">Recent Leads</h3>
            <Link to="/my-leads" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentLeads.map((lead) => (
              <Link
                key={lead.id}
                to={`/lead/${lead.id}`}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
              >
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
    </div>
  )
}
