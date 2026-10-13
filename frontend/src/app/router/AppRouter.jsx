import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import PageLoader from '@/components/ui/PageLoader'
import PrivateRoute from './PrivateRoute'

/**
 * CODE SPLITTING (the biggest performance win in this refactor)
 * ------------------------------------------------------------
 * Before: every page was imported at the top of App.jsx, so the browser had
 * to download ALL 12 pages (plus the heavy Recharts library) before showing
 * even the login screen.
 *
 * Now: `lazy(() => import(...))` tells Vite to put each page in its own JS
 * file. The browser downloads a page only when the user navigates to it.
 * <Suspense> shows <PageLoader /> during that short download.
 */
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const LeadDiscoveryPage = lazy(() => import('@/features/leads/pages/LeadDiscoveryPage'))
const LeadDetailsPage = lazy(() => import('@/features/leads/pages/LeadDetailsPage'))
const AILeadAnalysisPage = lazy(() => import('@/features/leads/pages/AILeadAnalysisPage'))
const MyLeadsPage = lazy(() => import('@/features/leads/pages/MyLeadsPage'))
const OutreachGeneratorPage = lazy(() => import('@/features/outreach/pages/OutreachGeneratorPage'))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage'))
const ExportReportsPage = lazy(() => import('@/features/reports/pages/ExportReportsPage'))
const SavedSearchesPage = lazy(() => import('@/features/saved-searches/pages/SavedSearchesPage'))
const SettingsPage = lazy(() => import('@/features/settings/pages/SettingsPage'))

export default function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader fullScreen />}>
            <LoginPage />
          </Suspense>
        }
      />

      {/* Everything below shares the sidebar + topbar + floating Ask AI widget */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="lead-discovery" element={<LeadDiscoveryPage />} />
        <Route path="lead/:id" element={<LeadDetailsPage />} />
        <Route path="ai-analysis/:id" element={<AILeadAnalysisPage />} />
        <Route path="outreach" element={<OutreachGeneratorPage />} />
        <Route path="my-leads" element={<MyLeadsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="export" element={<ExportReportsPage />} />
        <Route path="saved-searches" element={<SavedSearchesPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Old chatbot page → it's now the floating widget available everywhere */}
        <Route path="chatbot" element={<Navigate to="/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
