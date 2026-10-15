import { useId, useMemo, useState } from 'react'
import { Briefcase, LayoutGrid, Search, X } from 'lucide-react'
import { CATEGORY_GROUPS, POPULAR_CATEGORIES } from '../../data/businessCategories'
import { FOCUS, INPUT, chip } from './styles'

/**
 * "What type of business?" box + Popular chips + an "All categories" panel (grouped, searchable).
 * Clicking a chip fills the box; typing any other text still works.
 */
export default function CategoryPicker({ value, onChange }) {
  const id = useId()
  const [showAll, setShowAll] = useState(false)
  const [filter, setFilter] = useState('')

  const isActive = (label) => value.trim().toLowerCase() === label.toLowerCase()

  const groups = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return CATEGORY_GROUPS
      .map((g) => ({ ...g, items: g.items.filter((c) => !q || c.label.toLowerCase().includes(q) || g.group.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length)
  }, [filter])

  return (
    <div>
      <label htmlFor={`${id}-type`} className="block text-sm font-medium text-slate-700 mb-1.5">What type of business?</label>
      <div className="relative">
        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          id={`${id}-type`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={60}
          className={`${INPUT} pl-10 pr-4`}
          placeholder="e.g. Restaurants, Dentists, Gyms"
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-1">Popular</span>
        {POPULAR_CATEGORIES.map(({ label, icon: Icon }) => (
          <button key={label} type="button" aria-pressed={isActive(label)} onClick={() => onChange(label)} className={chip(isActive(label))}>
            <Icon size={14} aria-hidden="true" /> {label}
          </button>
        ))}
        <button
          type="button"
          aria-expanded={showAll}
          aria-controls={`${id}-all`}
          onClick={() => setShowAll((s) => !s)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-aqua hover:text-aqua-light ${FOCUS}`}
        >
          <LayoutGrid size={14} aria-hidden="true" /> {showAll ? 'Hide categories' : 'All categories'}
        </button>
      </div>

      {showAll && (
        <div id={`${id}-all`} className="mt-3 rounded-xl border border-line bg-inset p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Search categories"
                placeholder="Search categories"
                className={`${INPUT} bg-card pl-10 pr-4 py-2`}
              />
            </div>
            <button type="button" onClick={() => setShowAll(false)} aria-label="Close categories" className={`p-2 rounded-md text-slate-400 hover:text-slate-800 ${FOCUS}`}>
              <X size={18} />
            </button>
          </div>

          {groups.length ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groups.map((g) => (
                <div key={g.group}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{g.group}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.items.map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={isActive(label)}
                        onClick={() => { onChange(label); setShowAll(false) }}
                        className={chip(isActive(label))}
                      >
                        <Icon size={14} aria-hidden="true" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No category matches “{filter}”. You can still type any business type in the box above.</p>
          )}
        </div>
      )}
    </div>
  )
}
