import { useId } from 'react'
import { FOCUS, chip } from './styles'
import { DEFAULT_FILTERS, SORTS } from '../../utils/discoveryFilters'

function Segmented({ legend, value, onChange, options }) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, label]) => (
          <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)} className={chip(value === v)}>
            {label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** The filter + sort controls. Used in the left panel (desktop) and in the bottom sheet (mobile). */
export default function ResultFilters({ filters, setFilters, sort, setSort }) {
  const id = useId()
  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value }))
  const changed = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS) || sort !== 'score'

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${id}-sort`} className="block text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Sort by</label>
        <select
          id={`${id}-sort`}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <Segmented legend="Priority" value={filters.priority} onChange={set('priority')}
        options={[['', 'All'], ['High', 'High'], ['Medium', 'Medium'], ['Low', 'Low']]} />
      <Segmented legend="Has website" value={filters.website} onChange={set('website')}
        options={[['any', 'Any'], ['yes', 'Yes'], ['no', 'No']]} />
      <Segmented legend="Has phone" value={filters.phone} onChange={set('phone')}
        options={[['any', 'Any'], ['yes', 'Yes'], ['no', 'No']]} />

      <div>
        <label htmlFor={`${id}-min`} className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          Minimum score <span className="text-sm normal-case tracking-normal font-bold text-slate-800">{filters.minScore}</span>
        </label>
        <input
          id={`${id}-min`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minScore}
          onChange={(e) => set('minScore')(Number(e.target.value))}
          className={`w-full accent-primary-600 ${FOCUS}`}
        />
      </div>

      {changed && (
        <button
          type="button"
          onClick={() => { setFilters(DEFAULT_FILTERS); setSort('score') }}
          className={`text-sm font-medium text-aqua hover:text-aqua-light rounded ${FOCUS}`}
        >
          Reset filters
        </button>
      )}
    </div>
  )
}
