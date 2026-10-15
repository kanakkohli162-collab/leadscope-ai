import { useMemo, useRef, useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { Link } from 'react-router-dom'
import {
  Search, Lightbulb, Sparkles, Loader2, FileDown, Flame, MapPin, Target, Trophy, AlertTriangle, ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, FunnelChart, Funnel, LabelList,
} from 'recharts'
import PageLoader from '@/components/ui/PageLoader'
import { useToast } from '@/hooks/useToast'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { getInsightSummary } from '@/services/leadService'
import ChartCard, { EmptyChart } from '../components/ChartCard'
import CountUp from '../components/CountUp'
import OpportunityMatrix from '../components/OpportunityMatrix'
import { RANGES, filterLeads, computeInsights } from '../utils/insightsData'
import { LIGHT, PRIORITY_COLORS, SENTIMENT_COLORS, TOOLTIP, AXIS, ANIM } from '../utils/chartTheme'
import { downloadInsightsReport } from '../utils/insightsReport'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const FUNNEL_COLORS = ['#447EFC', '#5B8FFD', '#F5A524', '#34A853']
const INSIGHT_ICONS = { hot: Flame, area: MapPin, action: Target, gap: AlertTriangle, win: Trophy }
const bucketColor = (min) => (min >= 70 ? PRIORITY_COLORS.High : min >= 40 ? PRIORITY_COLORS.Medium : PRIORITY_COLORS.Low)

/** Horizontal bars on a white card. */
function HBars({ data, color = LIGHT.accent, empty }) {
  if (!data.some((d) => d.value > 0)) return <EmptyChart>{empty}</EmptyChart>
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24 }}>
        <CartesianGrid horizontal={false} stroke={LIGHT.grid} />
        <XAxis type="number" allowDecimals={false} {...AXIS} />
        <YAxis type="category" dataKey="name" width={118} {...AXIS} />
        <Tooltip {...TOOLTIP} />
        <Bar dataKey="value" name="Leads" fill={color} radius={[0, 8, 8, 0]} barSize={16} {...ANIM} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function Legend({ items }) {
  return (
    <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs" style={{ color: LIGHT.muted }} data-report-legend>
      {items.map((p) => (
        <span key={p.name} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} aria-hidden="true" />
          {p.name} ({p.value})
        </span>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const { leads, loading, error } = useLeads()
  const toast = useToast()
  const chartsRef = useRef(null)
  const [city, setCity] = useState('All')
  const [category, setCategory] = useState('All')
  const [range, setRange] = useState('all')
  const [ai, setAi] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  const cities = useMemo(() => [...new Set(leads.map((l) => l.location).filter(Boolean))].sort(), [leads])
  const categories = useMemo(() => [...new Set(leads.map((l) => l.category).filter(Boolean))].sort(), [leads])
  const filtered = useMemo(() => filterLeads(leads, { city, category, range }), [leads, city, category, range])
  const stats = useMemo(() => computeInsights(filtered), [filtered])

  const filtersText = [
    city === 'All' ? 'All cities' : city,
    category === 'All' ? 'All categories' : category,
    RANGES.find((r) => r.id === range).label,
  ].join(' · ')

  const summary = [
    { label: 'Total leads', value: stats.total, suffix: '' },
    { label: 'Average score', value: stats.avg, suffix: '' },
    { label: 'Hot leads (70+)', value: stats.hotPct, suffix: '%' },
    { label: 'Conversion rate', value: stats.convRate, suffix: '%' },
  ]

  async function askAi() {
    setAiLoading(true)
    setAiError('')
    try {
      setAi(await getInsightSummary({ filters: filtersText, ...stats.aiCounts }))
    } catch (e) {
      setAi(null)
      setAiError(e instanceof TypeError ? 'We could not reach the server. Please try again in a minute.'
        : e.message || 'The AI is busy right now. Please try again in a minute.')
    } finally {
      setAiLoading(false)
    }
  }

  function downloadReport() {
    const ok = downloadInsightsReport({
      root: chartsRef.current,
      summary: summary.map((s) => ({ label: s.label, value: `${s.value}${s.suffix}` })),
      insights: stats.insights.map((i) => i.text),
      aiSummary: ai,
      filtersText,
    })
    if (!ok) toast.error('Please allow pop-ups for this site to download the report.')
  }

  if (loading) return <PageLoader />
  if (error) return <p className="text-red-400">Couldn&apos;t load your leads. Please refresh the page.</p>

  if (leads.length === 0) {
    return (
      <WhitePanel as="div" bodyClassName="text-center !p-8 sm:!p-10">
        <h1 className="text-xl font-bold text-slate-800">No data to analyse yet</h1>
        <p className="text-sm text-slate-500 mt-1">Save a few leads and your charts will appear here.</p>
        <Link to="/lead-discovery" className="inline-flex items-center gap-2 mt-5 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-2.5 rounded-md">
          <Search size={17} /> Find leads
        </Link>
      </WhitePanel>
    )
  }

  const priorityItems = stats.priority.map((p) => ({ ...p, color: PRIORITY_COLORS[p.name] }))
  const sentimentItems = stats.sentiment.filter((s) => s.value > 0).map((s) => ({ ...s, color: SENTIMENT_COLORS[s.name] }))
  const selectCls = 'px-3 py-2 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600'

  return (
    <div className="space-y-6 min-w-0">
      {/* Header + actions */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Insights</h1>
          <p className="text-slate-500 mt-1 text-sm">What your saved leads tell you — and where to focus next.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <button type="button" onClick={askAi} disabled={aiLoading || !stats.total}
            className={`inline-flex items-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}>
            {aiLoading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            {aiLoading ? 'Thinking…' : 'AI summary'}
          </button>
          <button type="button" onClick={downloadReport} disabled={!stats.total}
            className={`inline-flex items-center gap-2 rounded-md border border-line bg-card hover:bg-inset disabled:opacity-60 px-4 py-2.5 text-sm font-medium text-slate-700 ${FOCUS}`}>
            <FileDown size={16} aria-hidden="true" /> Download report (PDF)
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          City
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
            <option value="All">All cities</option>
            {cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="All">All categories</option>
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="inline-flex w-fit rounded-full border border-line bg-inset p-0.5" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${FOCUS} ${range === r.id ? 'bg-primary-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slim summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-line bg-card divide-line divide-x divide-y md:divide-y-0 overflow-hidden">
        {summary.map((s) => (
          <div key={s.label} className="px-4 py-3">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="font-display text-xl font-bold text-slate-800"><CountUp value={s.value} suffix={s.suffix} /></p>
          </div>
        ))}
      </div>

      {stats.total === 0 ? (
        <WhitePanel as="div" bodyClassName="text-center text-sm text-slate-500 !p-8">
          No leads match these filters. Try “All time” or another city / category.
        </WhitePanel>
      ) : (
        <>
          {/* AI summary */}
          {aiError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {aiError}
            </p>
          )}
          {ai && (
            <div className="rounded-2xl border border-line p-5 text-white motion-safe:animate-fade-up"
              style={{ background: 'linear-gradient(135deg, #001C36 0%, #0497F6 60%, #4EB9E5 100%)' }}>
              <p className="flex items-center gap-2 font-semibold"><Sparkles size={18} aria-hidden="true" /> AI summary</p>
              <p className="mt-2 text-sm text-primary-50 leading-relaxed">{ai.summary}</p>
              <ol className="mt-3 space-y-1.5 text-sm list-decimal pl-5 text-white">
                {ai.recommendations.map((r) => <li key={r}>{r}</li>)}
              </ol>
            </div>
          )}

          {/* Smart insight cards */}
          {stats.insights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {stats.insights.map((ins, i) => {
                const Icon = INSIGHT_ICONS[ins.tone] || Lightbulb
                return (
                  <div key={ins.text} className="bg-card rounded-xl border border-line p-4 flex gap-3 motion-safe:animate-fade-up motion-safe:transition-transform motion-safe:hover:-translate-y-1"
                    style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="w-9 h-9 shrink-0 rounded-lg bg-primary-600/15 text-aqua flex items-center justify-center"><Icon size={18} aria-hidden="true" /></span>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 leading-snug">{ins.text}</p>
                      {ins.link && (
                        <Link to={ins.link.to} className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-aqua hover:text-aqua-light rounded ${FOCUS}`}>
                          {ins.link.label} <ArrowRight size={12} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Charts (white cards) */}
          <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard index={0} reportId="histogram" title="Score distribution" caption="Leads in each 10-point score range">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={stats.histogram}>
                  <CartesianGrid vertical={false} stroke={LIGHT.grid} />
                  <XAxis dataKey="name" {...AXIS} tick={{ ...AXIS.tick, fontSize: 10 }} interval={0} />
                  <YAxis allowDecimals={false} {...AXIS} width={28} />
                  <Tooltip {...TOOLTIP} />
                  <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]} {...ANIM}>
                    {stats.histogram.map((b) => <Cell key={b.name} fill={bucketColor(b.min)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard index={1} reportId="priority" title="Priority split" caption="High, Medium and Low leads">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={priorityItems} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="#FFFFFF" {...ANIM}>
                    {priorityItems.map((p) => <Cell key={p.name} fill={p.color} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP} />
                </PieChart>
              </ResponsiveContainer>
              <Legend items={priorityItems} />
            </ChartCard>

            <ChartCard index={2} reportId="gaps" title="Service gaps" caption="What these businesses are missing — what you can sell">
              <HBars data={stats.gaps} empty="No gaps found. Your leads look well set up online." />
              <p className="mt-2 text-[11px]" style={{ color: LIGHT.muted }}>
                “Outdated website” counts checked websites only ({stats.websitesChecked}); “Negative reviews” analysed leads only ({stats.sentimentDone}).
              </p>
            </ChartCard>

            <ChartCard index={3} reportId="funnel" title="Pipeline funnel" caption="How many leads reached each step">
              <ResponsiveContainer width="100%" height={230}>
                <FunnelChart>
                  <Tooltip {...TOOLTIP} />
                  <Funnel dataKey="value" nameKey="name" data={stats.funnel} {...ANIM}>
                    {stats.funnel.map((f, i) => <Cell key={f.name} fill={FUNNEL_COLORS[i]} />)}
                    <LabelList position="right" fill={LIGHT.ink} stroke="none" dataKey="name" fontSize={12} />
                    <LabelList position="center" fill="#FFFFFF" stroke="none" dataKey="value" fontSize={13} fontWeight={700} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard index={4} reportId="categories" title="Leads by category" caption="Types of businesses you saved">
              <HBars data={stats.categories} color="#447EFC" empty="No categories yet." />
            </ChartCard>

            <ChartCard index={5} reportId="areas" title="Leads by area" caption="Top 8 areas where your leads are">
              <HBars data={stats.areas} color="#5BA8F5" empty="No areas yet." />
            </ChartCard>

            <ChartCard index={6} reportId="weekly" title="Leads saved over time" caption="New leads saved each week">
              {stats.weekly.length ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.weekly} margin={{ right: 12 }}>
                    <CartesianGrid vertical={false} stroke={LIGHT.grid} />
                    <XAxis dataKey="name" {...AXIS} tick={{ ...AXIS.tick, fontSize: 11 }} />
                    <YAxis allowDecimals={false} {...AXIS} width={28} />
                    <Tooltip {...TOOLTIP} />
                    <Line type="monotone" dataKey="value" name="Leads saved" stroke={LIGHT.accent} strokeWidth={2.5} dot={{ r: 3, fill: LIGHT.accent }} {...ANIM} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <EmptyChart>No save dates yet.</EmptyChart>}
            </ChartCard>

            <ChartCard index={7} reportId="sentiment" title="Review sentiment" caption="From Review Sentiment on each lead">
              {stats.sentimentDone === 0 ? (
                <EmptyChart>No reviews analysed yet. Open a lead and use Review Sentiment.</EmptyChart>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={sentimentItems} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="#FFFFFF" {...ANIM}>
                        {sentimentItems.map((s) => <Cell key={s.name} fill={s.color} />)}
                      </Pie>
                      <Tooltip {...TOOLTIP} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Legend items={sentimentItems} />
                </>
              )}
            </ChartCard>

            <ChartCard index={8} reportId="matrix" className="lg:col-span-2" title="Opportunity matrix"
              caption="Hot leads by category and area — click a cell to open those leads">
              <OpportunityMatrix matrix={stats.matrix} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )
}
