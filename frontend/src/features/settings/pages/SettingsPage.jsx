import { useCallback, useEffect, useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import { useNavigate } from 'react-router-dom'
import PageLoader from '@/components/ui/PageLoader'
import { useToast } from '@/hooks/useToast'
import { getCurrentUser, getInitials } from '@/utils/currentUser'
import { clearSession } from '@/services/authService'
import { getAccount, deleteAccount } from '@/services/accountService'
import {
  ProfileSection, PasswordSection, AgencySection, PreferencesSection, UsageSection, PrivacySection, SecuritySection,
} from '../components/SettingsSections'

/**
 * Settings: profile, password, agency profile for messages, default preferences,
 * usage this month, privacy (download / delete) and security.
 */
export default function SettingsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [account, setAccount] = useState(null)
  const [user, setUser] = useState(getCurrentUser)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const res = await getAccount()
      setAccount(res)
      setUser(getCurrentUser())
    } catch (e) {
      setError(e instanceof TypeError ? 'We could not reach the server. Please try again in a minute.' : e.message)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  async function removeAccount() {
    await deleteAccount()
    clearSession()
    toast.success('Your account and all your leads were deleted.')
    navigate('/login', { replace: true })
  }

  if (error) {
    return (
      <WhitePanel as="div" className="max-w-3xl" bodyClassName="text-center !p-8 sm:!p-10">
        <p className="text-sm text-red-400">{error}</p>
        <button type="button" onClick={load} className="mt-3 text-sm font-semibold text-aqua">Try again</button>
      </WhitePanel>
    )
  }
  if (!account) return <PageLoader />

  const name = user.name || 'User'

  return (
    <div className="space-y-6 max-w-4xl min-w-0">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 shrink-0 rounded-full bg-primary-600 text-white flex items-center justify-center text-lg font-bold" aria-hidden="true">
          {getInitials(name)}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800">Settings</h1>
          <p className="text-sm text-slate-500 truncate">{name}{user.agencyName ? ` · ${user.agencyName}` : ''}</p>
        </div>
      </div>

      <ProfileSection user={user} onSaved={setUser} />
      <AgencySection agency={account.agency} serviceOptions={account.serviceOptions} onSaved={setAccount} />
      <PreferencesSection user={user} onSaved={setUser} />
      <UsageSection usage={account.usage} />
      <PasswordSection />
      <SecuritySection lastLoginAt={account.lastLoginAt} currentLoginAt={account.currentLoginAt} onLogout={logout} />
      <PrivacySection onDelete={removeAccount} />
    </div>
  )
}
