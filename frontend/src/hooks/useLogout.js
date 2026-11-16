import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession } from '@/services/authService'
import { ROUTES } from '@/config/navigation'

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
