import { useEffect, useRef, useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Globe, Loader2, ExternalLink, AlertTriangle, Lightbulb, Search, FileDown, PenLine, History, X,
} from 'lucide-react'
import { checkWebsite } from '@/services/leadService'
import { useToast } from '@/hooks/useToast'
import { getCurrentUser } from '@/utils/currentUser'
import ScoreGauge from '../components/ScoreGauge'
import CheckList from '../components/CheckList'
import BulkCheck from '../components/BulkCheck'
import CompareSites from '../components/CompareSites'
import { addRecent, clearRecent, loadRecent, scoreColor } from '../utils/checkItems'
import { downloadAuditPdf } from '../utils/auditPdf'

/**
 * Website Checker (Synopsis 8.5 "Digital Presence Analysis").
 * Paste a website address (or open it from a lead with ?url=…&leadId=…) and get a simple health report,
 * an audit PDF, a message about the issues, a competitor comparison, and a bulk check of all saved leads.
 */

const EXAMPLES = ['example.com', 'wikipedia.org', 'neverssl.com']
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const BTN = `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm text-slate-700 hover:bg-inset ${FOCUS}`

// Backend messages are already friendly; only network-type errors need rewording
function friendly(message = '') {
  if (/failed to fetch|networkerror|request failed/i.test(message)) {
    return "We couldn't reach LeadScope right now. Please check your connection and try again."
  }
  return message || 'Something went wrong. Please try again.'
}

export default function WebsiteCheckerPage() {
  const toast = useToast()
  const [params] = useSearchParams()
  const [url, setUrl] = useState(params.get('url') || '')
  const [result, setResult] = useState(null)
  const [checkedFor, setCheckedFor] = useState(null)   // lead id when the result belongs to a lead
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recent, setRecent] = useState(loadRecent)
  const autoChecked = useRef('')

  async function runCheck(address) {
    const value = (address ?? url).trim()
    if (!value) {
      setError('Type a website address first, for example: example.com')
      return
    }
    setUrl(value)
    setLoading(true)
    setError('')
    setResult(null)
    // Save the result on the lead only when checking that lead's own website (not a newly typed one)
    const leadId = params.get('leadId') && value === (params.get('url') || '').trim() ? params.get('leadId') : undefined
    try {
      const res = await checkWebsite(value, leadId)
      setResult(res)
      setCheckedFor(leadId || null)
      setRecent(addRecent(value, res.score))
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
      runCheck(fromLead)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  function downloadAudit() {
    const user = getCurrentUser()
    const ok = downloadAuditPdf(result, user.agencyName || user.name || 'LeadScope AI')
    if (!ok) toast.error('Please allow pop-ups for this site to download the PDF.')
  }

  const issuesParam = result?.issues?.length ? `issues=${encodeURIComponent(result.issues.join(', '))}` : ''
  const messageLink = `/outreach?${[checkedFor && `leadId=${checkedFor}`, issuesParam].filter(Boolean).join('&')}`

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Website Checker</h1>
        <p className="text-sm text-slate-500 mt-1">
          Check if a business website opens, is secure, works on phones, loads fast and looks up to date.
        </p>
      </div>

      {/* Input */}
      <WhitePanel as="div">
      <form onSubmit={(e) => { e.preventDefault(); runCheck() }}>
        <label htmlFor="website-address" className="block text-sm font-medium text-slate-700 mb-2">Website address</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="website-address"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. example.com"
              autoComplete="url"
              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium px-5 py-2.5 rounded-md ${FOCUS}`}
          >
            {loading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
            {loading ? 'Checking…' : 'Check website'}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1">Try</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" disabled={loading} onClick={() => runCheck(ex)}
              className={`px-3 py-1 rounded-full text-xs font-medium bg-inset border border-line text-slate-600 hover:bg-line disabled:opacity-50 ${FOCUS}`}>
              {ex}
            </button>
          ))}
        </div>
        {error && <p role="alert" className="text-sm text-red-400 mt-3">{error}</p>}
      </form>
      </WhitePanel>

      {/* Loading */}
      {loading && (
        <WhitePanel as="div" bodyClassName="flex flex-col items-center gap-3 text-center !p-8 sm:!p-10" aria-live="polite">
          <Loader2 size={28} className="motion-safe:animate-spin text-aqua" aria-hidden="true" />
          <p className="text-sm text-slate-500">Opening the website… this can take up to 8 seconds.</p>
        </WhitePanel>
      )}

      {/* Result */}
      {result && !loading && (
        <WhitePanel as="div" bodyClassName="space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="shrink-0 flex flex-col items-center gap-2">
              <ScoreGauge score={result.score} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500">Website health</p>
              <p className="text-lg font-semibold text-slate-800 truncate">{result.title || result.finalUrl}</p>
              <a href={result.finalUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-aqua break-all">
                Open website <ExternalLink size={13} aria-hidden="true" />
              </a>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={downloadAudit} className={BTN}><FileDown size={15} aria-hidden="true" /> Download audit PDF</button>
                {result.issues?.length > 0 && (
                  <Link to={messageLink} className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium ${FOCUS}`}>
                    <PenLine size={15} aria-hidden="true" /> Write message about these issues
                  </Link>
                )}
              </div>
              {result.issues?.length > 0 && !checkedFor && (
                <p className="text-xs text-slate-500 mt-2">You will choose the lead on the Write Message page.</p>
              )}
            </div>
          </div>

          <CheckList result={result} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-inset rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-400" aria-hidden="true" /> Problems found
              </p>
              {result.issues?.length ? (
                <ul className="mt-2 space-y-1.5">
                  {result.issues.map((issue) => (
                    <li key={issue} className="text-sm text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" aria-hidden="true" /> {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-emerald-400">No problems found. Nice website!</p>
              )}
            </div>
            <div className="bg-inset rounded-lg p-4">
              <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Lightbulb size={16} className="text-aqua" aria-hidden="true" /> What to offer
              </p>
              <p className="mt-2 text-sm text-slate-600">{result.suggestion}</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Score starts at 100: −40 does not open, −20 no HTTPS, −15 not mobile-friendly, −10 slower than 3 s,
            −10 no page description, −15 © year 3+ years old.
          </p>
        </WhitePanel>
      )}

      {/* Empty state */}
      {!loading && !result && !error && (
        <WhitePanel as="div" bodyClassName="text-center !p-8 sm:!p-10">
          <Globe size={32} className="mx-auto text-aqua" aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold text-slate-800">No website checked yet</h2>
          <p className="text-sm text-slate-500 mt-1">
            Type a website above and press <b>Check website</b>. You can also open this page from a lead.
          </p>
        </WhitePanel>
      )}

      {/* Recent checks */}
      {recent.length > 0 && (
        <WhitePanel aria-labelledby="recent-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <History size={18} className="text-aqua" aria-hidden="true" /> Recent checks
            </h2>
            <button type="button" onClick={() => setRecent(clearRecent())} className={`inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 rounded ${FOCUS}`}>
              <X size={12} aria-hidden="true" /> Clear
            </button>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2">
            {recent.map((r) => (
              <li key={r.url}>
                <button type="button" disabled={loading} onClick={() => runCheck(r.url)} title={`Checked ${new Date(r.at).toLocaleString('en-IN')}`}
                  className={`inline-flex items-center gap-2 rounded-full border border-line bg-inset px-3 py-1.5 text-sm text-slate-700 hover:bg-line disabled:opacity-50 ${FOCUS}`}>
                  <span className="truncate max-w-[200px]">{r.url}</span>
                  <span className="text-xs font-bold" style={{ color: scoreColor(r.score) }}>{r.score}</span>
                </button>
              </li>
            ))}
          </ul>
        </WhitePanel>
      )}

      <CompareSites initialUrl={result?.finalUrl ? url : ''} key={result?.finalUrl || 'none'} />
      <BulkCheck />
    </div>
  )
}
