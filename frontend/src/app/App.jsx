import AppRouter from './router/AppRouter'
import ToastProvider from '@/components/ui/ToastProvider'

/**
 * Root component. Kept tiny on purpose: app-wide providers (theme, auth
 * context, React Query, etc.) get wrapped around <AppRouter /> here.
 */
export default function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  )
}
