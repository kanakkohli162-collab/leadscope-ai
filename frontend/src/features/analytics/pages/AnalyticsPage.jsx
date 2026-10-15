import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Users, Gauge, Flame, Trophy, Lightbulb, Search } from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import PageLoader from '@/components/ui/PageLoader'
import { useLeads } from '@/features/leads/hooks/useLeads'

const AZURE = '#0497F6'
const AQUA = '#4EB9E5'
const GLOW = '#75DFFF'
const HOT = '#F5A524'
const GREY = '#2A5F8A'
const PIPELINE = ['New', 'Contacted', 'Follow-up', 'Interested', 'Converted', 'Not Interested']
const tooltipStyle = { borderRadius: 12, background: '#113E62', border: '1px solid #1B4C74', color: '#E6F1F7', fontSize: 13 }
const tooltipText = { color: '#E6F1F7' }

function countBy(list, getKey) {
  const map = {}
  list.forEach((item) => {
    const keys = [].concat(getKey(item) || [])
    keys.forEach((k) => { if (k) map[k] = (map[k] || 0) + 1 })
  })
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function Card({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-card rounded-2xl border border-slate-200 p-5 ${className}`}>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

function Kpi({ icon: Icon, label, value, hint, tone }) {
  return (
    <div className="bg-card rounded-2xl border border-slate-200 p-5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${tone}1A`, color: tone }}>
        <Icon size={20} />
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-800">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function HBar({ data, color = AZURE, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid horizontal={false} stroke="#1B4C74" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#9DB8CF' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#9DB8CF' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipText} itemStyle={tooltipText} cursor={{ fill: '#0B3354' }} />
        <Bar dataKey="value" name="Leads" fill={color} radius={[0, 8, 8, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function AnalyticsPage() {
  const { leads, loading, error } = useLeads()

  const stats = useMemo(() => {
    const total = leads.length
    const avg = total ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0
    const hot = leads.filter((l) => l.priority === 'High').length
    const contacted = leads.filter((l) => l.status !== 'New').length
    const converted = leads.filter((l) => l.status === 'Converted').length
    const noWebsite = leads.filter((l) => !l.hasWebsite).length

    const priority = ['High', 'Medium', 'Low'].map((p) => ({ name: p, value: leads.filter((l) => l.priority === p).length }))
    const pipeline = PIPELINE.map((s) => ({ name: s, value: leads.filter((l) => l.status === s).length }))
    const gaps = countBy(leads, (l) => l.serviceGaps)
    const categories = countBy(leads, (l) => l.category).slice(0, 8)
    const cities = countBy(leads, (l) => l.location).slice(0, 8)
    const buckets = ['0–20', '21–40', '41–60', '61–80', '81–100'].map((name, i) => ({
      name,
      value: leads.filter((l) => {
        const s = l.score || 0
        return i === 0 ? s <= 20 : s > i * 20 && s <= (i + 1) * 20
      }).length,
    }))

    const insights = []
    if (total) {
      const pctNoWeb = Math.round((noWebsite / total) * 100)
      if (pctNoWeb >= 30) insights.push(`${pctNoWeb}% of your leads have no website. Website packages are your biggest opportunity.`)
      if (gaps[0]) insights.push(`The most common gap is "${gaps[0].name}" (${gaps[0].value} leads). Lead with that in your pitch.`)
      if (categories[0]) insights.push(`Most of your leads are ${categories[0].name.toLowerCase()} businesses (${categories[0].value}).`)
      const newCount = pipeline[0].value
      if (newCount > 0) insights.push(`${newCount} leads are still "New". Start with the High-priority ones.`)
      if (contacted > 0) insights.push(`Conversion rate: ${Math.round((converted / contacted) * 100)}% of contacted leads became clients.`)
    }

    return {
      total, avg, hot, converted, contacted,
      hotPct: total ? Math.round((hot / total) * 100) : 0,
      convRate: contacted ? Math.round((converted / contacted) * 100) : 0,
      priority, pipeline, gaps, categories, cities, buckets, insights,
    }
  }, [leads])

  if (loading) return <PageLoader />
  if (error) return <p className="text-red-400">{error}</p>

  if (stats.total === 0) {
    return (
      <div className="bg-card rounded-2xl border border-slate-200 p-10 text-center">
        <h1 className="text-xl font-bold text-slate-800">No data to analyse yet</h1>
        <p className="text-sm text-slate-500 mt-1">Save a few leads and your charts will appear here.</p>
        <Link to="/lead-discovery" className="inline-flex items-center gap-2 mt-5 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-md">
          <Search size={17} /> Find leads
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Insights</h1>
        <p className="text-slate-500 mt-1">Analysis of your {stats.total} saved leads</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Users} tone={AZURE} label="Total leads" value={stats.total} hint="Saved in My Leads" />
        <Kpi icon={Gauge} tone={AQUA} label="Average score" value={stats.avg} hint="Out of 100" />
        <Kpi icon={Flame} tone={HOT} label="Hot leads" value={`${stats.hotPct}%`} hint={`${stats.hot} with score 70+`} />
        <Kpi icon={Trophy} tone="#16A34A" label="Conversion rate" value={`${stats.convRate}%`} hint={`${stats.converted} of ${stats.contacted} contacted`} />
      </div>

      {stats.insights.length > 0 && (
        <div className="rounded-2xl border border-line p-5 text-white" style={{ background: 'linear-gradient(135deg, #001C36 0%, #0497F6 60%, #4EB9E5 100%)', boxShadow: '0 22px 44px -22px rgba(4,151,246,.55)' }}>
          <p className="flex items-center gap-2 font-semibold"><Lightbulb size={18} /> What your data says</p>
          <ul className="mt-3 space-y-1.5 text-sm text-primary-50">
            {stats.insights.map((t) => <li key={t}>• {t}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Priority split" subtitle="How many leads are High, Medium or Low">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.priority} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="#113E62">
                {stats.priority.map((p) => (
                  <Cell key={p.name} fill={p.name === 'High' ? HOT : p.name === 'Medium' ? AZURE : GREY} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipText} itemStyle={tooltipText} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs text-slate-600">
            {stats.priority.map((p) => (
              <span key={p.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.name === 'High' ? HOT : p.name === 'Medium' ? AZURE : GREY }} />
                {p.name} ({p.value})
              </span>
            ))}
          </div>
        </Card>

        <Card title="Pipeline" subtitle="Where your leads are in the sales process" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.pipeline}>
              <CartesianGrid vertical={false} stroke="#1B4C74" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9DB8CF' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9DB8CF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipText} itemStyle={tooltipText} cursor={{ fill: '#0B3354' }} />
              <Bar dataKey="value" name="Leads" radius={[8, 8, 0, 0]}>
                {stats.pipeline.map((p) => (
                  <Cell key={p.name} fill={p.name === 'Converted' ? '#16A34A' : p.name === 'Not Interested' ? GREY : AZURE} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Service gaps" subtitle="What these businesses are missing (what you can sell)">
          {stats.gaps.length ? <HBar data={stats.gaps} color={AQUA} /> : <p className="text-sm text-slate-500">No gaps detected.</p>}
        </Card>
        <Card title="Leads by category" subtitle="Types of businesses you saved">
          <HBar data={stats.categories} color={GLOW} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Score distribution" subtitle="How many leads fall in each score range">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.buckets}>
              <CartesianGrid vertical={false} stroke="#1B4C74" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9DB8CF' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#9DB8CF' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={tooltipText} itemStyle={tooltipText} cursor={{ fill: '#0B3354' }} />
              <Bar dataKey="value" name="Leads" radius={[8, 8, 0, 0]}>
                {stats.buckets.map((b, i) => <Cell key={b.name} fill={i >= 3 ? HOT : i === 2 ? AZURE : GREY} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Leads by city" subtitle="Where your leads are located">
          <HBar data={stats.cities} color={AZURE} />
        </Card>
      </div>
    </div>
  )
}