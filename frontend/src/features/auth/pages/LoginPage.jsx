import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Mail, Lock, Eye, EyeOff, User, Building, ArrowRight, Search, BarChart3, Send, Users,
  UtensilsCrossed, Plus, Store, Dumbbell,
} from 'lucide-react'
import { login, register, forgotPassword, saveSession } from '@/services/authService'

/* All sizes scale with screen height: clamp(min, vh, max) */
const CSS = `
.lp-logo { font-size: clamp(20px, 3.4vh, 36px); }
.lp-nav  { font-size: clamp(13px, 1.8vh, 19px); }
.lp-h1   { font-size: clamp(32px, 7vh, 76px); line-height: 1.08; }
.lp-sub  { font-size: clamp(14px, 2.4vh, 26px); }
.lp-ft   { font-size: clamp(14px, 2vh, 22px); }
.lp-fd   { font-size: clamp(12px, 1.7vh, 18px); }
.lp-ficon { width: clamp(38px, 6.4vh, 68px); height: clamp(38px, 6.4vh, 68px); }
.lp-rlogo { font-size: clamp(24px, 3.9vh, 42px); }
.lp-rtag  { font-size: clamp(11px, 1.6vh, 17px); }
.lp-title { font-size: clamp(22px, 3.8vh, 40px); }
.lp-rsub  { font-size: clamp(13px, 2.1vh, 22px); }
.lp-field { height: clamp(40px, 5.4vh, 58px); font-size: clamp(13px, 1.9vh, 19px); }
.lp-btn   { height: clamp(42px, 6vh, 64px); font-size: clamp(14px, 2.1vh, 22px); }
.lp-small { font-size: clamp(12px, 1.8vh, 18px); }
.lp-chip  { font-size: clamp(11px, 1.8vh, 19px); }
.lp-input { background: #fff; border: 1px solid #D9DEEA; color: #0B1033; }
.lp-input::placeholder { color: #7A8299; }
.lp-input:focus { outline: none; border-color: #1F5BF0; box-shadow: 0 0 0 3px rgba(31,91,240,.15); }

@keyframes lp-drift { 0% { transform: scale(1.05) translate(0,0); } 100% { transform: scale(1.12) translate(-1.5%, -1%); } }
@keyframes lp-bob { 0%, 100% { transform: translate(-50%, -100%); } 50% { transform: translate(-50%, calc(-100% - 1vh)); } }
@keyframes lp-ring { 0% { transform: translate(-50%, -50%) scale(.4); opacity: .9; } 100% { transform: translate(-50%, -50%) scale(2.4); opacity: 0; } }
@keyframes lp-flow { to { stroke-dashoffset: -100; } }
@keyframes lp-twinkle { 0%, 100% { opacity: .15; } 50% { opacity: .9; } }
@keyframes lp-up { 0% { transform: translateY(0); opacity: 0; } 15% { opacity: .8; } 100% { transform: translateY(-40vh); opacity: 0; } }
@keyframes lp-pop { 0% { opacity: 0; transform: translate(-50%, 6px) scale(.85); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
@keyframes lp-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.lp-drift   { animation: lp-drift 30s ease-in-out infinite alternate; }
.lp-pin     { animation: lp-bob 3.6s ease-in-out infinite; }
.lp-ring    { animation: lp-ring 2.8s ease-out infinite; }
.lp-trail   { stroke-dasharray: 14 86; animation: lp-flow 4s linear infinite; }
.lp-twinkle { animation: lp-twinkle 3.2s ease-in-out infinite; }
.lp-up      { animation: lp-up 9s linear infinite; }
.lp-pop     { opacity: 0; animation: lp-pop .5s cubic-bezier(.2,.8,.2,1.2) forwards; }
.lp-rise    { opacity: 0; animation: lp-rise .7s cubic-bezier(.2,.7,.2,1) forwards; }
@media (prefers-reduced-motion: reduce) {
  .lp-drift, .lp-pin, .lp-ring, .lp-trail, .lp-twinkle, .lp-up { animation: none !important; }
  .lp-pop, .lp-rise { opacity: 1 !important; animation: none !important; }
}
`

function LogoMark({ vh = 5, min = 28, max = 54 }) {
  const h = `clamp(${min}px, ${vh}vh, ${max}px)`
  return (
    <div className="flex items-end gap-[3px] shrink-0" style={{ height: h }}>
      {[0.45, 0.7, 1].map((r, i) => (
        <span key={i} className="rounded-[3px]"
          style={{ width: `calc(${h} * .24)`, height: `calc(${h} * ${r})`, background: i === 2 ? 'linear-gradient(180deg,#3B7BFF,#1F5BF0)' : 'linear-gradient(180deg,#7FC4FF,#3B9BFF)' }} />
      ))}
    </div>
  )
}

/* Pins: x, y = tip position in % of the page */
const PINS = [
  { label: 'Cafes', icon: UtensilsCrossed, x: 39.7, y: 54, c1: '#FFB547', c2: '#F28C18', glow: 'rgba(255,170,60,.7)', delay: 0.6 },
  { label: 'Clinics', icon: Plus, x: 52.6, y: 59, c1: '#4FA3FF', c2: '#1F6BF0', glow: 'rgba(60,140,255,.7)', delay: 0.8 },
  { label: 'Shops', icon: Store, x: 38.5, y: 76, c1: '#34E0A1', c2: '#12B37A', glow: 'rgba(40,220,150,.7)', delay: 1.0 },
  { label: 'Gyms', icon: Dumbbell, x: 51, y: 85, c1: '#9B7BFF', c2: '#6A3FF0', glow: 'rgba(140,100,255,.75)', delay: 1.2 },
]

/* Glowing road trails (viewBox 0–100) */
const TRAILS = [
  { d: 'M 28 100 Q 36 88 44 86 T 60 74 T 62 56', color: '#4FD1FF', delay: 0 },
  { d: 'M 34 100 Q 44 92 52 94 T 64 82', color: '#9B7BFF', delay: 1.2 },
  { d: 'M 30 70 Q 40 66 46 70 T 60 66', color: '#4FD1FF', delay: 2.1 },
  { d: 'M 40 100 Q 46 84 54 78 T 58 62', color: '#B48CFF', delay: 0.7 },
]

const LIGHTS = Array.from({ length: 46 }, (_, i) => ({
  x: 30 + ((i * 37.7) % 100) * 0.34,
  y: 30 + ((i * 53.3) % 100) * 0.68,
  s: 1.5 + (i % 3),
  d: (i % 9) * 0.4,
  c: i % 4 === 0 ? '#9CD2FF' : '#FFD58A',
}))

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  x: 28 + ((i * 41.3) % 100) * 0.4,
  d: i * 0.65,
  s: 2 + (i % 3),
}))

const FEATURES = [
  { icon: Search, title: 'Search Nearby Businesses', text: 'Find shops, cafes, clinics and more in your area.', bg: '#CBEAFF', fg: '#1F6BF0' },
  { icon: BarChart3, title: 'Get Useful Insights', text: 'Know what businesses need and where to reach them.', bg: '#E2DBFF', fg: '#6A3FF0' },
  { icon: Send, title: 'Connect Easily', text: 'Contact and manage leads in one place.', bg: '#C8F5E4', fg: '#12A26E' },
  { icon: Users, title: 'Grow Your Business', text: 'Find new opportunities and reach more customers.', bg: '#FFE3C7', fg: '#F28C18' },
]

function GoogleIcon() {
  return (
    <svg style={{ width: 'clamp(16px,2.4vh,24px)', height: 'clamp(16px,2.4vh,24px)' }} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
function MicrosoftIcon() {
  const s = 'clamp(8px,1.1vh,11px)'
  return (
    <span className="grid grid-cols-2 gap-[2px]" aria-hidden="true">
      {['#F25022', '#7FBA00', '#00A4EF', '#FFB900'].map((c) => <span key={c} style={{ width: s, height: s, background: c }} />)}
    </span>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'
  const [mode, setMode] = useState(location.state?.mode || 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', designation: '' })

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }
  const switchMode = (m) => { setMode(m); setError(''); setSuccess('') }
  const socialSoon = (name) => { setError(''); setSuccess(`${name} sign-in is coming soon. Please use your email and password for now.`) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password)
        saveSession(res.data)
        navigate(redirectTo, { replace: true })
      } else if (mode === 'signup') {
        const res = await register({ name: form.name, email: form.email, password: form.password, company: form.company, designation: form.designation })
        saveSession(res.data)
        navigate(redirectTo, { replace: true })
      } else if (mode === 'forgot') {
        await forgotPassword(form.email)
        setSuccess('Password reset link sent to your email (demo mode)')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const ic = { width: 'clamp(16px,2.4vh,24px)', height: 'clamp(16px,2.4vh,24px)' }
  const inputClass = 'lp-input lp-field w-full rounded-xl transition-all'
  const inputPad = { paddingLeft: 'clamp(42px,5.6vh,58px)', paddingRight: 16 }

  return (
    <div className="relative min-h-screen lg:h-screen overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #0B2A6B 0%, #0E3A8C 40%, #0A2459 100%)' }}>
      <style>{CSS}</style>

      {/* ===== Animated background (desktop) ===== */}
      <div aria-hidden="true" className="hidden lg:block absolute inset-0 pointer-events-none">
        {/* city image with slow drift */}
        <div className="lp-drift absolute inset-0"
          style={{
            backgroundImage: 'url(/login-city.png), radial-gradient(60% 70% at 48% 70%, #1E4FB0 0%, transparent 70%)',
            backgroundSize: 'cover, cover', backgroundPosition: '60% center, center',
          }} />
        {/* blend so text and card stay readable */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(10,36,100,.97) 0%, rgba(10,36,100,.85) 26%, rgba(10,36,100,.15) 45%, rgba(10,36,100,.1) 60%, rgba(10,36,100,.55) 100%)' }} />
        <div className="absolute inset-x-0 top-0 h-[22%]" style={{ background: 'linear-gradient(180deg, rgba(10,36,100,.9), transparent)' }} />

        {/* twinkling window lights */}
        {LIGHTS.map((l, i) => (
          <span key={i} className="lp-twinkle absolute rounded-[1px]"
            style={{ left: `${l.x}%`, top: `${l.y}%`, width: l.s, height: l.s, background: l.c, animationDelay: `${l.d}s`, boxShadow: `0 0 6px ${l.c}` }} />
        ))}

        {/* glowing road trails */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {TRAILS.map((t, i) => (
            <g key={i}>
              <path d={t.d} fill="none" stroke={t.color} strokeOpacity=".18" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />
              <path className="lp-trail" d={t.d} fill="none" stroke={t.color} pathLength="100" vectorEffect="non-scaling-stroke"
                style={{ strokeWidth: 3, strokeLinecap: 'round', animationDelay: `${t.delay}s`, filter: `drop-shadow(0 0 4px ${t.color})` }} />
            </g>
          ))}
        </svg>

        {/* floating particles */}
        {PARTICLES.map((p, i) => (
          <span key={i} className="lp-up absolute rounded-full"
            style={{ left: `${p.x}%`, bottom: '-2vh', width: p.s, height: p.s, background: '#BFE3FF', boxShadow: '0 0 8px #8FCBFF', animationDelay: `${p.d}s` }} />
        ))}

        {/* coloured pins with labels */}
        {PINS.map((p, i) => {
          const Icon = p.icon
          const size = 'clamp(42px, 7.6vh, 82px)'
          return (
            <div key={p.label} className="absolute" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {/* ground glow + pulsing ring */}
              <span className="absolute left-0 top-0 rounded-full"
                style={{ width: `calc(${size} * .5)`, height: `calc(${size} * .18)`, transform: 'translate(-50%,-50%)', background: p.c1, boxShadow: `0 0 18px 6px ${p.glow}` }} />
              <span className="lp-ring absolute left-0 top-0 rounded-full"
                style={{ width: `calc(${size} * .9)`, height: `calc(${size} * .32)`, border: `2px solid ${p.c1}`, animationDelay: `${i * 0.5}s` }} />
              <div className="lp-pin absolute left-0 top-0" style={{ animationDelay: `${i * 0.45}s` }}>
                {/* label chip */}
                <span className="lp-pop lp-chip absolute left-1/2 whitespace-nowrap rounded-xl bg-white font-semibold text-[#0B1033] shadow-lg"
                  style={{ bottom: `calc(${size} * 1.3)`, padding: 'clamp(3px,.6vh,7px) clamp(10px,1.4vh,16px)', animationDelay: `${p.delay}s` }}>
                  {p.label}
                </span>
                {/* pin body */}
                <div className="flex items-center justify-center rounded-full rounded-br-none rotate-45"
                  style={{
                    width: size, height: size,
                    background: `radial-gradient(circle at 35% 30%, ${p.c1} 0%, ${p.c2} 80%)`,
                    border: '3px solid rgba(255,255,255,.85)',
                    boxShadow: `0 0 26px 4px ${p.glow}`,
                  }}>
                  <span className="-rotate-45 flex items-center justify-center rounded-full bg-white/25" style={{ width: '62%', height: '62%' }}>
                    <Icon className="text-white" style={{ width: '62%', height: '62%' }} strokeWidth={2.6} />
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ===== Top nav ===== */}
      <header className="relative z-20 flex items-center justify-between"
        style={{ padding: 'clamp(16px,3.4vh,36px) clamp(20px,4.6vw,72px) 0' }}>
        <Link to="/" className="flex items-center lp-rise" style={{ gap: 'clamp(8px,1.4vh,16px)' }}>
          <LogoMark vh={5.4} min={30} max={58} />
          <span className="lp-logo font-bold tracking-tight">LeadScope <span className="text-[#4D9BFF]">AI</span></span>
        </Link>
        <nav className="lp-nav hidden sm:flex items-center lp-rise" style={{ gap: 'clamp(18px,3vw,40px)' }}>
          <Link to="/" className="hover:text-[#9CCBFF] transition-colors">Home</Link>
          <a href="/#about" className="hover:text-[#9CCBFF] transition-colors">About</a>
          <a href="/#faq" className="hover:text-[#9CCBFF] transition-colors">Contact</a>
        </nav>
      </header>

      {/* ===== Content ===== */}
      <main className="relative z-10 grid lg:grid-cols-[1fr_minmax(380px,38%)] items-center lg:h-[calc(100vh-clamp(60px,10vh,110px))]"
        style={{ padding: 'clamp(12px,2vh,24px) clamp(20px,2.6vw,40px) clamp(16px,3vh,36px) clamp(20px,4.6vw,72px)', gap: 'clamp(20px,3vw,48px)' }}>

        {/* Left text */}
        <section className="hidden lg:flex flex-col justify-center self-stretch" style={{ maxWidth: '44vw' }}>
          <h1 className="lp-h1 lp-rise font-extrabold tracking-tight" style={{ animationDelay: '100ms' }}>
            Find Local<br />Businesses <span className="text-[#5AB0FF]">Easily</span>
          </h1>
          <p className="lp-sub lp-rise text-[#DCE8FF]" style={{ marginTop: 'clamp(10px,2.4vh,28px)', maxWidth: '34vw', lineHeight: 1.45, animationDelay: '200ms' }}>
            Search, explore and connect with the right businesses near you using AI.
          </p>
          <div className="flex flex-col" style={{ marginTop: 'clamp(16px,5vh,56px)', gap: 'clamp(12px,3.2vh,36px)', maxWidth: '30vw' }}>
            {FEATURES.map(({ icon: Icon, title, text, bg, fg }, i) => (
              <div key={title} className="lp-rise flex items-start" style={{ gap: 'clamp(12px,2.6vh,28px)', animationDelay: `${300 + i * 100}ms` }}>
                <span className="lp-ficon shrink-0 rounded-2xl flex items-center justify-center" style={{ background: bg, color: fg, boxShadow: '0 8px 20px -10px rgba(0,0,0,.4)' }}>
                  <Icon style={{ width: '46%', height: '46%' }} strokeWidth={2.4} />
                </span>
                <div>
                  <p className="lp-ft font-semibold">{title}</p>
                  <p className="lp-fd text-[#DCE8FF]" style={{ marginTop: 2, lineHeight: 1.45 }}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: white card */}
        <section className="lp-rise w-full bg-white text-[#0B1033] rounded-[24px] mx-auto"
          style={{ maxWidth: 640, padding: 'clamp(24px,5vh,56px) clamp(22px,3.4vw,64px)', boxShadow: '0 40px 80px -30px rgba(0,0,0,.55)', animationDelay: '250ms' }}>
          <div className="flex items-center justify-center" style={{ gap: 'clamp(10px,1.8vh,20px)' }}>
            <LogoMark vh={7} min={36} max={72} />
            <div>
              <p className="lp-rlogo font-extrabold leading-none tracking-tight">LeadScope <span className="text-[#1F5BF0]">AI</span></p>
              <p className="lp-rtag mt-1.5 text-[#3A4360]">Local Businesses. Real Opportunities.</p>
            </div>
          </div>

          <h2 className="lp-title font-extrabold" style={{ marginTop: 'clamp(22px,5.6vh,60px)' }}>
            {mode === 'login' && 'Welcome Back!'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="lp-rsub text-[#6B7390]" style={{ marginTop: 4 }}>
            {mode === 'login' && 'Log in to your account to continue.'}
            {mode === 'signup' && 'Start finding better leads today.'}
            {mode === 'forgot' && 'Enter your email to reset your password.'}
          </p>

          {error && <div className="lp-small mt-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}
          {success && <div className="lp-small mt-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">{success}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col" style={{ marginTop: 'clamp(14px,3vh,32px)', gap: 'clamp(10px,1.9vh,20px)' }}>
            {mode === 'signup' && (
              <>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6380]" style={ic} />
                  <input name="name" value={form.name} onChange={handleChange} required className={inputClass} style={inputPad} placeholder="Full name" />
                </div>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6380]" style={ic} />
                  <input name="company" value={form.company} onChange={handleChange} className={inputClass} style={inputPad} placeholder="Company name" />
                </div>
              </>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6380]" style={ic} />
              <input name="email" type="email" value={form.email} onChange={handleChange} required className={inputClass} style={inputPad} placeholder="Email address" />
            </div>

            {mode !== 'forgot' && (
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6380]" style={ic} />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange}
                  required minLength={6} className={inputClass} style={{ ...inputPad, paddingRight: 50 }} placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A6380] hover:text-[#0B1033]">
                  {showPassword ? <Eye style={ic} /> : <EyeOff style={ic} />}
                </button>
              </div>
            )}

            {mode === 'login' && (
              <div className="lp-small flex items-center justify-between">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    className="accent-[#1F5BF0]" style={{ width: 'clamp(15px,2.2vh,21px)', height: 'clamp(15px,2.2vh,21px)' }} />
                  Remember me
                </label>
                <button type="button" onClick={() => switchMode('forgot')} className="font-medium text-[#1F5BF0] hover:underline">Forgot password?</button>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="lp-btn w-full inline-flex items-center justify-center gap-2 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ background: '#1452F0', boxShadow: '0 14px 30px -12px rgba(20,82,240,.85)' }}>
              {loading ? 'Please wait...' : (<>{mode === 'login' ? 'Log In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'} <ArrowRight style={ic} /></>)}
            </button>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="lp-small flex items-center gap-4 text-[#6B7390]" style={{ margin: 'clamp(14px,3vh,30px) 0' }}>
                <span className="h-px flex-1 bg-[#D9DEEA]" /> or <span className="h-px flex-1 bg-[#D9DEEA]" />
              </div>
              <div className="flex flex-col" style={{ gap: 'clamp(8px,1.4vh,14px)' }}>
                <button type="button" onClick={() => socialSoon('Google')}
                  className="lp-field w-full flex items-center justify-center gap-3 rounded-xl border border-[#D9DEEA] font-medium hover:bg-[#F6F8FD] transition-colors">
                  <GoogleIcon /> Continue with Google
                </button>
                <button type="button" onClick={() => socialSoon('Microsoft')}
                  className="lp-field w-full flex items-center justify-center gap-3 rounded-xl border border-[#D9DEEA] font-medium hover:bg-[#F6F8FD] transition-colors">
                  <MicrosoftIcon /> Continue with Microsoft
                </button>
              </div>
            </>
          )}

          <p className="lp-small text-center text-[#6B7390]" style={{ marginTop: 'clamp(16px,4vh,44px)' }}>
            {mode === 'login' && (<>Don&apos;t have an account?{' '}<button onClick={() => switchMode('signup')} className="font-semibold text-[#1F5BF0] hover:underline ml-1">Sign up</button></>)}
            {mode === 'signup' && (<>Already have an account?{' '}<button onClick={() => switchMode('login')} className="font-semibold text-[#1F5BF0] hover:underline ml-1">Log in</button></>)}
            {mode === 'forgot' && (<>Remember password?{' '}<button onClick={() => switchMode('login')} className="font-semibold text-[#1F5BF0] hover:underline ml-1">Log in</button></>)}
          </p>
        </section>
      </main>
    </div>
  )
}