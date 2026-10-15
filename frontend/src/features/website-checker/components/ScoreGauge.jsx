import { useEffect, useState } from 'react'
import { scoreColor, scoreLabel } from '../utils/checkItems'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Half-circle health gauge. Fills once from 0 to the score; colour goes red (low) → green (high).
 * No animation for people who prefer reduced motion.
 */
export default function ScoreGauge({ score, size = 180 }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0))
  const [shown, setShown] = useState(() => (reduced() ? value : 0))

  useEffect(() => {
    if (reduced()) { setShown(value); return undefined }
    setShown(0)
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(value)))
    return () => cancelAnimationFrame(frame)
  }, [value])

  const stroke = 14
  const r = (size - stroke) / 2
  const half = Math.PI * r
  const h = size / 2 + stroke / 2
  const arc = `M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`
  const color = scoreColor(value)

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`Website health ${value} out of 100, ${scoreLabel(value)}`}>
      <div className="relative" style={{ width: size, height: h }}>
        <svg width={size} height={h} aria-hidden="true">
          <path d={arc} fill="none" className="ls-ring-track" strokeWidth={stroke} strokeLinecap="round" />
          <path
            d={arc}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={half}
            strokeDashoffset={half * (1 - shown / 100)}
            style={{ transition: reduced() ? 'none' : 'stroke-dashoffset 1000ms cubic-bezier(.2,.7,.2,1)' }}
          />
        </svg>
        <span className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className="font-display font-bold text-ink text-4xl leading-none">{value}</span>
          <span className="text-[11px] text-slate-500 mt-1">out of 100</span>
        </span>
      </div>
      <span className="mt-2 text-sm font-semibold" style={{ color }}>{scoreLabel(value)}</span>
    </div>
  )
}
