import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE } from '@/services/apiClient'
import { fetchCurrentUser } from '@/services/authService'
import { ROUTES } from '@/config/navigation'

export function useSessionGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    const onExpired = () => {
      navigate(ROUTES.login, {
        replace: true,
        state: {
          notice: { type: 'warning', text: SESSION_EXPIRED_MESSAGE },
          from: { pathname: window.location.pathname },
        },
      })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [navigate])

  useEffect(() => {
    fetchCurrentUser().catch(() => {})
  }, [])
}
