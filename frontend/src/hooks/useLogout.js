import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession } from '@/services/authService'
import { ROUTES } from '@/config/navigation'

/**
 * One logout for the whole app (Topbar menu + Sidebar icon use the same code).
 * `replace: true` swaps the current history entry, so the browser Back button
 * can't return to the dashboard after logging out.
 */
export function useLogout() {
  const navigate = useNavigate()

  return useCallback(() => {
    clearSession()
    navigate(ROUTES.login, {
      replace: true,
      state: { notice: { type: 'success', text: 'You have been logged out successfully.' } },
    })
  }, [navigate])
}
