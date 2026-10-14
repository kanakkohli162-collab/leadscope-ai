import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Flame, Globe, Trophy, Search, ArrowRight, MapPin } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import PageLoader from '@/components/ui/PageLoader'
import { getDashboardSummary } from '@/services/leadService'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { getCurrentUser } from '@/utils/currentUser'

// Pipeline stages in order, with the colour of each segment
const PIPELINE = [
  { status: 'New', color: 'bg-primary-200' },
  { status: 'Contacted', color: 'bg-primary-400' },
  { status: 'Follow-up', color: 'bg-primary-600' },
  { status: 'Interested', color: 'bg-[#FF5CD2]' },
  { status: 'Converted', color: 'bg-emerald-500' },
  { status: 'Not Interested', color: 'bg-slate-300' },
]

function StatTile({ icon: Icon, label, value, hint, tone }) {
  const tones = {
    violet: 'bg-primary-50 text-primary-600',
    marigold: 'bg-marigold-50 text-marigold-600',
    rose: 'bg-rose-50 text-rose-500',
    emerald: 'bg-emerald-50 text-emerald-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-primary-100/70 p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tones[tone]}`}>
        <Icon size={20} />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  )
}

export default function DashboardPage() {
  const user = getCurrentUser() || {}
  const firstName = (user.name || '').split(' ')[0] || 'there'
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const { leads } = useLeads()

  useEffect(() => {
    getDashboardSummary().then(setSummary).catch((e) => setError(e.message))
  }, [])

  // { Indore: 4, Noida: 2 } -> [{ name: 'Indore', value: 4 }, ...]
  const cityData = useMemo(
    () => Object.entries(summary?.leadsByCity || {})
      .map(([name, value]) => ({ name: name || 'Unknown', value }))
      .sort((a, b) => b.value - a.value),
    [summary],
  )

  // Hottest 5 leads (highest score first)
  const hottest = useMemo(() => [...leads].sort((a, b) => b.score - a.score).slice(0, 5), [leads])

  // How many leads are in each pipeline stage
  const pipeline = useMemo(
    () => PIPELINE.map((p) => ({ ...p, count: leads.filter((l) => l.status === p.status).length })),
    [leads],
  )

  if (error) return <p className="text-rose-600">{error}</p>
  if (!summary) return <PageLoader />

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{today}</p>
          <h1 className="font-display text-3xl font-bold text-ink mt-1">Good to see you, {firstName}</h1>
          <p className="text-slate-500 mt-1">Here is where your leads stand today.</p>
        </div>
        <Link
          to="/lead-discovery"
          className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm shadow-primary-600/30 transition-colors"
        >
          <Search size={17} /> Find new leads
        </Link>
      </div>

      {summary.totalLeads === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-primary-100/70 p-10 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
            <MapPin size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mt-4">Your pipeline is empty</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Search a city and a business type. LeadScope scores every business and shows which ones need your services most.
          </p>
          <Link
            to="/lead-discovery"
            className="inline-flex items-center gap-2 mt-5 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-xl"
          >
            <Search size={17} /> Find your first leads
          </Link>
        </div>
      ) : (
        <>
          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile icon={Users} tone="violet" label="Total leads" value={summary.totalLeads} hint="Saved in My Leads" />
            <StatTile icon={Flame} tone="marigold" label="Hot leads" value={summary.highPriority} hint="Score 70 or more" />
            <StatTile icon={Globe} tone="rose" label="No website" value={summary.noWebsite} hint="Ready for a website pitch" />
            <StatTile icon={Trophy} tone="emerald" label="Converted" value={summary.won} hint="Became clients" />
          </div>

          {/* Pipeline bar */}
          <div className="bg-white rounded-2xl border border-primary-100/70 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink">Pipeline</h3>
              <Link to="/my-leads" className="text-sm text-primary-600 hover:text-primary-700 font-semibold inline-flex items-center gap-1">
                Manage leads <ArrowRight size={15} />
              </Link>
            </div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-mist">
              {pipeline.filter((p) => p.count > 0).map((p) => (
                <div
                  key={p.status}
                  className={p.color}
                  style={{ width: `${(p.count / leads.length) * 100}%` }}
                  title={`${p.status}: ${p.count}`}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {pipeline.map((p) => (
                <div key={p.status} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <span className="text-xs text-slate-500">{p.status}</span>
                  <span className="ml-auto text-sm font-semibold text-ink">{p.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Chart */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-primary-100/70 p-5">
              <h3 className="font-display text-lg font-bold text-ink">Leads by city</h3>
              <p className="text-xs text-slate-500 mb-4">Where your saved leads are located</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cityData} barCategoryGap="30%">
                  <CartesianGrid vertical={false} stroke="#F0E3FB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#715A86' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#715A86' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: '#FAF4FF' }}
                    contentStyle={{ borderRadius: 12, border: '1px solid #F0E3FB', fontSize: 13 }}
                  />
                  <Bar dataKey="value" name="Leads" fill="#B526E8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hottest leads */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-primary-100/70 p-5">
              <h3 className="font-display text-lg font-bold text-ink">Hottest leads</h3>
              <p className="text-xs text-slate-500 mb-3">Contact these first</p>
              <div className="space-y-1">
                {hottest.map((lead) => (
                  <Link
                    key={lead.id}
                    to={`/lead/${lead.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-mist transition-colors"
                  >
                    <ScoreCircle score={lead.score} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{lead.name}</p>
                      <p className="text-xs text-slate-500 truncate">{lead.location} · {lead.status}</p>
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