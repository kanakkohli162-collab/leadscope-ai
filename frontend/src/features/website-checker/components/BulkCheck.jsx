import { useRef, useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { Link } from 'react-router-dom'
import { ListChecks, Loader2, X, PenLine } from 'lucide-react'
import { checkWebsite, getLeads } from '@/services/leadService'
import { scoreColor } from '../utils/checkItems'

const MAX_PER_RUN = 50
const AT_A_TIME = 3
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'

/**
 * "Check all my leads": checks every saved lead that has a website (3 at a time, max 50 per run).
 * Each result is saved on the lead (health score + outdated) by the backend. Cancel stops new checks.
 */
export default function BulkCheck() {
  const [running, setRunning] = useState(false)
  const [total, setTotal] = useState(0)
  const [rows, setRows] = useState([])        // { lead, score, issues, error }
  const [skipped, setSkipped] = useState(0)   // leads with a website beyond the 50 limit
  const [message, setMessage] = useState('')
  const cancelled = useRef(false)

  async function run() {
    setRunning(true)
    setRows([])
    setMessage('')
    cancelled.current = false
    try {
      const all = (await getLeads()).filter((l) => l.website)
      if (!all.length) {
        setMessage('None of your saved leads has a website yet.')
        return
      }
      const queue = all.slice(0, MAX_PER_RUN)
      setSkipped(all.length - queue.length)
      setTotal(queue.length)
      let next = 0
      const worker = async () => {
        while (!cancelled.current && next < queue.length) {
          const lead = queue[next++]
          try {
            const r = await checkWebsite(lead.website, lead.id)
            setRows((list) => [...list, { lead, score: r.score, issues: r.issues || [] }])
          } catch (e) {
            setRows((list) => [...list, { lead, score: null, issues: [], error: e.message || 'Could not check' }])
          }
        }
      }
      await Promise.all(Array.from({ length: AT_A_TIME }, worker))
      if (cancelled.current) setMessage('Stopped. The websites checked so far are saved on your leads.')
    } catch {
      setMessage('We could not load your leads. Please try again in a minute.')
    } finally {
      setRunning(false)
    }
  }

  // Worst first; websites that could not be checked go last
  const sorted = [...rows].sort((a, b) => (a.score ?? 101) - (b.score ?? 101))
  const done = rows.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <WhitePanel aria-labelledby="bulk-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="bulk-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <ListChecks size={18} className="text-aqua" aria-hidden="true" /> Check all my leads
          </h2>
          <p className="text-xs text-slate-500 mt-1">Checks every saved lead with a website (up to {MAX_PER_RUN} per run) and saves the health score on each lead.</p>
        </div>
        {running ? (
          <button type="button" onClick={() => { cancelled.current = true }}
            className={`inline-flex items-center gap-2 rounded-md border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 ${FOCUS}`}>
            <X size={16} aria-hidden="true" /> Cancel
          </button>
        ) : (
          <button type="button" onClick={run}
            className={`inline-flex items-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}>
            <ListChecks size={16} aria-hidden="true" /> {rows.length ? 'Check again' : 'Check all my leads'}
          </button>
        )}
      </div>

      {(running || done > 0) && total > 0 && (
        <div className="mt-4" aria-live="polite">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span className="inline-flex items-center gap-1.5">
              {running && <Loader2 size={12} className="motion-safe:animate-spin" aria-hidden="true" />}
              {done} of {total} checked
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-inset overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
            <div className="h-full bg-primary-600 motion-safe:transition-[width] motion-safe:duration-300" style={{ width: `${pct}%` }} />
          </div>
          {skipped > 0 && <p className="text-xs text-slate-500 mt-1">{skipped} more leads have websites; run again later to check them.</p>}
        </div>
      )}

      {message && <p className="mt-3 text-sm text-slate-500">{message}</p>}

      {sorted.length > 0 && (
        <div className="mt-4 overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-line">
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Health</th>
                <th className="py-2 pr-3 font-medium">Issues</th>
                <th className="py-2 font-medium"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map(({ lead, score, issues, error }) => (
                <tr key={lead.id}>
                  <td className="py-2.5 pr-3">
                    <Link to={`/lead/${lead.id}`} className={`font-medium text-slate-800 hover:text-aqua rounded ${FOCUS}`}>{lead.name}</Link>
                    <span className="block text-xs text-slate-500 truncate max-w-[220px]">{lead.website}</span>
                  </td>
                  <td className="py-2.5 pr-3">
                    {score == null ? <span className="text-xs text-slate-500">—</span>
                      : <span className="font-bold" style={{ color: scoreColor(score) }}>{score}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-slate-600">{error ? <span className="text-slate-500">{error}</span> : issues.join(', ') || 'No problems'}</td>
                  <td className="py-2.5 text-right">
                    {issues.length > 0 && (
                      <Link to={`/outreach?leadId=${lead.id}&issues=${encodeURIComponent(issues.join(', '))}`}
                        className={`inline-flex items-center gap-1 text-xs font-semibold text-aqua hover:text-aqua-light whitespace-nowrap rounded ${FOCUS}`}>
                        <PenLine size={12} aria-hidden="true" /> Write message
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WhitePanel>
  )
}
