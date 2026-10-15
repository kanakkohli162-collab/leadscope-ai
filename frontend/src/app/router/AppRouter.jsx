import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import PageLoader from '@/components/ui/PageLoader'
import PrivateRoute from './PrivateRoute'

// Each page loads only when it is opened (code splitting)
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const LeadDiscoveryPage = lazy(() => import('@/features/leads/pages/LeadDiscoveryPage'))
const LeadDetailsPage = lazy(() => import('@/features/leads/pages/LeadDetailsPage'))
const MyLeadsPage = lazy(() => import('@/features/leads/pages/MyLeadsPage'))
const OutreachGeneratorPage = lazy(() => import('@/features/outreach/pages/OutreachGeneratorPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

export default function AppRouter() {
  return (
    <Routes>
      {/* Public pages */}
      <Route
        path="/"
        element={
          <Suspense fallback={<PageLoader fullScreen />}>
            <LandingPage />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader fullScreen />}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* Logged-in pages: share the sidebar + topbar + Ask AI */}
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/lead-discovery" element={<LeadDiscoveryPage />} />
        <Route path="/lead/:id" element={<LeadDetailsPage />} />
        <Route path="/outreach" element={<OutreachGeneratorPage />} />
        <Route path="/my-leads" element={<MyLeadsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Old pages → merged into other screens */}
        <Route path="/export" element={<Navigate to="/my-leads" replace />} />
        <Route path="/saved-searches" element={<Navigate to="/lead-discovery" replace />} />
        <Route path="/ai-analysis/:id" element={<Navigate to="/my-leads" replace />} />
        <Route path="/chatbot" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* Unknown address → front page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}