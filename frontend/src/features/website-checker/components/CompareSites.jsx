import { useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { Scale, Loader2, Trophy } from 'lucide-react'
import { checkWebsite } from '@/services/leadService'
import { checklist, betterPerCheck, scoreColor } from '../utils/checkItems'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const INPUT = 'w-full px-3 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600'

/** "Compare with a competitor": two websites side by side; the better one is highlighted on each check. */
export default function CompareSites({ initialUrl }) {
  const [urls, setUrls] = useState([initialUrl || '', ''])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)   // [{ url, result } | { url, error }] x2

  async function compare(e) {
    e.preventDefault()
    const list = urls.map((u) => u.trim())
    if (!list[0] || !list[1]) return
    setLoading(true)
    setResults(null)
    const answers = await Promise.allSettled(list.map((u) => checkWebsite(u)))
    setResults(answers.map((a, i) => (a.status === 'fulfilled'
      ? { url: list[i], result: a.value }
      : { url: list[i], error: a.reason instanceof TypeError ? 'Could not reach the server.' : a.reason?.message || 'Could not check' })))
    setLoading(false)
  }

  const both = results && results.every((r) => r.result)
  const better = both ? betterPerCheck(results[0].result, results[1].result) : null
  const rows = both ? checklist(results[0].result).map((item, i) => ({ item, other: checklist(results[1].result)[i] })) : []
  const cell = (side, winner) => (winner === side ? 'bg-emerald-500/15 text-emerald-300 font-semibold' : 'text-slate-600')

  return (
    <WhitePanel aria-labelledby="compare-title">
      <h2 id="compare-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
        <Scale size={18} className="text-aqua" aria-hidden="true" /> Compare with a competitor
      </h2>
      <p className="text-xs text-slate-500 mt-1">Check two websites side by side. Green = better on that check.</p>

      <form onSubmit={compare} className="mt-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-3 sm:items-end">
        {['Their website', 'Competitor'].map((label, i) => (
          <label key={label} className="block">
            <span className="block text-xs font-medium text-slate-500 mb-1">{label}</span>
            <input value={urls[i]} onChange={(e) => setUrls((u) => u.map((x, j) => (j === i ? e.target.value : x)))} placeholder="e.g. example.com" className={INPUT} />
          </label>
        ))}
        <button type="submit" disabled={loading || !urls[0].trim() || !urls[1].trim()}
          className={`inline-flex items-center justify-center gap-2 rounded-md bg-primary-600 hover:bg-primary-700 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}>
          {loading ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Scale size={16} aria-hidden="true" />}
          {loading ? 'Checking both…' : 'Compare'}
        </button>
      </form>

      {results && !both && (
        <div className="mt-4 space-y-1 text-sm">
          {results.map((r) => r.error && <p key={r.url} className="text-red-300">{r.url}: {r.error}</p>)}
        </div>
      )}

      {both && (
        <div className="mt-4 overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[480px] text-sm border-separate" style={{ borderSpacing: '0 4px' }}>
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="text-left font-medium py-1 pr-2">Check</th>
                {results.map((r) => <th key={r.url} className="text-left font-semibold text-slate-700 py-1 px-2 truncate max-w-[180px]">{r.url}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pr-2 text-slate-700 font-medium">Health score</td>
                {results.map((r, i) => (
                  <td key={r.url} className={`py-2 px-2 rounded-md ${cell(i, better.score)}`}>
                    <span className="font-bold" style={{ color: scoreColor(r.result.score) }}>{r.result.score}</span>
                    {better.score === i && <Trophy size={13} className="inline ml-1.5 text-marigold-400" aria-label="Better" />}
                  </td>
                ))}
              </tr>
              {rows.map(({ item, other }) => (
                <tr key={item.key}>
                  <td className="py-2 pr-2 text-slate-700">{item.title}</td>
                  <td className={`py-2 px-2 rounded-md text-xs ${cell(0, better[item.key])}`}>{item.result}</td>
                  <td className={`py-2 px-2 rounded-md text-xs ${cell(1, better[item.key])}`}>{other.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WhitePanel>
  )
}
