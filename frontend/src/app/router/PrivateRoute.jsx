import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/services/authService'
import { ROUTES } from '@/config/navigation'

export default function PrivateRoute({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }
  return children
}
