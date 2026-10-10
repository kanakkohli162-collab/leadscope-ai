import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react'
import { login, register, forgotPassword, saveSession } from '@/services/authService'
import { useToast } from '@/hooks/useToast'

const NOTICE_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  // If PrivateRoute bounced the user here, go back to that page after login
  const redirectTo = location.state?.from?.pathname || '/dashboard'
  const [mode, setMode] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // A notice is a non-error message: { type: 'success' | 'warning', text }.
  // Logout and "session expired" pass one in through the router's location.state.
  const [notice, setNotice] = useState(location.state?.notice || null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    company: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  // Sign in ↔ Sign up ↔ Forgot: old messages no longer apply to the new form
  const switchMode = (nextMode) => {
    setMode(nextMode)
    setError('')
    setNotice(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice(null)

    try {
      if (mode === 'login') {
        const res = await login(form.email, form.password)
        saveSession(res.data)
        toast.success(`Login successful. Welcome back, ${res.data.name || 'there'}!`)
        navigate(redirectTo, { replace: true })
      } else if (mode === 'signup') {
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          company: form.company,
        })
        // No auto-login: show the Sign in form with the email kept and the password cleared
        setMode('login')
        setForm((f) => ({ ...f, password: '' }))
        setNotice({
          type: 'success',
          text: 'Registration successful! Your account has been created. Please sign in.',
        })
      } else if (mode === 'forgot') {
        await forgotPassword(form.email)
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold">LeadScope AI</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Find. Analyze.<br />Connect. Grow.
          </h2>
          <p className="text-primary-100 text-lg max-w-md">
            AI-powered lead intelligence for smarter business outreach and growth.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {[
            { title: 'AI Lead Scoring', desc: 'Smart prioritization' },
            { title: 'Service Gap Detection', desc: 'Find opportunities' },
            { title: 'Personalized Outreach', desc: 'AI-crafted messages' },
            { title: 'BI Dashboard', desc: 'Data-driven insights' },
          ].map((item) => (
            <div key={item.title} className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-primary-200 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">LeadScope AI</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-slate-500 mt-1">
                {mode === 'login' && 'Sign in to your account'}
                {mode === 'signup' && 'Start finding better leads today'}
                {mode === 'forgot' && 'Enter your email to reset password'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
            )}
            {notice && (
              <div className={`mb-4 p-3 border text-sm rounded-lg ${NOTICE_STYLES[notice.type] || NOTICE_STYLES.success}`}>{notice.text}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="name" value={form.name} onChange={handleChange} required
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Your name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input name="company" value={form.company} onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Company name" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input name="email" type="email" value={form.email} onChange={handleChange} required
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="you@example.com" />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    {mode === 'login' && (
                      <button type="button" onClick={() => switchMode('forgot')}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input name="password" type={showPassword ? 'text' : 'password'} value={form.password}
                      onChange={handleChange} required minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {loading ? 'Please wait...' : (
                  mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-500">
              {mode === 'login' && (
                <>Don&apos;t have an account?{' '}
                  <button onClick={() => switchMode('signup')} className="text-primary-600 hover:text-primary-700 font-semibold">Sign up</button>
                </>
              )}
              {mode === 'signup' && (
                <>Already have an account?{' '}
                  <button onClick={() => switchMode('login')} className="text-primary-600 hover:text-primary-700 font-semibold">Sign in</button>
                </>
              )}
              {mode === 'forgot' && (
                <>Remember password?{' '}
                  <button onClick={() => switchMode('login')} className="text-primary-600 hover:text-primary-700 font-semibold">Sign in</button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
