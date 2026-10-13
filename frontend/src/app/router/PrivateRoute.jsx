import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/services/authService'
import { ROUTES } from '@/config/navigation'

/** Blocks every page inside the app until the user has a token. */
export default function PrivateRoute({ children }) {
  const location = useLocation()
  if (!isAuthenticated()) {
    // `state.from` lets the login page send the user back where they were going
    return <Navigate to={ROUTES.login} replace state={{ from: location }} />
  }
  return children
}
