import { SELL_SERVICES, sellServiceById } from '../../data/sellServices'
import { CATEGORY_GROUPS } from '../../data/businessCategories'
import { chip } from './styles'

const ICON_BY_LABEL = Object.fromEntries(CATEGORY_GROUPS.flatMap((g) => g.items).map((c) => [c.label, c.icon]))

/**
 * Optional "What do you sell?" chips. Choosing a service suggests business types that usually need it
 * and later highlights the results that fit it best. Clicking the chosen one again clears it.
 */
export default function SellPicker({ service, onServiceChange, category, onCategoryChange }) {
  const chosen = sellServiceById(service)

  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-1.5">
        What do you sell? <span className="font-normal text-slate-400">(optional)</span>
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label="What do you sell?">
        {SELL_SERVICES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={service === id}
            onClick={() => onServiceChange(service === id ? '' : id)}
            className={chip(service === id)}
          >
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      {chosen && (
        <div className="mt-3 rounded-lg border border-line bg-inset px-3 py-2.5">
          <p className="text-xs text-slate-500 mb-2">Businesses that often need {chosen.short}:</p>
          <div className="flex flex-wrap gap-2">
            {chosen.suggest.map((label) => {
              const Icon = ICON_BY_LABEL[label]
              const active = category.trim().toLowerCase() === label.toLowerCase()
              return (
                <button key={label} type="button" aria-pressed={active} onClick={() => onCategoryChange(label)} className={chip(active)}>
                  {Icon && <Icon size={14} aria-hidden="true" />} {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
