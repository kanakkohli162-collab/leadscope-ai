import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PageLoader from '@/components/ui/PageLoader'
import ChatWidget from '@/features/chat/components/ChatWidget'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/utils/storage'

/**
 * The shell around every logged-in page.
 *
 * It owns two pieces of sidebar state:
 *  - `collapsed`  → desktop: wide (labels) vs. narrow (icons only). Remembered across reloads.
 *  - `mobileOpen` → phones/tablets: the sidebar slides in as a drawer over the page.
 *
 * <ChatWidget /> lives here (not inside a page), so the Ask AI button appears on
 * every page AND its conversation survives when you navigate between pages,
 * because this layout component never unmounts while you move around the app.
 */
export default function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage(STORAGE_KEYS.sidebarCollapsed, false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the mobile drawer after the user taps a link
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // useCallback keeps the same function identity between renders, so Sidebar/Topbar
  // (wrapped in memo) don't re-render just because AppLayout did.
  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [setCollapsed])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenMobileNav={openMobile} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Suspense here (not around the whole app) keeps the sidebar visible
              while only the page area shows a loader. */}
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ChatWidget />
    </div>
  )
}
