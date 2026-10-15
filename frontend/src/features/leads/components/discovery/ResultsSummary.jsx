import { Flame, Globe, PhoneOff, Building2 } from 'lucide-react'
import { FOCUS, LEVEL_COLORS } from './styles'

/**
 * Summary of the whole search: total, hot (70+), without website, without phone,
 * and a stacked High / Medium / Low bar. Clicking a number applies that filter.
 */
export default function ResultsSummary({ results, onPick }) {
  const total = results.length
  const levels = { High: 0, Medium: 0, Low: 0 }
  let noWebsite = 0
  let noPhone = 0
  results.forEach((r) => {
    levels[r.priority] = (levels[r.priority] || 0) + 1
    if (!r.hasWebsite) noWebsite += 1
    if (!r.raw?.phone) noPhone += 1
  })

  const stats = [
    { key: 'all', label: 'Businesses found', value: total, icon: Building2, color: 'text-aqua' },
    { key: 'hot', label: 'Hot leads (70+)', value: levels.High, icon: Flame, color: 'text-marigold-500' },
    { key: 'noWebsite', label: 'Without website', value: noWebsite, icon: Globe, color: 'text-red-400' },
    { key: 'noPhone', label: 'Without phone', value: noPhone, icon: PhoneOff, color: 'text-red-400' },
  ]

  return (
    <div className="bg-card rounded-xl border border-slate-200 p-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {stats.map(({ key, label, value, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            title={key === 'all' ? 'Show all results' : `Show only: ${label.toLowerCase()}`}
            className={`text-left rounded-lg px-3 py-2.5 hover:bg-inset motion-safe:transition-colors ${FOCUS}`}
          >
            <span className={`flex items-center gap-1.5 text-xs text-slate-500`}>
              <Icon size={14} className={color} aria-hidden="true" /> {label}
            </span>
            <span className="block mt-0.5 font-display text-2xl font-bold text-slate-800">{value}</span>
          </button>
        ))}
      </div>

      {total > 0 && (
        <div className="mt-3 px-3">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-inset" role="img"
            aria-label={`High ${levels.High}, Medium ${levels.Medium}, Low ${levels.Low}`}>
            {Object.entries(levels).map(([level, n]) => n > 0 && (
              <span key={level} style={{ width: `${(n / total) * 100}%`, background: LEVEL_COLORS[level] }} />
            ))}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {Object.entries(levels).map(([level, n]) => (
              <span key={level} className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: LEVEL_COLORS[level] }} /> {level} {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
