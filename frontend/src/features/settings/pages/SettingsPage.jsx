import { useNavigate } from 'react-router-dom'
import { User, Mail, Building, LogOut, ShieldCheck } from 'lucide-react'
import { getCurrentUser } from '@/utils/currentUser'
import { clearSession } from '@/services/authService'

export default function SettingsPage() {
  const navigate = useNavigate()
  const user = getCurrentUser() || {}
  const name = user.name || 'User'
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  const rows = [
    { icon: User, label: 'Name', value: user.name || '—' },
    { icon: Mail, label: 'Email', value: user.email || '—' },
    { icon: Building, label: 'Agency / Company', value: user.agencyName || '—' },
  ]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Your account details</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold">
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800">{name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 divide-y divide-line">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-3.5">
              <span className="w-9 h-9 rounded-lg bg-primary-600/15 text-primary-600 flex items-center justify-center">
                <Icon size={17} />
              </span>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-medium text-slate-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card rounded-xl border border-slate-200 p-6">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
            <ShieldCheck size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">Your account is protected</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Your password is stored securely (BCrypt), and only you can see your leads.
            </p>
          </div>
        </div>
      </div>

      {/* Log out */}
      <button
        onClick={logout}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 transition-colors"
      >
        <LogOut size={17} /> Log out
      </button>
    </div>
  )
}