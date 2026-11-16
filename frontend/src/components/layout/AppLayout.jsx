import { Suspense, useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import PageLoader from '@/components/ui/PageLoader'
import ChatWidget from '@/features/chat/components/ChatWidget'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/utils/storage'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useLocalStorage(STORAGE_KEYS.sidebarCollapsed, false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), [setCollapsed])
  const openMobile = useCallback(() => setMobileOpen(true), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="ls-app flex h-screen bg-abyss text-ink overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onOpenMobileNav={openMobile} />
        <main className="flex-1 overflow-y-auto bg-abyss p-4 sm:p-6">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ChatWidget />
    </div>
  )
}
