import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles, Search, Gauge, Lightbulb, Wand2, Check, MapPin, ArrowRight, ChevronDown, Play,
  Mail, MessageCircle, Linkedin, ShieldCheck, Lock, KeyRound, Users,
  Globe, Database, Server, Cpu, Map, Layers, Code2, Target, BarChart3,
  Phone, Stethoscope, Dumbbell, UtensilsCrossed, Scissors, Coffee, LogOut, ArrowUp,
} from 'lucide-react'
import { getCurrentUser } from '@/utils/currentUser'
import { useLogout } from '@/hooks/useLogout'
import InsideMapSheet from '@/features/leads/components/InsideMapSheet'
import HeroMapSlider from '@/features/leads/components/HeroMapSlider'

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
@keyframes ls-flash { 0% { box-shadow: 0 0 0 0 rgba(68,126,252,.5); border-color: #447EFC; } 100% { box-shadow: 0 0 0 10px rgba(68,126,252,0); } }
.ls-flash { animation: ls-flash .7s ease-out; }
.ls-field { transition: border-color .2s ease, box-shadow .2s ease; }
.ls-field:focus-within { border-color: #447EFC !important; box-shadow: 0 0 0 3px rgba(68,126,252,.18); }
.ls-chip { transition: transform .2s ease, background-color .2s ease, color .2s ease; }
.ls-chip:hover { transform: translateY(-2px); }
.ls-flink { position: relative; color: #9DB8CF; transition: color .2s ease; background: none; border: 0; padding: 0; cursor: pointer; font: inherit; }
.ls-flink::after { content: ''; position: absolute; left: 0; bottom: -3px; height: 2px; width: 100%; background: #0497F6; transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }
.ls-flink:hover, .ls-flink:focus-visible { color: #fff; }
.ls-flink:hover::after, .ls-flink:focus-visible::after { transform: scaleX(1); }
html { scroll-behavior: smooth; }
@media (prefers-reduced-motion: reduce) {
  .ls-rise, .ls-slide, .ls-reveal { opacity:1 !important; transform:none !important; animation:none !important; transition:none !important; }
  .ls-float, .ls-glow, .ls-caret { animation: none !important; }
  .ls-lift:hover { transform: none; }
  .ls-flash { animation: none !important; }
  .ls-chip:hover { transform: none; }
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

function Ring({ value, size = 40, delay = 400, dark = false, light = false }) {
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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={dark ? 'rgba(255,255,255,.12)' : light ? '#E3EAF2' : C.line} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)' }} />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${display}`} style={{ color: dark ? '#fff' : light ? '#202124' : C.ink }}>{value}</span>
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

const MINI_FEATURES = [
  { icon: Search, title: 'Find', text: 'Real businesses from any Indian city.' },
  { icon: Target, title: 'Score', text: 'A 0–100 score based on what is missing online.' },
  { icon: Wand2, title: 'Message', text: 'Email, WhatsApp or LinkedIn message, ready to edit.' },
]

const STATS = [
  { icon: Search, big: '500', small: 'Businesses per search (max)' },
  { icon: Gauge, big: '0–100', small: 'Score for every business' },
  { icon: MessageCircle, big: '3', small: 'Ways to contact: Email, WhatsApp, LinkedIn' },
  { icon: Sparkles, big: 'Free', small: 'No card needed' },
]

const TABS = [
  { id: 'find', icon: Search, label: 'Find', title: 'Search a city',
    text: 'Type a city and a business type. You get a list of real businesses with address, phone and website.',
    points: ['Works for any city in India', 'Up to 500 businesses in one search', 'Filter by priority or website'] },
  { id: 'score', icon: Gauge, label: 'Score', title: 'See who needs you most',
    text: 'Each business gets a score from 0 to 100. A higher score means more is missing online, so they are shown first.',
    points: ['Checks if they have a website', 'Checks if their details are complete', 'High, Medium and Low priority'] },
  { id: 'why', icon: Lightbulb, label: 'Why', title: 'Know what to offer',
    text: 'Each lead tells you, in plain words, what is missing and which service to offer first.',
    points: ['What is missing, for each lead', 'The service to offer first', 'Your own notes on every lead'] },
  { id: 'write', icon: Wand2, label: 'Write', title: 'Write the first message',
    text: 'AI writes a short, personal message for each lead. You read it, change it if you want, and send it yourself.',
    points: ['Email, WhatsApp or LinkedIn', 'Edit before you send', 'Open WhatsApp in one click'] },
]

const EXAMPLES = [
  { city: 'Noida', type: 'Dentist', icon: Stethoscope }, { city: 'Lucknow', type: 'Gym', icon: Dumbbell },
  { city: 'Indore', type: 'Restaurant', icon: UtensilsCrossed }, { city: 'Jaipur', type: 'Salon', icon: Scissors },
  { city: 'Chandigarh', type: 'Cafe', icon: Coffee },
]

const SECURITY = [
  { icon: Lock, text: 'Your password is stored in a scrambled form, never as plain text' },
  { icon: KeyRound, text: 'Secure sign-in that keeps your account safe' },
  { icon: ShieldCheck, text: 'Account locks for 15 minutes after 5 wrong passwords' },
  { icon: Users, text: 'Only you can see your leads' },
]

const BUILT_WITH = [
  { icon: Code2, name: 'React' }, { icon: Layers, name: 'Tailwind CSS' },
  { icon: Server, name: 'Spring Boot' }, { icon: Cpu, name: 'Java 21' },
  { icon: Database, name: 'MySQL' }, { icon: Sparkles, name: 'Gemini AI' },
  { icon: Map, name: 'OpenStreetMap' }, { icon: Globe, name: 'Geoapify' },
]

const FAQS = [
  { q: 'Where does the business data come from?',
    a: 'From OpenStreetMap, a free public map, through the Geoapify service. You get the name, address, phone, website and opening hours when they are listed.' },
  { q: 'How is the score worked out?',
    a: 'A business gets points for each thing missing online, like no website or missing details. The total is shown from 0 to 100. A score of 70 or more is High priority.' },
  { q: 'Is it free?', a: 'Yes. Sign up without a card and start searching.' },
  { q: 'Does LeadScope send messages for me?',
    a: 'No. It writes the message. You read it, edit it and send it yourself by email, WhatsApp or LinkedIn.' },
  { q: 'Can other people see my leads?',
    a: 'No. Your leads are linked to your account, and only you can see them.' },
  { q: 'Who is LeadScope for?',
    a: 'Digital marketing agencies, freelancers, web designers and small IT teams who sell online services to local businesses.' },
]

/* ---------- mini app screens (white, like the "See it in action" box) ---------- */
const W = { frame: '#E9F5FF', card: '#FFFFFF', head: '#F8F9FA', line: '#EBEBEB', ink: '#202124', muted: '#5F6368', blue: '#447EFC', blueSoft: '#E8F1FF' }

function MiniLeadList({ delayBase = 900 }) {
  return (
    <div className="space-y-2">
      {LEADS.map((l, i) => (
        <div key={l.name} className="ls-slide flex items-center gap-2.5 rounded-xl p-2.5"
          style={{ animationDelay: `${delayBase + i * 160}ms`, background: W.card, border: `1px solid ${W.line}` }}>
          <Ring value={l.score} size={34} delay={delayBase + 100 + i * 160} light />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: W.ink }}>{l.name}</p>
            <p className="text-[11px] truncate" style={{ color: W.muted }}>{l.area}</p>
          </div>
          <span className="hidden sm:inline text-[11px] rounded-md px-1.5 py-0.5" style={{ background: '#FFF4E0', color: '#9A6508' }}>{l.gap}</span>
        </div>
      ))}
    </div>
  )
}

function TabPreview({ id }) {
  const frame = (title, body) => (
    <div className="rounded-[24px] p-2.5 sm:p-3" style={{ background: W.frame, boxShadow: '0 30px 70px -30px rgba(0,0,0,.6)' }}>
      <div className="rounded-2xl overflow-hidden" style={{ background: W.card, color: W.ink }}>
        <div className="flex items-center gap-2 px-4 h-10" style={{ borderBottom: `1px solid ${W.line}`, background: W.head }}>
          <span className="w-3 h-3 rounded-full bg-[#FF6B6B]" /><span className="w-3 h-3 rounded-full bg-[#F5B83D]" /><span className="w-3 h-3 rounded-full bg-[#34C38F]" />
          <span className="ml-4 text-xs" style={{ color: W.muted }}>{title}</span>
        </div>
        <div className="p-5">{body}</div>
      </div>
    </div>
  )
  if (id === 'find') return frame('leadscope · Find Leads', (
    <>
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm" style={{ border: `1px solid ${W.line}` }}><MapPin size={15} color={W.blue} /> Indore</div>
        <div className="flex-1 rounded-xl px-3 py-2.5 text-sm" style={{ border: `1px solid ${W.line}` }}>Restaurant</div>
        <div className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white" style={{ background: W.blue }}>Search</div>
      </div>
      <p className="mt-4 mb-2 text-xs" style={{ color: W.muted }}>56 businesses found</p>
      <MiniLeadList delayBase={0} />
    </>
  ))
  if (id === 'score') return frame('leadscope · Lead scores', <MiniLeadList delayBase={0} />)
  if (id === 'why') return frame('leadscope · Lead details', (
    <>
      <div className="flex items-center gap-4">
        <Ring value={100} size={64} delay={200} light />
        <div><p className={`text-lg font-bold ${display}`}>Neelkamal Restaurant</p><p className="text-sm" style={{ color: W.muted }}>RNT Marg, Indore</p></div>
      </div>
      <div className="mt-5 rounded-xl p-4" style={{ background: '#FFF6E5', border: '1px solid #FDE3B0' }}>
        <p className="text-sm font-semibold" style={{ color: '#9A6508' }}>Why this lead?</p>
        <p className="mt-1 text-sm" style={{ color: '#7A5206' }}>No website and missing business details.</p>
      </div>
      <div className="mt-3 rounded-xl p-4" style={{ background: W.blueSoft }}>
        <p className="text-sm font-semibold" style={{ color: W.blue }}>Offer first</p>
        <p className="mt-1 text-sm" style={{ color: W.muted }}>A simple website + Google profile setup</p>
      </div>
    </>
  ))
  return frame('leadscope · Write Message', (
    <>
      <div className="flex gap-2">
        {[{ i: Mail, t: 'Email' }, { i: MessageCircle, t: 'WhatsApp' }, { i: Linkedin, t: 'LinkedIn' }].map(({ i: Icon, t }, k) => (
          <span key={t} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={k === 1 ? { background: W.blue, color: '#fff' } : { background: '#F1F5FB', color: W.muted }}><Icon size={13} /> {t}</span>
        ))}
      </div>
      <div className="mt-4 rounded-xl p-4 text-sm leading-relaxed min-h-[150px]" style={{ border: `1px solid ${W.line}`, color: '#3C4043' }}>
        <TypingText text={AI_MESSAGE} startDelay={250} speed={14} />
      </div>
    </>
  ))
}

/* ---------- page ---------- */
export default function LandingPage() {
  const navigate = useNavigate()
  const loggedIn = Boolean(getCurrentUser()?.email)
  const logout = useLogout()
  const startTo = loggedIn ? '/lead-discovery' : '/login'
  const startState = loggedIn ? undefined : { mode: 'signup' }

  const [activeTab, setActiveTab] = useState('find')
  const tab = TABS.find((t) => t.id === activeTab)
  const [tryCity, setTryCity] = useState('')
  const [tryType, setTryType] = useState('')
  const [flash, setFlash] = useState(0)
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
            {loggedIn ? (
              <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 text-[15px] font-medium text-white/80 hover:text-white transition-colors">
                <LogOut size={16} /> <span className="hidden sm:inline">Log out</span>
              </button>
            ) : (
              <Link to="/login" className="text-[15px] font-medium text-white/80 hover:text-white transition-colors">Log in</Link>
            )}
            <BlueButton to={loggedIn ? '/dashboard' : '/login'} state={loggedIn ? undefined : { mode: 'signup' }} className="px-5 py-2.5 text-sm">
              {loggedIn ? 'Open dashboard' : 'Start free'} <ArrowRight size={16} />
            </BlueButton>
          </div>
        </header>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-24 lg:pb-32 grid lg:grid-cols-2 gap-14 items-center">
          {/* Left text */}
          <div>
            <div className="ls-rise"><Label light>For agencies, freelancers and sales teams</Label></div>
            <h1 className={`ls-rise mt-5 text-4xl sm:text-6xl font-bold leading-[1.08] tracking-tight text-white ${display}`} style={{ animationDelay: '120ms' }}>
              Find local businesses that need your services
            </h1>
            <p className="ls-rise mt-6 text-lg leading-relaxed max-w-xl" style={{ animationDelay: '260ms', color: '#B5CBDD' }}>
              Search any city, see which businesses are missing a website or details, and send your first message with AI.
            </p>
            <div className="ls-rise mt-9 flex flex-wrap items-center gap-5" style={{ animationDelay: '400ms' }}>
              <BlueButton to={startTo} state={startState} className="px-7 py-3.5 text-base">
                Start Finding Leads <ArrowRight size={18} />
              </BlueButton>
              <a href="#features" className="group inline-flex items-center gap-3 text-white font-medium">
                <span className="w-11 h-11 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ background: C.blue, boxShadow: '0 0 0 6px rgba(4,151,246,.2)' }}><Play size={16} fill="#fff" /></span>
                How it works
              </a>
            </div>
          </div>

          {/* Right: map listing -> lead sheet slider */}
          <div className="ls-rise relative min-w-0" style={{ animationDelay: '500ms' }}>
            <HeroMapSlider />
          </div>
        </div>
      </section>

      {/* ================= LIGHT PANEL ================= */}
      <section id="about" className="relative z-10 px-3 sm:px-6 -mt-10 scroll-mt-10">
        <div className="max-w-7xl mx-auto rounded-[28px] px-5 sm:px-12 py-16" style={{ background: C.lavender }}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* left */}
            <Reveal>
              <Label>What LeadScope does</Label>
              <h2 className={`mt-4 text-3xl sm:text-4xl font-bold leading-tight ${display}`}>
                One tool to <span style={{ color: C.blue }}>find</span>, <span style={{ color: C.blue }}>score</span> and <span style={{ color: C.blue }}>contact</span> local businesses
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed" style={{ color: C.muted }}>
                LeadScope lists businesses from open map data, gives each one a score, and helps you write the first message. You only call the ones that need you.
              </p>
              <BlueButton to={startTo} state={startState} className="mt-7 px-5 py-2.5 text-sm">Create free account <ArrowRight size={15} /></BlueButton>
            </Reveal>

            {/* right: mini features */}
            <Reveal delay={120} className="grid sm:grid-cols-3 gap-6">
              {MINI_FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title}>
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(4,151,246,.15)', color: C.blue }}><Icon size={17} /></span>
                  <p className="mt-3 text-sm font-semibold">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed" style={{ color: C.muted }}>{text}</p>
                </div>
              ))}
            </Reveal>
          </div>

          {/* full width: inside the app */}
          <div className="mt-14">
            <Reveal className="flex items-center justify-between">
              <Label>See it in action</Label>
              <a href="#features" className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: C.blue }}>How it works <ArrowRight size={15} /></a>
            </Reveal>
            <div className="mt-5 min-w-0"><InsideMapSheet /></div>
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
          <p className="mt-4 text-lg" style={{ color: '#9DB8CF' }}>Four simple steps. Click a step to see it.</p>
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
              Start free <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="ls-rise" style={{ animationDelay: '120ms' }}><TabPreview id={tab.id} /></div>
        </div>
      </section>

      {/* ================= TRY IT ================= */}
      <section id="try" className="px-4 sm:px-6 pb-24 scroll-mt-10">
        <Reveal className="max-w-5xl mx-auto rounded-[28px] px-4 sm:px-10 py-12 sm:py-14 relative overflow-hidden"
          style={{ background: `radial-gradient(80% 120% at 50% 0%, #0B4A7A 0%, ${C.indigo} 60%, #01142B 100%)`, border: '1px solid rgba(255,255,255,.08)' }}>
          <div className="text-center">
            <h2 className={`text-3xl sm:text-4xl font-bold text-white ${display}`}>Try a search</h2>
            <p className="mt-3 text-lg" style={{ color: '#B5CBDD' }}>Pick an example, or type a city and a business type.</p>
          </div>

          {/* white card, same style as the app previews */}
          <div className="mt-8 rounded-[24px] p-2.5 sm:p-3" style={{ background: W.frame, boxShadow: '0 30px 70px -30px rgba(0,0,0,.7)' }}>
            <div className="rounded-2xl p-4 sm:p-6" style={{ background: W.card, color: W.ink }}>

              {/* examples */}
              <p className="text-sm font-semibold" style={{ color: W.muted }}>Quick examples</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => {
                  const on = tryCity === ex.city && tryType === ex.type
                  return (
                    <button key={ex.city} type="button" aria-pressed={on}
                      onClick={() => { setTryCity(ex.city); setTryType(ex.type); setFlash((f) => f + 1) }}
                      className="ls-chip inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium"
                      style={on ? { background: W.blue, color: '#fff', border: `1px solid ${W.blue}` } : { background: '#F5F8FC', color: W.ink, border: `1px solid ${W.line}` }}>
                      <ex.icon size={15} style={{ color: on ? '#fff' : W.blue }} /> {ex.type}s in {ex.city}
                    </button>
                  )
                })}
              </div>

              {/* search form */}
              <form key={flash} onSubmit={handleTry} className="mt-5 grid sm:grid-cols-[1fr_1fr_auto] gap-3">
                <label className={`ls-field flex flex-col rounded-xl px-4 py-2.5 ${flash ? 'ls-flash' : ''}`} style={{ border: `1px solid ${W.line}` }}>
                  <span className="text-[11px] font-semibold" style={{ color: W.muted }}>City</span>
                  <span className="flex items-center gap-2">
                    <MapPin size={17} style={{ color: W.blue }} />
                    <input value={tryCity} onChange={(e) => setTryCity(e.target.value)} placeholder="e.g. Noida"
                      className="w-full py-1 outline-none bg-transparent text-[15px] placeholder:text-[#9AA0A6]" aria-label="City" />
                  </span>
                </label>
                <label className={`ls-field flex flex-col rounded-xl px-4 py-2.5 ${flash ? 'ls-flash' : ''}`} style={{ border: `1px solid ${W.line}` }}>
                  <span className="text-[11px] font-semibold" style={{ color: W.muted }}>Business type</span>
                  <span className="flex items-center gap-2">
                    <Search size={17} style={{ color: W.blue }} />
                    <input value={tryType} onChange={(e) => setTryType(e.target.value)} placeholder="e.g. Dentist"
                      className="w-full py-1 outline-none bg-transparent text-[15px] placeholder:text-[#9AA0A6]" aria-label="Business type" />
                  </span>
                </label>
                <button type="submit" className="group rounded-xl px-7 py-3 font-semibold text-white inline-flex items-center justify-center gap-2 hover:brightness-110 transition"
                  style={{ background: W.blue, boxShadow: '0 12px 26px -12px rgba(68,126,252,.9)' }}>
                  Find leads <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </button>
              </form>

              {/* what you get */}
              <div className="mt-6 pt-5 grid sm:grid-cols-3 gap-3" style={{ borderTop: `1px solid ${W.line}` }}>
                {[
                  { icon: MapPin, t: 'Name and address', s: 'Real businesses from map data' },
                  { icon: Phone, t: 'Phone and website', s: 'Shown when they are listed' },
                  { icon: Gauge, t: 'Score from 0 to 100', s: 'Who needs you most comes first' },
                ].map(({ icon: Icon, t, s }) => (
                  <div key={t} className="flex items-start gap-3 rounded-xl p-3" style={{ background: '#F5F8FC' }}>
                    <span className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center" style={{ background: W.blueSoft, color: W.blue }}><Icon size={17} /></span>
                    <div>
                      <p className="text-sm font-semibold">{t}</p>
                      <p className="text-xs" style={{ color: W.muted }}>{s}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-sm" style={{ color: '#9DB8CF' }}>
            {loggedIn ? 'Opens Find Leads with your search.' : 'Free account needed to see results. No card required.'}
          </p>
        </Reveal>
      </section>

      {/* ================= SECURITY + STACK (light) ================= */}
      <section className="px-3 sm:px-6 pb-24">
        <div className="max-w-7xl mx-auto rounded-[28px] px-5 sm:px-12 py-16" style={{ background: C.lavender }}>
          <div className="grid lg:grid-cols-2 gap-12">
            <Reveal>
              <Label>Security</Label>
              <h2 className={`mt-4 text-3xl sm:text-4xl font-bold leading-tight ${display}`}>Your account and leads stay <span style={{ color: C.blue }}>private</span></h2>
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
              <Label>Made with</Label>
              <h2 className={`mt-4 text-3xl sm:text-4xl font-bold leading-tight ${display}`}>Trusted <span style={{ color: C.blue }}>tools</span> behind LeadScope</h2>
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
          <p className="relative mt-4 text-lg" style={{ color: '#B5CBDD' }}>Your first search takes less than a minute.</p>
          <BlueButton to={startTo} state={startState} className="relative mt-8 px-8 py-4 text-lg">
            Start Finding Leads <ArrowRight size={19} />
          </BlueButton>
          <div className="relative mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2" style={{ color: '#B5CBDD' }}>
            {['Free to use', 'No card needed', 'Works for any city'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5"><Check size={16} style={{ color: '#4EB9E5' }} /> {t}</span>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="relative" style={{ background: '#010D20', borderTop: `1px solid ${C.line}`, color: '#9DB8CF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 grid gap-10 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <Link to="/" className={`text-2xl font-bold text-white ${display}`}>LeadScope<span style={{ color: C.blue }}>.</span></Link>
            <p className="mt-3 text-sm leading-relaxed max-w-xs">Find and contact local businesses that need online services.</p>
            <BlueButton to={loggedIn ? '/dashboard' : '/login'} state={loggedIn ? undefined : { mode: 'signup' }} className="mt-5 px-5 py-2.5 text-sm">
              {loggedIn ? 'Open dashboard' : 'Start free'} <ArrowRight size={15} />
            </BlueButton>
          </div>

          {/* link columns */}
          {[
            { title: 'Product', links: [['Find businesses', '#features'], ['Score leads', '#features'], ['Write messages', '#features'], ['Try a search', '#try']] },
            { title: 'Help', links: [['What it does', '#about'], ['How it works', '#features'], ['FAQ', '#faq']] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-white">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {col.links.map(([t, href]) => (
                  <li key={t}><a href={href} className="ls-flink">{t}</a></li>
                ))}
              </ul>
            </div>
          ))}

          {/* account */}
          <div>
            <p className="text-sm font-semibold text-white">Account</p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {loggedIn ? (
                <>
                  <li><Link to="/dashboard" className="ls-flink">Open dashboard</Link></li>
                  <li><Link to="/lead-discovery" className="ls-flink">Find leads</Link></li>
                  <li><button type="button" onClick={logout} className="ls-flink">Log out</button></li>
                </>
              ) : (
                <>
                  <li><Link to="/login" state={{ mode: 'signup' }} className="ls-flink">Create account</Link></li>
                  <li><Link to="/login" className="ls-flink">Log in</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* project credit */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8">
          <div className="rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm" style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${C.line}` }}>
            <span className="font-semibold text-white">MCA major project, Chandigarh University</span>
            <span>Shivani Verma · Kanak Kohli · Megha Sharma</span>
            <span className="sm:ml-auto">Guide: Akshay Awasthi</span>
          </div>
        </div>

        {/* bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
            <p>© {new Date().getFullYear()} LeadScope · Map data © OpenStreetMap contributors</p>
            <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' })}
              className="group inline-flex items-center gap-2 rounded-full px-4 py-2 font-medium text-white transition-colors hover:bg-white/10"
              style={{ border: `1px solid ${C.line}` }}>
              Back to top <ArrowUp size={14} className="transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
