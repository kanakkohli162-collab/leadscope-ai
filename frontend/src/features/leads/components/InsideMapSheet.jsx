import { useEffect, useState } from 'react'
import { Search, X, MapPin, Phone, Globe, Clock, ChevronDown, ChevronRight, UtensilsCrossed, Coffee, Pizza, Soup } from 'lucide-react'

/*
 * "Map list -> place -> lead sheet" preview for the "Inside LeadScope" part (full width).
 * Light blue frame, white card, blue round button (colours from the reference image).
 * It moves through the businesses on its own; hovering a business or a row selects it.
 */
const K = {
  bg: '#E9F5FF', card: '#FFFFFF', blue: '#447EFC', blueSoft: '#E8F1FF', ink: '#202124',
  muted: '#5F6368', line: '#EBEBEB', head: '#484E53', panel: '#99D0E0', red: '#C5221F', green: '#188038',
}

const PLACES = [
  { name: 'Neelkamal Restaurant', type: 'North Indian', area: 'RNT Marg', phone: '+91 98260 11223', site: '', hours: 'Opens 11 AM', score: 100, icon: UtensilsCrossed, tint: '#FCE8D5' },
  { name: 'Shree Sweets & Snacks', type: 'Sweet shop', area: 'Vijay Nagar', phone: '+91 97540 44121', site: '', hours: '', score: 86, icon: Soup, tint: '#FDF3C9' },
  { name: 'Cafe Mocha Point', type: 'Cafe', area: 'Palasia', phone: '', site: 'cafemocha.in', hours: 'Opens 9 AM', score: 58, icon: Coffee, tint: '#E3F1E6' },
  { name: 'Pizza Corner', type: 'Pizza', area: 'Bhawarkua', phone: '+91 88710 22345', site: 'pizzacorner.co.in', hours: 'Opens 12 PM', score: 22, icon: Pizza, tint: '#FBE4E6' },
]

const CSS = `
@keyframes ims-scan { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
@keyframes ims-pulse { 0% { box-shadow: 0 0 0 0 rgba(68,126,252,.5); } 100% { box-shadow: 0 0 0 14px rgba(68,126,252,0); } }
@keyframes ims-in { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: none; } }
@keyframes ims-bob { 0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(2px); } }
.ims-scan { position: absolute; left: 0; right: 0; height: 32px; pointer-events: none;
  background: linear-gradient(180deg, rgba(68,126,252,0), rgba(68,126,252,.14), rgba(68,126,252,0));
  animation: ims-scan 2.4s ease-in-out infinite; }
.ims-pulse { animation: ims-pulse 1.6s ease-out infinite; }
.ims-in { animation: ims-in .45s ease-out both; }
.ims-frame { transition: transform .45s cubic-bezier(.2,.7,.2,1), box-shadow .45s ease; }
.ims-frame:hover { transform: translateY(-5px); box-shadow: 0 30px 60px -30px rgba(68,126,252,.55); }
.ims-item { transition: background-color .2s ease; }
.ims-frame:hover .ims-arrows { animation: ims-bob 1s ease-in-out infinite; }
@keyframes ims-bob-r { 0%, 100% { transform: translateX(-2px); } 50% { transform: translateX(2px); } }
.ims-frame:hover .ims-arrows-r { animation: ims-bob-r 1s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .ims-scan, .ims-pulse, .ims-in, .ims-frame:hover .ims-arrows, .ims-frame:hover .ims-arrows-r { animation: none !important; }
  .ims-frame, .ims-item { transition: none !important; }
  .ims-frame:hover { transform: none; }
}
`

function Score({ value }) {
  const hot = value >= 70
  return (
    <span className="inline-flex items-center justify-center min-w-[32px] rounded-full px-2 py-0.5 text-[11px] font-bold"
      style={{ background: hot ? '#FFF1D6' : value >= 40 ? K.blueSoft : '#F1F3F4', color: hot ? '#9A6508' : value >= 40 ? K.blue : K.muted }}>
      {value}
    </span>
  )
}

export default function InsideMapSheet() {
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (hovering || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setActive((a) => (a + 1) % PLACES.length), 2400)
    return () => clearInterval(t)
  }, [hovering])

  const P = PLACES[active]
  const cell = { borderBottom: `1px solid ${K.line}` }

  return (
    <div className="ims-frame rounded-3xl p-3 sm:p-5" style={{ background: K.bg }}
      onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <style>{CSS}</style>
      <div className="rounded-2xl p-3 sm:p-4" style={{ background: K.card }}>

        <div className="grid sm:grid-cols-2 lg:grid-cols-[0.9fr_0.9fr_auto_1.7fr] gap-3 lg:gap-4 items-stretch [&>*]:min-w-0">
          {/* 1. map list */}
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${K.line}` }}>
            <div className="m-2.5 flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] shadow-sm" style={{ border: `1px solid ${K.line}`, color: K.ink }}>
              <span className="flex-1 truncate">restaurants in Indore</span>
              <Search size={14} color={K.muted} /><X size={14} color={K.muted} />
            </div>
            <ul>
              {PLACES.map((p, i) => (
                <li key={p.name}>
                  <button type="button" onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)} onClick={() => setActive(i)}
                    className="ims-item w-full flex items-center gap-2.5 px-2.5 py-2 text-left"
                    style={{ background: i === active ? K.blueSoft : 'transparent', borderTop: `1px solid ${K.line}` }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate" style={{ color: K.ink }}>{p.name}</p>
                      <p className="text-[10px] truncate" style={{ color: K.muted }}>{p.type}, {p.area}</p>
                      <p className="text-[10px]" style={{ color: p.site ? K.green : K.red }}>{p.site ? 'Website listed' : 'No website'}</p>
                    </div>
                    <span className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: p.tint }}>
                      <p.icon size={17} color={K.head} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 2. selected place */}
          <div className="rounded-xl overflow-hidden flex flex-col" style={{ border: `3px solid ${K.panel}` }}>
            <div key={`img-${active}`} className="ims-in h-24 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${P.tint}, #fff)` }}>
              <P.icon size={44} color={K.head} strokeWidth={1.3} />
            </div>
            <div key={`info-${active}`} className="ims-in p-3 flex-1">
              <p className="text-[15px] font-semibold" style={{ color: K.ink }}>{P.name}</p>
              <p className="text-[11px]" style={{ color: K.muted }}>{P.type} in {P.area}, Indore</p>
              <ul className="mt-2.5 space-y-1.5 text-[11px]" style={{ color: K.ink }}>
                <li className="flex items-center gap-2"><MapPin size={13} color={K.blue} /> {P.area}, Indore</li>
                <li className="flex items-center gap-2"><Phone size={13} color={K.blue} /> {P.phone || <span style={{ color: K.red }}>No phone listed</span>}</li>
                <li className="flex items-center gap-2"><Globe size={13} color={K.blue} /> {P.site || <span style={{ color: K.red }}>No website</span>}</li>
                <li className="flex items-center gap-2"><Clock size={13} color={K.blue} /> {P.hours || <span style={{ color: K.red }}>Hours missing</span>}</li>
              </ul>
            </div>
          </div>

          {/* 3. round blue button */}
          <div className="sm:col-span-2 lg:col-span-1 flex lg:flex-col items-center gap-3">
            <span className="flex-1 h-px lg:h-auto lg:w-px" style={{ background: K.line }} />
            <span className="ims-pulse w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: K.blue }}
              title="LeadScope turns listings into a scored sheet">
              <span className="ims-arrows flex flex-col items-center leading-none lg:hidden">
                <ChevronDown size={14} className="-mb-1.5" /><ChevronDown size={14} />
              </span>
              <span className="ims-arrows-r hidden lg:flex items-center leading-none">
                <ChevronRight size={14} className="-mr-1.5" /><ChevronRight size={14} />
              </span>
            </span>
            <span className="flex-1 h-px lg:h-auto lg:w-px" style={{ background: K.line }} />
          </div>

          {/* 4. lead sheet */}
          <div className="sm:col-span-2 lg:col-span-1 relative rounded-xl overflow-hidden flex flex-col" style={{ border: `1px solid ${K.line}` }}>
            {hovering && <div className="ims-scan" aria-hidden="true" />}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr style={{ color: K.head, background: '#F8F9FA' }}>
                    {['Business', 'Area', 'Phone', 'Website', 'Score'].map((h) => (
                      <th key={h} className={`px-3 py-2.5 font-semibold whitespace-nowrap ${h === 'Area' ? 'hidden 2xl:table-cell' : ''}`} style={cell}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLACES.map((p, i) => {
                    const on = i === active
                    return (
                      <tr key={p.name} onMouseEnter={() => setActive(i)} className="ims-item cursor-default"
                        style={{ background: on ? K.blueSoft : 'transparent', color: K.ink }}>
                        <td className="px-3 py-3 whitespace-nowrap font-medium" style={{ ...cell, boxShadow: on ? `inset 3px 0 0 ${K.blue}` : 'none' }}>{p.name}</td>
                        <td className="px-3 py-3 whitespace-nowrap hidden 2xl:table-cell" style={cell}>{p.area}</td>
                        <td className="px-3 py-3 whitespace-nowrap" style={{ ...cell, color: p.phone ? K.ink : K.red }}>{p.phone || 'null'}</td>
                        <td className="px-3 py-3 whitespace-nowrap" style={{ ...cell, color: p.site ? K.ink : K.red }}>{p.site || 'null'}</td>
                        <td className="px-3 py-3" style={cell}><Score value={p.score} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-auto px-3 py-3 text-[11px]" style={{ color: K.muted }}>Sorted by score. Missing details push a business higher.</p>
          </div>
        </div>
      </div>
    </div>
  )
}