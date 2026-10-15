import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Globe, Loader2, ExternalLink, CheckCircle, XCircle, MinusCircle, AlertTriangle, Lightbulb, Search,
} from 'lucide-react'
import { checkWebsite } from '@/services/leadService'

/**
 * Website Checker (Synopsis 8.5 "Digital Presence Analysis").
 * Paste a website address (or open it from a lead with ?url=…) and get a simple health report.
 */

// Health ring: same look as ScoreCircle, but colours mean healthy (green) → poor (red)
function HealthRing({ score }) {
  const px = 120
  const stroke = 9
  const r = (px - stroke) / 2
  const circumference = 2 * Math.PI * r
  const value = Math.max(0, Math.min(100, Number(score) || 0))
  const color = value >= 75 ? '#34D399' : value >= 50 ? '#F5A524' : '#F87171'
  const label = value >= 75 ? 'Healthy' : value >= 50 ? 'Needs work' : 'Poor'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative shrink-0" style={{ width: px, height: px }} role="img" aria-label={`Website health ${value} out of 100`}>
        <svg width={px} height={px} className="-rotate-90">
          <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="#1B4C74" strokeWidth={stroke} />
          <circle
            cx={px / 2}
            cy={px / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - value / 100)}
            style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-ink text-3xl">{value}</span>
          <span className="text-[11px] text-slate-500">out of 100</span>
        </span>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}

// Green = good, red = problem, grey = could not check
const CHIP = {
  good: { icon: CheckCircle, cls: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' },
  bad: { icon: XCircle, cls: 'bg-red-500/10 border-red-500/30 text-red-400' },
  unknown: { icon: MinusCircle, cls: 'bg-inset border-line text-slate-500' },
}

function Chip({ state, children }) {
  const { icon: Icon, cls } = CHIP[state]
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${cls}`}>
      <Icon size={14} /> {children}
    </span>
  )
}

function chipsFor(r) {
  if (!r.reachable) {
    return [
      ['bad', 'Does not open'],
      ['unknown', 'HTTPS'],
      ['unknown', 'Mobile-friendly'],
      ['unknown', 'Speed'],
      ['unknown', 'Up to date'],
    ]
  }
  const secs = (r.loadTimeMs / 1000).toFixed(1)
  return [
    ['good', 'Opens'],
    [r.https ? 'good' : 'bad', r.https ? 'HTTPS' : 'No HTTPS'],
    [r.mobileFriendly ? 'good' : 'bad', r.mobileFriendly ? 'Mobile-friendly' : 'Not mobile-friendly'],
    [r.loadTimeMs > 3000 ? 'bad' : 'good', `${r.loadTimeMs > 3000 ? 'Slow' : 'Fast'} (${secs} s)`],
    r.copyrightYear == null
      ? ['unknown', 'Year not shown']
      : [r.outdated ? 'bad' : 'good', r.outdated ? `Outdated (© ${r.copyrightYear})` : `Up to date (© ${r.copyrightYear})`],
  ]
}

// Backend messages are already friendly; only network-type errors need rewording
function friendly(message = '') {
  if (/failed to fetch|networkerror|request failed/i.test(message)) {
    return "We couldn't reach LeadScope right now. Please check your connection and try again."
  }
  return message || 'Something went wrong. Please try again.'
}

export default function WebsiteCheckerPage() {
  const [params] = useSearchParams()
  const [url, setUrl] = useState(params.get('url') || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const autoChecked = useRef('')

  async function runCheck(address) {
    const value = (address ?? url).trim()
    if (!value) {
      setError('Type a website address first, for example: example.com')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await checkWebsite(value))
    } catch (e) {
      setError(friendly(e.message))
    } finally {
      setLoading(false)
    }
  }

  // Opened from a lead (?url=…): fill the box and check straight away (once per address)
  useEffect(() => {
    const fromLead = params.get('url')
    if (fromLead && autoChecked.current !== fromLead) {
      autoChecked.current = fromLead
      setUrl(fromLead)
      runCheck(fromLead)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  function handleSubmit(e) {
    e.preventDefault()
    runCheck()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Website Checker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Check if a business website opens, is secure, works on phones, loads fast and looks up to date.
        </p>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-slate-200 p-5">
        <label htmlFor="website-address" className="block text-sm font-medium text-slate-700 mb-2">Website address</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="website-address"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. example.com"
              autoComplete="url"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-md transition-colors"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            {loading ? 'Checking…' : 'Check website'}
          </button>
        </div>
        {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
      </form>

      {/* Loading */}
      {loading && (
        <div className="bg-card rounded-xl border border-slate-200 p-10 flex flex-col items-center gap-3 text-center">
          <Loader2 size={28} className="animate-spin text-aqua" />
          <p className="text-sm text-slate-500">Opening the website… this can take up to 8 seconds.</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <div className="bg-card rounded-xl border border-dashed border-line p-10 text-center">
          <Globe size={32} className="mx-auto text-aqua" />
          <h2 className="mt-3 text-base font-semibold text-slate-800">No website checked yet</h2>
          <p className="text-sm text-slate-500 mt-1">
            Type a website above and press <b>Check website</b>. You can also open this page from a lead.
          </p>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="bg-card rounded-xl border border-slate-200 p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <HealthRing score={result.score} />
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-xs text-slate-500">Website health</p>
                <p className="text-lg font-semibold text-slate-800 truncate">{result.title || result.finalUrl}</p>
                <a
                  href={result.finalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-aqua break-all"
                >
                  Open website <ExternalLink size={13} />
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                {chipsFor(result).map(([state, text]) => <Chip key={text} state={state}>{text}</Chip>)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-inset rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" /> Problems found
              </p>
              {result.issues?.length ? (
                <ul className="mt-2 space-y-1.5">
                  {result.issues.map((issue) => (
                    <li key={issue} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" /> {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-emerald-400">No problems found. Nice website!</p>
              )}
            </div>
            <div className="bg-inset rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Lightbulb size={16} className="text-aqua" /> What to offer
              </p>
              <p className="mt-2 text-sm text-slate-600">{result.suggestion}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Score starts at 100: −40 does not open, −20 no HTTPS, −15 not mobile-friendly, −10 slower than 3 s,
            −10 no page description, −15 © year 3+ years old.
          </p>
        </div>
      )}
    </div>
  )
}
