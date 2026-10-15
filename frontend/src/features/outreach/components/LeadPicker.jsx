import { useId, useMemo, useRef, useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

const MAX_OPTIONS = 50
const scoreTone = (s) => (s >= 70 ? 'bg-marigold-500 text-abyss' : s >= 40 ? 'bg-primary-600 text-white' : 'bg-line text-slate-700')

/**
 * Searchable lead picker: type to filter by name or city, Up / Down / Enter / Escape.
 * Each option shows a score badge and the city.
 */
export default function LeadPicker({ leads, value, onChange }) {
  const id = useId()
  const inputRef = useRef(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const selected = leads.find((l) => String(l.id) === String(value))

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? leads.filter((l) => l.name.toLowerCase().includes(q) || (l.location || '').toLowerCase().includes(q))
      : [...leads].sort((a, b) => b.score - a.score)
    return list.slice(0, MAX_OPTIONS)
  }, [leads, query])

  function pick(lead) {
    onChange(String(lead.id))
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((i) => Math.min(i + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && open && matches[active]) { e.preventDefault(); pick(matches[active]) }
    else if (e.key === 'Escape') { setOpen(false); setQuery('') }
  }

  return (
    <div>
      <label htmlFor={`${id}-input`} className="block text-sm font-medium text-slate-700 mb-2">Lead</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && matches[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={open ? query : selected ? `${selected.name}${selected.location ? ` – ${selected.location}` : ''}` : ''}
          placeholder="Type a name or city…"
          onFocus={() => { setOpen(true); setActive(0) }}
          onBlur={() => { setOpen(false); setQuery('') }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0) }}
          onKeyDown={onKeyDown}
          className="w-full pl-10 pr-9 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />

        {open && (
          <ul id={`${id}-list`} role="listbox" className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-lg border border-line bg-deepsea shadow-lg shadow-black/40 py-1">
            {matches.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No lead matches “{query}”.</li>}
            {matches.map((l, i) => (
              <li
                key={l.id}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={String(l.id) === String(value)}
                onMouseDown={(e) => { e.preventDefault(); pick(l) }}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer ${i === active ? 'bg-inset' : ''}`}
              >
                <span className={`shrink-0 w-8 text-center rounded-full text-[11px] font-bold py-0.5 ${scoreTone(l.score)}`}>{l.score}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800 truncate">{l.name}</span>
                  <span className="block text-xs text-slate-500 truncate">{l.location || 'No city'}{l.category ? ` · ${l.category}` : ''}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
