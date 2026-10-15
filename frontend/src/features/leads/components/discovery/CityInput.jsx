import { useId, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { matchCities, POPULAR_CITIES } from '../../data/indianCities'
import { INPUT, chip } from './styles'

/**
 * "Which city?" box with up to 8 suggestions (Up / Down / Enter / Escape) and Popular city chips.
 * Any typed city still works — suggestions only help.
 */
export default function CityInput({ value, onChange }) {
  const id = useId()
  const listId = `${id}-list`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const matches = useMemo(() => {
    const list = matchCities(value)
    // Hide the list once the box already holds exactly that one city
    return list.length === 1 && list[0].name.toLowerCase() === value.trim().toLowerCase() ? [] : list
  }, [value])
  const showList = open && matches.length > 0

  function pick(name) {
    onChange(name)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e) {
    if (!showList) {
      if (e.key === 'ArrowDown' && matches.length) { setOpen(true); setActive(0); e.preventDefault() }
      return
    }
    if (e.key === 'ArrowDown') { setActive((i) => (i + 1) % matches.length); e.preventDefault() }
    else if (e.key === 'ArrowUp') { setActive((i) => (i <= 0 ? matches.length - 1 : i - 1)); e.preventDefault() }
    else if (e.key === 'Enter' && active >= 0) { pick(matches[active].name); e.preventDefault() }   // else: Enter submits the form
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); e.preventDefault() }
  }

  return (
    <div>
      <label htmlFor={`${id}-city`} className="block text-sm font-medium text-slate-700 mb-1.5">Which city?</label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          id={`${id}-city`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
          maxLength={60}
          className={`${INPUT} pl-10 pr-4`}
          placeholder="e.g. Indore, Lucknow, Pune"
        />
        {showList && (
          <ul id={listId} role="listbox" className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-lg border border-line bg-deepsea shadow-lg shadow-black/40 py-1">
            {matches.map((c, i) => (
              <li
                key={c.name}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown (not click) so the input's blur doesn't close the list first
                onMouseDown={(e) => { e.preventDefault(); pick(c.name) }}
                onMouseEnter={() => setActive(i)}
                className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between gap-3 ${i === active ? 'bg-primary-600 text-white' : 'text-slate-700'}`}
              >
                <span className="font-medium">{c.name}</span>
                <span className={`text-xs ${i === active ? 'text-white/80' : 'text-slate-400'}`}>{c.state}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400 mr-1">Popular cities</span>
        {POPULAR_CITIES.map((name) => {
          const isActive = value.trim().toLowerCase() === name.toLowerCase()
          return (
            <button key={name} type="button" aria-pressed={isActive} onClick={() => pick(name)} className={chip(isActive)}>
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
