import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { checklist } from '../utils/checkItems'

const STATE = {
  good: { icon: CheckCircle2, cls: 'text-emerald-400', label: 'Pass' },
  bad: { icon: XCircle, cls: 'text-red-400', label: 'Problem' },
  unknown: { icon: MinusCircle, cls: 'text-slate-400', label: 'Not checked' },
}

/** The checks, appearing one after another (no animation with reduced motion), each with a plain-English "why". */
export default function CheckList({ result }) {
  return (
    <ul className="divide-y divide-line">
      {checklist(result).map((item, i) => {
        const { icon: Icon, cls, label } = STATE[item.state]
        return (
          <li key={item.key} className="flex items-start gap-3 py-3 motion-safe:animate-fade-up" style={{ animationDelay: `${150 + i * 120}ms` }}>
            <Icon size={20} className={`shrink-0 mt-0.5 ${cls}`} aria-label={label} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {item.title} <span className={`font-normal ${cls}`}>· {item.result}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{item.why}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
