import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE } from '@/services/apiClient'
import { fetchCurrentUser } from '@/services/authService'
import { ROUTES } from '@/config/navigation'

/**
 * Used once, in AppLayout (the shell around every logged-in page).
 *
 * 1. Listens for apiClient's "session expired" announcement (any API call that
 *    got a 401) and sends the user to /login with a message.
 * 2. When the app opens, asks the backend who we are. If the saved token is
 *    old or invalid, that call gets a 401 and step 1 kicks in.
 */
export function useSessionGuard() {
  const navigate = useNavigate()

  useEffect(() => {
    const onExpired = () => {
      navigate(ROUTES.login, {
        replace: true,
        state: {
          notice: { type: 'warning', text: SESSION_EXPIRED_MESSAGE },
          // lets the login page bring the user back to the page they were on
          from: { pathname: window.location.pathname },
        },
      })
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [navigate])

  useEffect(() => {
    // Errors are handled by the listener above (401) or ignored (server offline)
    fetchCurrentUser().catch(() => {})
  }, [])
}
