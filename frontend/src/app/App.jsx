import AppRouter from './router/AppRouter'

/**
 * Root component. Kept tiny on purpose: app-wide providers (theme, auth
 * context, React Query, etc.) get wrapped around <AppRouter /> here later.
 */
export default function App() {
  return <AppRouter />
}
