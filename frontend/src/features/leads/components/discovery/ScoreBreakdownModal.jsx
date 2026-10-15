import { useEffect, useRef } from 'react'
import { X, CheckCircle2, MinusCircle } from 'lucide-react'
import PriorityBadge from '@/components/ui/PriorityBadge'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { FOCUS } from './styles'

/**
 * "Why this score?" — each rule from LeadScoringService with its points, the total and the priority.
 * Score = points earned / points possible for this business × 100 (rules without data are not counted).
 */
export default function ScoreBreakdownModal({ result, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      previous?.focus?.()   // back to the score button that opened it
    }
  }, [onClose])

  const rules = result.scoreBreakdown || []
  const earned = rules.reduce((sum, r) => sum + (r.points || 0), 0)
  const possible = rules.reduce((sum, r) => sum + (r.max || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="score-why-title"
        className="relative w-full sm:max-w-lg max-h-[90vh] overflow-auto bg-card border border-line rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/50 p-5"
      >
        <div className="flex items-start gap-3">
          <ScoreCircle score={result.score} size="md" />
          <div className="min-w-0 flex-1">
            <h2 id="score-why-title" className="text-lg font-semibold text-slate-800">Why this score?</h2>
            <p className="text-sm text-slate-500 truncate">{result.name}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className={`p-1.5 rounded-md text-slate-400 hover:text-slate-800 ${FOCUS}`}>
            <X size={20} />
          </button>
        </div>

        {rules.length ? (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {rules.map((r) => {
              const counted = r.max > 0
              const hit = r.points > 0
              return (
                <li key={r.rule} className="flex items-start gap-3 py-3">
                  {hit
                    ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-marigold-500" aria-hidden="true" />
                    : <MinusCircle size={18} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{r.rule}</p>
                    <p className="text-xs text-slate-500">{r.detail}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${hit ? 'text-marigold-500' : 'text-slate-400'}`}>
                    {counted ? `+${r.points} / ${r.max}` : 'Not counted'}
                  </span>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-slate-500">
            Gaps found: {result.serviceGaps.length ? result.serviceGaps.join(', ') : 'none'}.
          </p>
        )}

        <div className="mt-4 space-y-2 text-sm">
          {possible > 0 && (
            <p className="text-slate-600">
              Total: <b className="text-slate-800">{earned}</b> of <b className="text-slate-800">{possible}</b> possible points
              {' '}= <b className="text-slate-800">{result.score} / 100</b>
            </p>
          )}
          <p className="flex items-center gap-2 text-slate-600">Priority: <PriorityBadge priority={result.priority} /></p>
          <p className="text-xs text-slate-400">High = 70 or more, Medium = 40–69, Low = below 40. A higher score means they need your help more.</p>
        </div>
      </div>
    </div>
  )
}
