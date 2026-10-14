import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, Search, Gauge, Lightbulb, Wand2, Check, MapPin, ArrowRight, ChevronDown, Play,
  Mail, MessageCircle, Linkedin, ShieldCheck, Lock, KeyRound, Users,
  Globe, Database, Server, Cpu, Map, Layers, Code2, Target, BarChart3,
} from 'lucide-react'
import { getCurrentUser } from '@/utils/currentUser'

/* ---------- colours: deep ocean theme (taken from the reference image) ---------- */
const C = {
  night: '#01081A',    // abyss: page background
  indigo: '#001C36',   // deep sea: sections
  blue: '#0497F6',     // azure: buttons, links
  blueDark: '#0080DD', // azure hover
  violet: '#4EB9E5',   // aqua glow
  glow: '#75DFFF',     // light aqua glow
  lavender: '#001C36', // section panels (dark)
  card: '#113E62',     // cards
  inset: '#0B3354',    // boxes inside cards
  ink: '#E6F1F7',      // headings / main text
  muted: '#9DB8CF',    // secondary text
  line: '#1B4C74',     // borders
  hot: '#F5A524',      // ONLY for hot lead scores
}
const display = "font-['Bricolage_Grotesque',_Figtree,_system-ui,_sans-serif]"

/* ---------- animations ---------- */
const CSS = `
@keyframes ls-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes ls-slide { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
@keyframes ls-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes ls-glow { 0%, 100% { opacity: .85; } 50% { opacity: 1; } }
@keyframes ls-blink { 50% { opacity: 0; } }
.ls-rise  { opacity: 0; animation: ls-rise .8s cubic-bezier(.2,.7,.2,1) forwards; }
.ls-slide { opacity: 0; animation: ls-slide .6s cubic-bezier(.2,.7,.2,1) forwards; }
.ls-float { animation: ls-float 6s ease-in-out infinite; }
.ls-glow  { animation: ls-glow 4s ease-in-out infinite; }
.ls-caret { display:inline-block; width:2px; height:1em; background:${C.blue}; margin-left:2px; vertical-align:-2px; animation: ls-blink 1s step-end infinite; }
.ls-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); }
.ls-reveal.is-visible { opacity: 1; transform: none; }
.ls-lift { transition: transform .25s ease, box-shadow .25s ease; }
.ls-lift:hover { transform: translateY(-4px); box-shadow: 0 22px 44px -22px rgba(4,151,246,.55); }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  .ls-rise, .ls-slide, .ls-reveal { opacity:1 !important; transform:none !important; animation:none !important; transition:none !important; }
  .ls-float, .ls-glow, .ls-caret { animation: none !important; }
  .ls-lift:hover { transform: none; }
  html { scroll-behavior: auto; }
}
`
const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ---------- helpers ---------- */
function Reveal({ children, className = '', delay = 0, as: Tag = 'div', style, ...rest }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reducedMotion() || !('IntersectionObserver' in window)) { setVisible(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`ls-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }} {...rest}>{children}</Tag>
  )
}

function Ring({ value, size = 40, delay = 400, dark = false }) {
  const [shown, setShown] = useState(reducedMotion() ? value : 0)
  useEffect(() => {
    if (reducedMotion()) return
    const t = setTimeout(() => setShown(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  const stroke = 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 70 ? C.hot : value >= 40 ? C.blue : '#5E7F9C'
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,.12)' : C.line} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${display}`} style={{ color: dark ? '#fff' : C.ink }}>{value}</span>
    </div>
  )
}

function TypingText({ text, startDelay = 1400, speed = 18 }) {
  const [count, setCount] = useState(reducedMotion() ? text.length : 0)
  useEffect(() => {
    if (reducedMotion()) return
    let iv
    const st = setTimeout(() => {
      iv = setInterval(() => setCount((n) => { if (n >= text.length) { clearInterval(iv); return n } return n + 1 }), speed)
    }, startDelay)
    return () => { clearTimeout(st); clearInterval(iv) }
  }, [text, startDelay, speed])
  return <>{text.slice(0, count)}{count < text.length && <span className="ls-caret" aria-hidden="true" />}</>
}

function BlueButton({ to, state, children, className = '' }) {
  return (
    <Link to={to} state={state}
      className={`inline-flex items-center justify-center gap-2 rounded-md text-white font-semibold hover:-translate-y-0.5 hover:brightness-110 transition-all ${className}`}
      style={{ background: C.blue, boxShadow: '0 12px 30px -12px rgba(4,151,246,.8)' }}>
      {children}
    </Link>
  )
}

function Label({ children, light = false }) {
  return <p className="text-xs font-semibold tracking-[0.14em] uppercase" style={{ color: light ? '#75DFFF' : C.blue }}>{children}</p>
}

/* ---------- content ---------- */
const LEADS = [
  { name: 'Neelkamal Restaurant', area: 'RNT Marg, Indore', score: 100, gap: 'No website' },
  { name: 'Shree Sweets & Snacks', area: 'Vijay Nagar, Indore', score: 86, gap: 'No website' },
  { name: 'Urban Tadka Café', area: 'Palasia, Indore', score: 41, gap: 'Profile incomplete' },
]
const AI_MESSAGE =
  "Hi Neelkamal team, I noticed you don't have a website yet. Many people in Indore search online before choosing where to eat. We build simple restaurant websites with a menu and Google listing. Can I share a quick sample?"

const POWERED_BY = [
  { icon: Map, name: 'OpenStreetMap' }, { icon: Globe, name: 'Geoapify' },
  { icon: Sparkles, name: 'Gemini AI' }, { icon: Database, name: 'MySQL' }, { icon: Server, name: 'Spring Boot' },
]

const MINI_FEATURES = [
  { icon: Search, title: 'Lead Finder', text: 'Real local businesses in any city.' },
  { icon: Target, title: 'Lead Scoring', text: '0–100 score from digital gaps.' },
  { icon: Wand2, title: 'AI Messages', text: 'First message written for you.' },
]

const STATS = [
  { icon: Search, big: '500', small: 'Businesses per search' },
  { icon: Gauge, big: '0–100', small: 'Lead score' },
  { icon: MessageCircle, big: '3', small: 'Outreach channels' },
  { icon: Sparkles, big: '₹0', small: 'To get started' },
]

const TABS = [
  { id: 'find', icon: Search, label: 'Find', title: 'Find real businesses in any city',
    text: 'Type a city and a business type. LeadScope pulls real local businesses with their address, phone and website.',
    points: ['Any city in India', 'Up to 500 businesses per search', 'Filter by priority and website'] },
  { id: 'score', icon: Gauge, label: 'Score', title: 'See who needs you most',
    text: 'Every business gets a score from 0 to 100 based on its digital gaps, so the best opportunities come first.',
    points: ['No website check', 'Business profile check', 'High, Medium and Low priority'] },
  { id: 'why', icon: Lightbulb, label: 'Explain', title: 'Know exactly what to pitch',
    text: 'Each lead shows plain-language reasons and the service to offer first. No guesswork before the first call.',
    points: ['Opportunities listed per lead', 'Suggested first service', 'Notes on every lead'] },
  { id: 'write', icon: Wand2, label: 'Write', title: 'Send the first message with AI',
    text: 'Gemini AI writes a personal email, WhatsApp or LinkedIn message for each lead. Edit it, copy it, send it.',
    points: ['Email, WhatsApp and LinkedIn', 'Edit before sending', 'One-click WhatsApp open'] },
]

const EXAMPLES = [
  { city: 'Noida', type: 'Dentist' }, { city: 'Lucknow', type: 'Gym' }, { city: 'Indore', type: 'Restaurant' },
  { city: 'Jaipur', type: 'Salon' }, { city: 'Chandigarh', type: 'Cafe' },
]

const SECURITY = [
  { icon: Lock, text: 'Passwords stored as BCrypt hashes' },
  { icon: KeyRound, text: 'Secure sign-in with JWT tokens' },
  { icon: ShieldCheck, text: '15-minute lock after 5 wrong passwords' },
  { icon: Users, text: 'Every user sees only their own leads' },
]

const BUILT_WITH = [
  { icon: Code2, name: 'React' }, { icon: Layers, name: 'Tailwind CSS' },
  { icon: Server, name: 'Spring Boot' }, { icon: Cpu, name: 'Java 21' },
  { icon: Database, name: 'MySQL' }, { icon: Sparkles, name: 'Gemini AI' },
  { icon: Map, name: 'OpenStreetMap' }, { icon: Globe, name: 'Geoapify' },
]

const FAQS = [
  { q: 'Where does the business data come from?',
    a: 'Business names, addresses, phones, websites and opening hours come from OpenStreetMap through the Geoapify Places API. The app can also use Google Places when a key is added.' },
  { q: 'How is the lead score calculated?',
    a: 'Points are added for each digital gap: no website, an incomplete business profile, and (when available) a low rating or few reviews. The total is scaled to 0–100. 70 and above is High priority.' },
  { q: 'Is it free to use?', a: 'Yes. You can sign up without a card and run as many searches as you need.' },
  { q: 'Are the AI messages sent automatically?',
    a: 'No. LeadScope writes the message for you; you review, edit and send it yourself by email, WhatsApp or LinkedIn.' },
  { q: 'Can other users see my leads?',
    a: 'No. Every lead is linked to your account, and the backend only returns leads that belong to the signed-in user.' },
]

/* ---------- mini app screens ---------- */
function MiniLeadList({ dark = false, delayBase = 900 }) {
  return (
    <div className="space-y-2">
      {LEADS.map((l, i) => (
        <div key={l.name} className="ls-slide flex items-center gap-2.5 rounded-xl p-2.5"
          style={{ animationDelay: `${delayBase + i * 160}ms`, background: dark ? 'rgba(255,255,255,.06)' : C.inset, border: dark ? '1px solid rgba(255,255,255,.08)' : `1px solid ${C.line}` }}>
          <Ring value={l.score} size={34} delay={delayBase + 100 + i * 160} dark={dark} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold truncate" style={{ color: dark ? '#fff' : C.ink }}>{l.name}</p>
            <p className="text-[10px] truncate" style={{ color: dark ? '#7FA0BC' : C.muted }}>{l.area}</p>
          </div>
          <span className="hidden sm:inline text-[10px] rounded-md px-1.5 py-0.5" style={{ background: 'rgba(245,165,36,.15)', color: '#FFC870' }}>{l.gap}</span>
        </div>
      ))}
    </div>
  )
}

function TabPreview({ id }) {
  const frame = (title, body) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: C.card, border: `1px solid ${C.line}`, boxShadow: '0 30px 70px -30px rgba(0,0,0,.8)' }}>
      <div className="flex items-center gap-2 px-4 h-10" style={{ borderBottom: `1px solid ${C.line}`, background: C.inset }}>
        <span className="w-3 h-3 rounded-full bg-[#FF6B6B]" /><span className="w-3 h-3 rounded-full bg-[#F5B83D]" /><span className="w-3 h-3 rounded-full bg-[#34C38F]" />
        <span className="ml-4 text-xs" style={{ color: C.muted }}>{title}</span>
      </div>
      <div className="p-5">{body}</div>
    </div>
  )
  if (id === 'find') return frame('leadscope · Find Leads', (
    <>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ border: `1px solid ${C.line}` }}><MapPin size={15} /> Indore</div>
        <div className="flex-1 rounded-xl px-3 py-2.5 text-sm" style={{ border: `1px solid ${C.line}` }}>Restaurant</div>
        <div className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: C.blue }}>Search</div>
      </div>
      <p className="mt-4 mb-2 text-xs" style={{ color: C.muted }}>56 businesses found</p>
      <MiniLeadList delayBase={0} />
    </>
  ))
  if (id === 'score') return frame('leadscope · Lead scores', <MiniLeadList delayBase={0} />)
  if (id === 'why') return frame('leadscope · Lead details', (
    <>
      <div className="flex items-center gap-4">
        <Ring value={100} size={64} delay={200} />
        <div><p className={`text-lg font-bold ${display}`}>Neelkamal Restaurant</p><p className="text-sm" style={{ color: C.muted }}>RNT Marg, Indore</p></div>
      </div>
      <div className="mt-5 rounded-xl p-4" style={{ background: 'rgba(245,165,36,.12)', border: '1px solid rgba(245,165,36,.35)' }}>
        <p className="text-sm font-semibold" style={{ color: '#FFC870' }}>Why this lead?</p>
        <p className="mt-1 text-sm" style={{ color: '#F5D39A' }}>No website and an incomplete business profile.</p>
      </div>
      <div className="mt-3 rounded-xl p-4" style={{ background: C.inset }}>
        <p className="text-sm font-semibold" style={{ color: C.blue }}>Suggested pitch</p>
        <p className="mt-1 text-sm" style={{ color: C.muted }}>Website development + Google profile setup</p>
      </div>
    </>
  ))
  return frame('leadscope · Write Message', (
    <>
      <div className="flex gap-2">
        {[{ i: Mail, t: 'Email' }, { i: MessageCircle, t: 'WhatsApp' }, { i: Linkedin, t: 'LinkedIn' }].map(({ i: Icon, t }, k) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={k === 1 ? { background: C.blue, color: '#fff' } : { background: C.inset, color: C.muted }}><Icon size={13} /> {t}</span>
        ))}
      </div>
      <div className="mt-4 rounded-xl p-4 text-sm leading-relaxed min-h-[150px]" style={{ border: `1px solid ${C.line}`, color: '#CFDEEA' }}>
        <TypingText text={AI_MESSAGE} startDelay={250} speed={14} />
      </div>
    </>
  ))
}

/* ---------- page ---------- */
export default function LandingPage() {
  const navigate = useNavigate()
  const loggedIn = Boolean(getCurrentUser()?.email)
  const startTo = loggedIn ? '/lead-discovery' : '/login'
  const startState = loggedIn ? undefined : { mode: 'signup' }

  const [activeTab, setActiveTab] = useState('find')
  const tab = TABS.find((t) => t.id === activeTab)
  const [tryCity, setTryCity] = useState('')
  const [tryType, setTryType] = useState('')
  const [openFaq, setOpenFaq] = useState(0)

  function handleTry(e) {
    e.preventDefault()
    navigate(startTo, { state: startState })
  }

  return (
    <div className="min-h-screen font-['Figtree',_system-ui,_sans-serif] overflow-x-hidden" style={{ background: C.night, color: C.ink }}>
      <style>{CSS}</style>

      {/* ================= DARK HERO ================= */}
      <section className="relative overflow-hidden" style={{ background: 'radial-gradient(70% 85% at 72% 40%, #0B4A7A 0%, #001C36 45%, #01081A 85%)' }}>
        {/* Top bar */}
        <header className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <Link to="/" className={`text-2xl font-bold text-white ${display}`}>
            LeadScope<span style={{ color: C.blue }}>.</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-8 text-[15px]" style={{ color: '#B5CBDD' }}>
            <a href="#about" className="text-white font-medium relative after:absolute after:left-0 after:-bottom-2 after:h-0.5 after:w-full after:bg-[#0497F6]">Home</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#try" className="hover:text-white transition-colors">Try it</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            {!loggedIn && <Link to="/login" className="hidden sm:inline text-[15px] font-medium text-white/80 hover:text-white">Log in</Link>}
            <BlueButton to={loggedIn ? '/dashboard' : '/login'} state={loggedIn ? undefined : { mode: 'signup' }} className="px-5 py-2.5 text-sm">
              {loggedIn ? 'Open dashboard' : 'Start free'} <ArrowRight size={16} />
            </BlueButton>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24 lg:pb-32 grid lg:grid-cols-2 gap-14 items-center">
          {/* Left text */}
          <div>
            <div className="ls-rise"><Label light>Lead intelligence for agencies</Label></div>
            <h1 className={`ls-rise mt-5 text-4xl sm:text-6xl font-bold leading-[1.08] tracking-tight text-white ${display}`} style={{ animationDelay: '120ms' }}>
              Find Local Businesses That Need Your Services.
            </h1>
            <p className="ls-rise mt-6 text-lg leading-relaxed max-w-xl" style={{ animationDelay: '260ms', color: '#B5CBDD' }}>
              LeadScope searches any city, scores every business on its online gaps, and writes your first message with AI.
            </p>
            <div className="ls-rise mt-9 flex flex-wrap items-center gap-5" style={{ animationDelay: '400ms' }}>
              <BlueButton to={startTo} state={startState} className="px-7 py-3.5 text-base">
                Start Finding Leads <ArrowRight size={18} />
              </BlueButton>
              <a href="#features" className="group inline-flex items-center gap-3 text-white font-medium">
                <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: C.blue, boxShadow: '0 0 0 6px rgba(4,151,246,.2)' }}><Play size={16} fill="#fff" /></span>
                See How It Works
              </a>
            </div>

            <div className="ls-rise mt-14" style={{ animationDelay: '560ms' }}>
              <Label light>Powered by</Label>
              <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3">
                {POWERED_BY.map(({ icon: Icon, name }) => (
                  <span key={name} className={`inline-flex items-center gap-2 text-lg font-semibold ${display}`} style={{ color: '#9DB8CF' }}>
                    <Icon size={20} /> {name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: laptop with glowing arc */}
          <div className="ls-rise relative h-[380px] sm:h-[460px]" style={{ animationDelay: '500ms' }}>
            {/* glowing arc */}
            <div aria-hidden="true" className="ls-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[58%] w-[420px] h-[420px] sm:w-[520px] sm:h-[520px] rounded-full"
              style={{
                border: '3px solid transparent',
                background: `radial-gradient(circle at 55% 45%, #0B5C93 0%, #06315A 50%, #01081A 100%) padding-box, linear-gradient(200deg, #FFFFFF 0%, ${C.violet} 45%, transparent 85%) border-box`,
                boxShadow: '0 0 70px rgba(78,185,229,.45), inset 0 0 70px rgba(117,223,255,.2)',
                opacity: 0.9,
              }} />
            {/* laptop */}
            <div className="absolute inset-x-0 top-8 flex justify-center" style={{ perspective: '1400px' }}>
              <div style={{ transform: 'rotateY(-16deg) rotateX(6deg)', transformStyle: 'preserve-3d' }}>
                <div className="w-[320px] sm:w-[440px] rounded-t-2xl p-2.5" style={{ background: '#020F24', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 40px 80px -20px rgba(0,0,0,.7)' }}>
                  <div className="rounded-lg overflow-hidden p-4" style={{ background: `linear-gradient(160deg, ${C.indigo} 0%, #0B3354 100%)` }}>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-bold text-white ${display}`}>LeadScope<span style={{ color: C.blue }}>.</span></span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(4,151,246,.25)', color: '#75DFFF' }}>Find Leads</span>
                    </div>
                    <p className={`mt-3 text-base font-semibold text-white ${display}`}>Restaurants in Indore</p>
                    <p className="text-[10px] mb-3" style={{ color: '#7FA0BC' }}>56 businesses · best opportunities first</p>
                    <MiniLeadList dark delayBase={1000} />
                  </div>
                </div>
                <div className="h-4 w-[360px] sm:w-[500px] -ml-[20px] sm:-ml-[30px] rounded-b-2xl" style={{ background: 'linear-gradient(180deg, #0A2240 0%, #020F24 100%)' }} />
              </div>
            </div>
            {/* floating score card (instead of a rating) */}
            <div className="ls-float absolute right-0 sm:right-4 bottom-2 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-2xl" style={{ background: C.card, border: `1px solid ${C.line}` }}>
              <Ring value={100} size={52} delay={1400} />
              <div>
                <p className={`text-lg font-bold ${display}`}>Hot lead</p>
                <p className="text-xs" style={{ color: C.muted }}>No website · Profile incomplete</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= LIGHT PANEL ================= */}
      <section id="about" className="relative z-10 px-3 sm:px-6 -mt-10 scroll-mt-10">
        <div className="max-w-7xl mx-auto rounded-[28px] px-5 sm:px-12 py-16" style={{ background: C.lavender }}>
          <div className="grid lg:grid-cols-5 gap-12">
            {/* left */}
            <Reveal className="lg:col-span-2">
              <Label>What LeadScope does</Label>
              <h2 className={`mt-4 text-3xl sm:text-4xl font-bold leading-tight ${display}`}>
                A lead tool focused on <span style={{ color: C.blue }}>local businesses</span> &amp; <span style={{ color: C.blue }}>AI outreach</span>
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed" style={{ color: C.muted }}>
                We combine open map data, a clear scoring system and Gemini AI so agencies spend time talking to the right businesses.
              </p>
              <BlueButton to={startTo} state={startState} className="mt-7 px-5 py-2.5 text-sm">Create free account <ArrowRight size={15} /></BlueButton>
              <div className="mt-10 grid grid-cols-3 gap-4">
                {MINI_FEATURES.map(({ icon: Icon, title, text }) => (
                  <div key={title}>
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(4,151,246,.15)', color: C.blue }}><Icon size={17} /></span>
                    <p className="mt-3 text-sm font-semibold">{title}</p>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* right: inside the app */}
            <div className="lg:col-span-3">
              <Reveal className="flex items-center justify-between">
                <Label>Inside LeadScope</Label>
                <a href="#features" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: C.blue }}>See all features <ArrowRight size={15} /></a>
              </Reveal>
              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                <Reveal className="ls-lift sm:row-span-2 rounded-3xl p-6 flex flex-col justify-between min-h-[340px]"
                  style={{ background: `linear-gradient(160deg, #0B3354 0%, ${C.indigo} 60%, ${C.night} 100%)` }}>
                  <MiniLeadList dark delayBase={0} />
                  <div className="mt-6 flex items-end justify-between">
                    <div>
                      <p className={`text-xl font-bold text-white ${display}`}>Find Leads</p>
                      <p className="text-sm" style={{ color: '#7FA0BC' }}>Search · Score · Sort</p>
                    </div>
                    <Link to={startTo} state={startState} className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: C.blue }} aria-label="Open Find Leads"><ArrowRight size={17} /></Link>
                  </div>
                </Reveal>
                <Reveal delay={120} className="ls-lift rounded-3xl p-6 bg-[#113E62] border border-[#1B4C74] flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-lg font-bold ${display}`}>Lead Scoring</p>
                    <p className="text-sm" style={{ color: C.muted }}>0–100 from digital gaps</p>
                  </div>
                  <Ring value={86} size={64} delay={300} />
                </Reveal>
                <Reveal delay={220} className="ls-lift rounded-3xl p-6 bg-[#113E62] border border-[#1B4C74]">
                  <div className="flex items-center justify-between">
                    <p className={`text-lg font-bold ${display}`}>AI Messages</p>
                    <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(4,151,246,.15)', color: C.blue }}><Wand2 size={16} /></span>
                  </div>
                  <p className="mt-2 text-sm" style={{ color: C.muted }}>Email · WhatsApp · LinkedIn</p>
                  <div className="mt-3 rounded-xl p-3 text-xs leading-relaxed" style={{ background: C.lavender, color: '#CFDEEA' }}>
                    “Hi Neelkamal team, I noticed you don&apos;t have a website yet…”
                  </div>
                </Reveal>
              </div>
            </div>
          </div>

          {/* stats strip */}
          <Reveal className="mt-14 rounded-2xl bg-[#113E62] border border-[#1B4C74] px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6" style={{ border: `1px solid ${C.line}` }}>
            {STATS.map(({ icon: Icon, big, small }, i) => (
              <div key={small} className={`flex items-center gap-3 ${i > 0 ? 'lg:border-l lg:pl-6' : ''}`} style={{ borderColor: C.line }}>
                <Icon size={20} style={{ color: C.blue }} />
                <div>
                  <p className={`text-2xl sm:text-3xl font-bold ${display}`} style={{ color: C.blue }}>{big}</p>
                  <p className="text-xs" style={{ color: C.muted }}>{small}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ================= FEATURE TABS (dark) ================= */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-24 scroll-mt-10">
        <Reveal className="text-center max-w-2xl mx-auto">
          <Label light>How it works</Label>
          <h2 className={`mt-4 text-3xl sm:text-5xl font-bold text-white ${display}`}>From a city name to your next client</h2>
          <p className="mt-4 text-lg" style={{ color: '#9DB8CF' }}>Four steps, one tool. Click each one to see it.</p>
        </Reveal>
        <div className="mt-10 flex flex-wrap justify-center gap-3" role="tablist">
          {TABS.map(({ id, icon: Icon, label }) => {
            const active = id === activeTab
            return (
              <button key={id} type="button" role="tab" aria-selected={active} onClick={() => setActiveTab(id)}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[15px] font-semibold transition-all"
                style={active ? { background: C.blue, color: '#fff', boxShadow: '0 10px 24px -10px rgba(4,151,246,.8)' } : { background: 'rgba(255,255,255,.06)', color: '#B5CBDD', border: '1px solid rgba(255,255,255,.1)' }}>
                <Icon size={17} /> {label}
              </button>
            )
          })}
        </div>
        <div key={tab.id} className="mt-12 grid lg:grid-cols-2 gap-12 items-center">
          <div className="ls-rise">
            <h3 className={`text-3xl sm:text-4xl font-bold text-white ${display}`}>{tab.title}</h3>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: '#9DB8CF' }}>{tab.text}</p>
            <ul className="mt-6 space-y-3">
              {tab.points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-[17px] text-white">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(4,151,246,.2)', color: '#75DFFF' }}><Check size={14} strokeWidth={3} /></span>{p}
                </li>
              ))}
            </ul>
            <Link to={startTo} state={startState} className="group mt-7 inline-flex items-center gap-1.5 font-semibold" style={{ color: '#4EB9E5' }}>
              Try it free <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="ls-rise" style={{ animationDelay: '120ms' }}><TabPreview id={tab.id} /></div>
        </div>
      </section>

      {/* ================= TRY IT ================= */}
      <section id="try" className="px-4 sm:px-6 pb-24 scroll-mt-10">
        <Reveal className="max-w-5xl mx-auto rounded-[28px] px-6 sm:px-12 py-14 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, #0B3354 0%, ${C.indigo} 50%, #06315A 100%)`, border: '1px solid rgba(255,255,255,.08)' }}>
          <h2 className={`text-3xl sm:text-4xl font-bold text-white ${display}`}>Who needs your services today?</h2>
          <p className="mt-3 text-lg" style={{ color: '#B5CBDD' }}>Pick an example or type your own city and business type.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button key={ex.city} type="button" onClick={() => { setTryCity(ex.city); setTryType(ex.type) }}
                className="rounded-full px-4 py-2 text-sm font-medium text-white hover:-translate-y-0.5 transition-transform"
                style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
                {ex.type}s in {ex.city}
              </button>
            ))}
          </div>
          <form onSubmit={handleTry} className="mt-6 mx-auto max-w-3xl flex flex-col sm:flex-row gap-2 rounded-2xl p-2" style={{ background: C.card, border: `1px solid ${C.line}` }}>
            <label className="flex-1 flex items-center gap-2 px-4">
              <MapPin size={18} style={{ color: C.blue }} />
              <input value={tryCity} onChange={(e) => setTryCity(e.target.value)} placeholder="City, e.g. Noida" className="w-full py-3 outline-none bg-transparent text-[15px] placeholder:text-[#6F8FAA]" aria-label="City" />
            </label>
            <label className="flex-1 flex items-center gap-2 px-4 sm:border-l" style={{ borderColor: C.line }}>
              <Search size={18} style={{ color: C.blue }} />
              <input value={tryType} onChange={(e) => setTryType(e.target.value)} placeholder="Business type, e.g. Dentist" className="w-full py-3 outline-none bg-transparent text-[15px] placeholder:text-[#6F8FAA]" aria-label="Business type" />
            </label>
            <button type="submit" className="rounded-xl px-7 py-3 font-semibold text-white" style={{ background: C.blue }}>Find leads</button>
          </form>
          <p className="mt-3 text-sm" style={{ color: '#9DB8CF' }}>{loggedIn ? 'Opens Find Leads.' : 'Create a free account to see the results.'}</p>
        </Reveal>
      </section>

      {/* ================= SECURITY + STACK (light) ================= */}
      <section className="px-3 sm:px-6 pb-24">
        <div className="max-w-7xl mx-auto rounded-[28px] px-5 sm:px-12 py-16" style={{ background: C.lavender }}>
          <div className="grid lg:grid-cols-2 gap-12">
            <Reveal>
              <Label>Security</Label>
              <h2 className={`mt-4 text-3xl sm:text-4xl font-bold leading-tight ${display}`}>Your leads stay <span style={{ color: C.blue }}>private</span> and <span style={{ color: C.blue }}>protected</span></h2>
              <div className="mt-8 grid sm:grid-cols-2 gap-4">
                {SECURITY.map(({ icon: Icon, text }) => (
                  <div key={text} className="ls-lift rounded-2xl bg-[#113E62] border border-[#1B4C74] p-5">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: C.blue }}><Icon size={18} /></span>
                    <p className="mt-3 font-semibold leading-snug">{text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={150}>
              <Label>Built with</Label>
              <h2 className={`mt-4 text-3xl sm:text-4xl font-bold leading-tight ${display}`}>A modern, <span style={{ color: C.blue }}>reliable</span> stack</h2>
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {BUILT_WITH.map(({ icon: Icon, name }) => (
                  <div key={name} className="ls-lift flex flex-col items-center gap-2 rounded-2xl bg-[#113E62] border border-[#1B4C74] py-5">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(4,151,246,.15)', color: C.blue }}><Icon size={19} /></span>
                    <span className="text-xs font-semibold">{name}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= FAQ (dark) ================= */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 scroll-mt-10">
        <Reveal className="text-center">
          <Label light>FAQ</Label>
          <h2 className={`mt-4 text-3xl sm:text-5xl font-bold text-white ${display}`}>Questions, answered</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const open = openFaq === i
            return (
              <Reveal key={f.q} delay={i * 60} className="rounded-2xl"
                style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${open ? C.blue : 'rgba(255,255,255,.1)'}` }}>
                <button type="button" onClick={() => setOpenFaq(open ? -1 : i)} aria-expanded={open}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left">
                  <span className={`text-lg font-semibold text-white ${display}`}>{f.q}</span>
                  <ChevronDown size={20} className="shrink-0 transition-transform duration-300" style={{ transform: open ? 'rotate(180deg)' : 'none', color: '#4EB9E5' }} />
                </button>
                <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: open ? '1fr' : '0fr' }}>
                  <div className="overflow-hidden"><p className="px-6 pb-5 leading-relaxed" style={{ color: '#9DB8CF' }}>{f.a}</p></div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ================= CLOSING CTA ================= */}
      <section className="px-4 sm:px-6 pb-20">
        <Reveal className="relative max-w-7xl mx-auto rounded-[28px] text-center px-6 py-20 overflow-hidden"
          style={{ background: `radial-gradient(70% 120% at 50% 0%, #0B5C93 0%, ${C.indigo} 55%, ${C.night} 100%)`, border: '1px solid rgba(255,255,255,.08)' }}>
          <BarChart3 aria-hidden="true" size={180} className="absolute -right-6 -bottom-6 opacity-10 text-white" />
          <h2 className={`relative text-3xl sm:text-5xl font-bold max-w-3xl mx-auto leading-tight text-white ${display}`}>
            Your next client is already in your city.
          </h2>
          <p className="relative mt-4 text-lg" style={{ color: '#B5CBDD' }}>Run your first search in under a minute.</p>
          <BlueButton to={startTo} state={startState} className="relative mt-8 px-8 py-4 text-lg">
            Start Finding Leads <ArrowRight size={19} />
          </BlueButton>
          <div className="relative mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2" style={{ color: '#B5CBDD' }}>
            {['Free to use', 'No card needed', 'Set up in a minute'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><Check size={16} style={{ color: '#4EB9E5' }} /> {t}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,.08)', color: '#7FA0BC' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
          <div className="col-span-2 md:col-span-1">
            <p className={`text-2xl font-bold text-white ${display}`}>LeadScope<span style={{ color: C.blue }}>.</span></p>
            <p className="mt-4 text-sm leading-relaxed max-w-xs">Lead intelligence and outreach for digital marketing agencies.</p>
          </div>
          <div>
            <p className="font-semibold text-white">Product</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#features" className="hover:text-white">Lead Finder</a></li>
              <li><a href="#features" className="hover:text-white">Lead Scoring</a></li>
              <li><a href="#features" className="hover:text-white">AI Message Writer</a></li>
              <li><a href="#try" className="hover:text-white">Try it</a></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Trust</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#about" className="hover:text-white">About</a></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              <li>Data © OpenStreetMap contributors</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white">Get started</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link to="/login" state={{ mode: 'signup' }} className="hover:text-white">Create account</Link></li>
              <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            </ul>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-2 items-center justify-between text-sm">
          </div>
        </div>
      </footer>
    </div>
  )
}