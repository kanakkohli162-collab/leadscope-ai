import { useEffect, useRef, useState } from 'react'
import {
  Search, X, MapPin, Phone, Globe, Clock, ChevronLeft, ChevronRight, ChevronDown,
  Navigation, Bookmark, Compass, Smartphone, Share2, Tag, ListFilter,
} from 'lucide-react'

/*
 * Hero "before / after" slider (Octoparse-style).
 * Bottom layer: a map-style listing (list, place panel, map).
 * Top layer: the clean LeadScope sheet, visible to the right of the handle.
 * Drag the round blue handle, or use the arrow keys. It glides until touched.
 * Pictures are drawn in code (no photos), and only data LeadScope really has is shown.
 */
const K = {
  frame: '#E9F5FF', card: '#FFFFFF', blue: '#447EFC', blueSoft: '#E8F1FF', ink: '#202124',
  muted: '#5F6368', line: '#EBEBEB', head: '#484E53', panel: '#99D0E0', red: '#C5221F', green: '#188038',
}

const PLACES = [
  { name: 'Neelkamal Restaurant', type: 'North Indian restaurant', area: 'RNT Marg', pin: '452001', phone: '+91 98260 11223', site: '', hours: 'Opens 11 AM', score: 100, awning: '#C0392B', wall: '#F4E1C1', note: 'Family restaurant serving thalis and tandoor dishes.', service: 'Dine-in · Takeaway' },
  { name: 'Shree Sweets & Snacks', type: 'Sweet shop', area: 'Vijay Nagar', pin: '452010', phone: '+91 97540 44121', site: '', hours: '', score: 86, awning: '#E67E22', wall: '#FBEFD5', note: 'Sweets, namkeen and morning snacks.', service: 'Takeaway' },
  { name: 'Cafe Mocha Point', type: 'Cafe', area: 'Palasia', pin: '452001', phone: '', site: 'cafemocha.in', hours: 'Opens 9 AM', score: 58, awning: '#2E7D5B', wall: '#E6F0E8', note: 'Coffee, sandwiches and desserts.', service: 'Dine-in · Takeaway' },
  { name: 'Urban Tadka Cafe', type: 'Fast food restaurant', area: 'Sapna Sangeeta', pin: '452001', phone: '+91 99930 88010', site: 'urbantadka.com', hours: '', score: 41, awning: '#2C5AA0', wall: '#E5EBF6', note: 'Burgers, rolls and Indo-Chinese.', service: 'Dine-in · Delivery' },
  { name: 'Pizza Corner', type: 'Pizza restaurant', area: 'Bhawarkua', pin: '452014', phone: '+91 88710 22345', site: 'pizzacorner.co.in', hours: 'Opens 12 PM', score: 22, awning: '#8E2C48', wall: '#F6E3E8', note: 'Pizzas, pasta and shakes.', service: 'Dine-in · Delivery' },
]
const MORE = [
  { name: 'Apna Dhaba', area: 'AB Road', pin: '452008', phone: '+91 94250 77310', site: '', score: 93 },
  { name: 'Royal Biryani House', area: 'Khajrana', pin: '452016', phone: '+91 98930 41207', site: '', score: 79 },
  { name: 'Green Leaf Veg', area: 'Rajwada', pin: '452002', phone: '', site: 'greenleafveg.in', score: 64 },
  { name: 'Chai Adda', area: 'Bhanwarkuan', pin: '452014', phone: '+91 90090 55402', site: 'chaiadda.in', score: 33 },
  { name: 'The Bake Studio', area: 'Saket Nagar', pin: '452018', phone: '+91 97527 61133', site: 'bakestudio.in', score: 15 },
  { name: 'Sagar Bhojnalaya', area: 'Sarafa', pin: '452002', phone: '+91 93021 16654', site: '', score: 90 },
  { name: 'Momo Junction', area: 'Bhawarkua', pin: '452014', phone: '', site: '', score: 82 },
  { name: 'Dosa Plaza', area: 'Vijay Nagar', pin: '452010', phone: '+91 98272 30419', site: 'dosaplaza.in', score: 27 },
]
const SHEET = [...PLACES, ...MORE].sort((a, b) => b.score - a.score)

const CSS = `
@keyframes hms-pulse { 0% { box-shadow: 0 0 0 0 rgba(68,126,252,.55); } 100% { box-shadow: 0 0 0 16px rgba(68,126,252,0); } }
.hms-handle { animation: hms-pulse 1.8s ease-out infinite; transition: transform .2s ease; }
.hms-wrap:hover .hms-handle, .hms-handle:focus-visible { transform: translate(-50%, -50%) scale(1.12); }
.hms-handle:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
@media (prefers-reduced-motion: reduce) { .hms-handle { animation: none; transition: none; } }
`

/* A small drawn shop front, used instead of a photo */
function Storefront({ awning, wall, className = '' }) {
  const stripes = Array.from({ length: 8 }, (_, i) => i)
  return (
    <svg viewBox="0 0 160 100" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="160" height="100" fill="#DCE9F5" />
      <rect x="0" y="70" width="160" height="30" fill="#C9C3B8" />
      <rect x="14" y="14" width="132" height="62" fill={wall} />
      <rect x="22" y="20" width="116" height="12" rx="2" fill="#3B3B3B" />
      <rect x="30" y="24" width="60" height="4" rx="2" fill="#F5D76E" />
      {stripes.map((i) => (
        <path key={i} d={`M${14 + i * 16.5} 34 h16.5 l-2 12 a6 6 0 0 1 -12.5 0 z`} fill={i % 2 ? '#fff' : awning} />
      ))}
      <rect x="24" y="50" width="46" height="24" fill="#9CC3DE" stroke="#6B5B4B" strokeWidth="2" />
      <rect x="90" y="50" width="22" height="26" fill="#6B4F3A" />
      <rect x="118" y="50" width="20" height="16" fill="#9CC3DE" stroke="#6B5B4B" strokeWidth="2" />
      <circle cx="44" cy="62" r="5" fill="#F0B27A" opacity=".8" />
      <rect x="6" y="64" width="8" height="12" rx="3" fill="#4C8B4A" />
      <rect x="146" y="64" width="8" height="12" rx="3" fill="#4C8B4A" />
    </svg>
  )
}

function Score({ value }) {
  const hot = value >= 70
  return (
    <span className="inline-flex items-center justify-center min-w-[28px] rounded-full px-1.5 py-[1px] text-[9.5px] font-bold"
      style={{ background: hot ? '#FFF1D6' : value >= 40 ? K.blueSoft : '#F1F3F4', color: hot ? '#9A6508' : value >= 40 ? K.blue : K.muted }}>
      {value}
    </span>
  )
}

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-1 text-[9px] font-medium bg-white"
      style={{ border: `1px solid ${K.line}`, color: K.ink }}>
      {Icon && <Icon size={10} />}{children}<ChevronDown size={9} />
    </span>
  )
}

export default function HeroMapSlider() {
  const box = useRef(null)
  const [pos, setPos] = useState(55)
  const [touched, setTouched] = useState(false)
  const [paused, setPaused] = useState(false)
  const dragging = useRef(false)

  useEffect(() => {
    if (touched || paused || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf
    const start = performance.now()
    const tick = (t) => {
      setPos(55 + Math.sin((t - start) / 1500) * 13)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [touched, paused])

  const moveTo = (clientX) => {
    const r = box.current.getBoundingClientRect()
    setPos(Math.min(96, Math.max(4, ((clientX - r.left) / r.width) * 100)))
  }
  const onDown = (e) => { dragging.current = true; setTouched(true); e.currentTarget.setPointerCapture?.(e.pointerId); moveTo(e.clientX) }
  const onMove = (e) => { if (dragging.current) moveTo(e.clientX) }
  const onUp = () => { dragging.current = false }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') { setTouched(true); setPos((p) => Math.max(4, p - 5)) }
    if (e.key === 'ArrowRight') { setTouched(true); setPos((p) => Math.min(96, p + 5)) }
  }

  const P = PLACES[0]
  const cell = { borderBottom: `1px solid ${K.line}` }

  return (
    <div className="rounded-[26px] p-2.5 sm:p-3" style={{ background: K.frame, boxShadow: '0 40px 90px -30px rgba(0,0,0,.65)' }}>
      <style>{CSS}</style>
      <div ref={box} className="hms-wrap relative rounded-[18px] overflow-hidden select-none touch-none cursor-ew-resize h-[400px] sm:h-[460px]"
        style={{ background: K.card }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onMouseEnter={() => setPaused(true)} onMouseLeave={() => { setPaused(false); onUp() }}>

        {/* ================= BOTTOM LAYER: map-style listing ================= */}
        <div className="absolute inset-0 flex">

          {/* 1. result list */}
          <div className="w-[48%] sm:w-[34%] h-full overflow-hidden flex flex-col" style={{ borderRight: `1px solid ${K.line}` }}>
            <div className="m-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10.5px] shadow-sm" style={{ border: `1px solid ${K.line}`, color: K.ink }}>
              <span className="flex-1 truncate">restaurant</span>
              <Search size={12} color={K.muted} /><X size={12} color={K.muted} />
            </div>
            {PLACES.map((p) => (
              <div key={p.name} className="px-2.5 py-2" style={{ borderTop: `1px solid ${K.line}` }}>
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10.5px] font-semibold truncate" style={{ color: K.ink }}>{p.name}</p>
                    <p className="text-[9px] truncate" style={{ color: K.muted }}>{p.type} · {p.area}</p>
                    <p className="text-[9px] truncate" style={{ color: K.muted }}>{p.note}</p>
                    <p className="text-[9px]" style={{ color: p.hours ? K.green : K.red }}>{p.hours || 'Hours not listed'}</p>
                  </div>
                  <Storefront awning={p.awning} wall={p.wall} className="shrink-0 w-12 h-12 rounded-md" />
                </div>
                <div className="mt-1.5 flex gap-1.5">
                  <span className="flex-1 text-center rounded-full py-[3px] text-[8px] font-semibold" style={{ border: `1px solid ${K.blue}`, color: K.blue }}>CALL</span>
                  <span className="flex-1 text-center rounded-full py-[3px] text-[8px] font-semibold" style={{ border: `1px solid ${K.blue}`, color: K.blue }}>DIRECTIONS</span>
                </div>
              </div>
            ))}
          </div>

          {/* 2. filters + place panel */}
          <div className="w-[52%] sm:w-[36%] h-full overflow-hidden flex flex-col">
            <div className="flex gap-1 px-1.5 py-1.5 overflow-hidden" style={{ background: K.blueSoft }}>
              <Chip icon={Tag}>Category</Chip><Chip icon={Globe}>Website</Chip><Chip icon={Phone}>Phone</Chip><Chip icon={Clock}>Hours</Chip>
            </div>
            <div className="flex-1 overflow-hidden" style={{ boxShadow: `inset 0 0 0 3px ${K.panel}` }}>
              <div className="relative h-28 sm:h-32">
                <Storefront awning={P.awning} wall={P.wall} className="w-full h-full" />
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow"><X size={11} color={K.ink} /></span>
              </div>
              <div className="px-3 pt-2">
                <p className="text-[13px] font-semibold" style={{ color: K.ink }}>{P.name}</p>
                <p className="text-[9.5px]" style={{ color: K.muted }}>{P.type}</p>
                <div className="mt-1.5 flex gap-4 text-[9.5px] font-medium" style={{ borderBottom: `1px solid ${K.line}` }}>
                  <span className="pb-1" style={{ color: K.blue, borderBottom: `2px solid ${K.blue}` }}>Overview</span>
                  <span style={{ color: K.muted }}>About</span>
                </div>
                <div className="mt-2 grid grid-cols-5 gap-1 text-center">
                  {[[Navigation, 'Directions'], [Bookmark, 'Save'], [Compass, 'Nearby'], [Smartphone, 'Send to phone'], [Share2, 'Share']].map(([Icon, t], i) => (
                    <div key={t} className="flex flex-col items-center gap-0.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={i === 0 ? { background: K.blue, color: '#fff' } : { border: `1px solid ${K.panel}`, color: K.blue }}><Icon size={11} /></span>
                      <span className="text-[7px] leading-tight" style={{ color: K.blue }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <span className="flex-1 text-center rounded-full py-[3px] text-[8px] font-semibold" style={{ border: `1px solid ${K.blue}`, color: K.blue }}>CALL</span>
                  <span className="flex-1 text-center rounded-full py-[3px] text-[8px] font-semibold" style={{ border: `1px solid ${K.blue}`, color: K.blue }}>ADD TO LEADS</span>
                </div>
                <p className="mt-2 text-[9px]" style={{ color: K.ink }}>{P.note}</p>
                <p className="text-[8.5px]" style={{ color: K.muted }}>✓ {P.service}</p>
                <ul className="mt-2 space-y-1.5 text-[9px]" style={{ color: K.ink }}>
                  <li className="flex items-center gap-2"><MapPin size={11} color={K.blue} /> {P.area}, Indore, MP {P.pin}</li>
                  <li className="flex items-center gap-2"><Clock size={11} color={K.blue} /> {P.hours}</li>
                  <li className="flex items-center gap-2"><Phone size={11} color={K.blue} /> {P.phone}</li>
                  <li className="flex items-center gap-2"><Globe size={11} color={K.blue} /> <span style={{ color: K.red }}>No website</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. drawn map */}
          <div className="hidden sm:block flex-1 h-full relative overflow-hidden" style={{ background: '#EEF1F4' }}>
            <svg viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
              <rect x="8" y="20" width="38" height="30" rx="3" fill="#CDE8C8" />
              <path d="M60 0 C70 40 50 70 72 110 S80 170 64 200" fill="none" stroke="#AED4F0" strokeWidth="9" />
              <path d="M0 80 H100 M0 145 H100 M30 0 V200 M85 0 V200" stroke="#fff" strokeWidth="5" />
              <path d="M0 115 L100 60" stroke="#FCE7A8" strokeWidth="6" />
              <rect x="40" y="160" width="26" height="22" rx="3" fill="#CDE8C8" />
            </svg>
            {[[28, 18], [58, 38], [36, 58], [66, 76], [22, 86]].map(([l, t], i) => (
              <MapPin key={i} size={16} className="absolute" style={{ left: `${l}%`, top: `${t}%`, color: '#EA4335' }} fill="#EA4335" stroke="#fff" />
            ))}
            <span className="absolute right-2 bottom-2 w-6 h-6 rounded bg-white shadow flex items-center justify-center text-[11px] font-bold" style={{ color: K.muted }}>+</span>
          </div>
        </div>

        {/* ================= TOP LAYER: LeadScope sheet ================= */}
        <div className="absolute inset-0" style={{ background: K.card, clipPath: `inset(0 0 0 ${pos}%)` }} aria-label="Lead sheet made by LeadScope">
          <table className="w-full text-[10px] text-left table-fixed">
            <colgroup>
              <col style={{ width: '23%' }} /><col style={{ width: '22%' }} /><col style={{ width: '8%' }} />
              <col style={{ width: '6%' }} /><col style={{ width: '18%' }} /><col style={{ width: '16%' }} /><col style={{ width: '7%' }} />
            </colgroup>
            <thead>
              <tr style={{ color: K.ink, background: '#F1F5FB' }}>
                {['Business', 'Address', 'City', 'State', 'Website', 'Phone', 'Score'].map((h) => (
                  <th key={h} className="px-1.5 py-1.5 font-bold whitespace-nowrap" style={cell}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHEET.map((p, i) => (
                <tr key={p.name} style={{ color: K.ink, background: i % 2 ? '#FAFBFD' : '#fff' }}>
                  <td className="px-1.5 py-[5px] truncate font-medium" style={cell}>{p.name}</td>
                  <td className="px-1.5 py-[5px] truncate" style={cell}>{p.area}, Indore {p.pin}</td>
                  <td className="px-1.5 py-[5px] truncate" style={cell}>Indore</td>
                  <td className="px-1.5 py-[5px] truncate" style={cell}>MP</td>
                  <td className="px-1.5 py-[5px] truncate" style={{ ...cell, color: p.site ? K.ink : K.red }}>{p.site ? `https://${p.site}` : 'null'}</td>
                  <td className="px-1.5 py-[5px] truncate" style={{ ...cell, color: p.phone ? K.ink : K.red }}>{p.phone || 'null'}</td>
                  <td className="px-1.5 py-[5px]" style={cell}><Score value={p.score} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ================= divider + round handle ================= */}
        <div className="absolute top-0 bottom-0 w-[2px] -ml-px pointer-events-none" style={{ left: `${pos}%`, background: K.blue }} />
        <button type="button" role="slider" aria-label="Compare map listing and lead sheet"
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)} onKeyDown={onKey}
          className="hms-handle absolute top-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white"
          style={{ left: `${pos}%`, transform: 'translate(-50%, -50%)', background: K.blue }}>
          <ChevronLeft size={18} className="-mr-1" /><ChevronRight size={18} className="-ml-1" />
        </button>
      </div>
      <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: '#5F7A93' }}>
        <ListFilter size={13} /> Drag the handle: map listing on the left, LeadScope sheet on the right
      </p>
    </div>
  )
}
