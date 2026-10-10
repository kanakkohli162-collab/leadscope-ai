import { memo, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Sparkles, PanelLeftClose, PanelLeftOpen, X, LogOut } from 'lucide-react'
import { NAV_ITEMS } from '@/config/navigation'
import { getCurrentUser } from '@/services/authService'
import { useLogout } from '@/hooks/useLogout'
import { getInitials } from '@/utils/format'

/**
 * Collapsible sidebar.
 *
 * Desktop (lg and up, ≥1024px):
 *   Always visible. `collapsed` switches width between w-64 (icons + labels)
 *   and w-[72px] (icons only). The width change is animated with a CSS
 *   transition, which runs on the GPU and costs no JavaScript per frame.
 *
 * Mobile (< lg):
 *   Hidden off-screen (-translate-x-full). `mobileOpen` slides it in as a
 *   drawer with a dark backdrop. On mobile it always shows full labels.
 */
function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { pathname } = useLocation()
  const user = getCurrentUser()
  const logout = useLogout()

  // Let users close the drawer with the Escape key (accessibility)
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => e.key === 'Escape' && onCloseMobile()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey) // cleanup avoids duplicate listeners
  }, [mobileOpen, onCloseMobile])

  return (
    <>
      {/* Backdrop — only rendered on mobile while the drawer is open */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={clsx(
          'fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-[1px] transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        aria-label="Main navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-white shrink-0',
          'transition-[width,transform] duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          // on mobile always wide; on desktop depends on `collapsed`
          collapsed ? 'w-64 lg:w-[72px]' : 'w-64',
        )}
      >
        {/* Logo + collapse button */}
        <div
          className={clsx(
            'flex items-center h-16 border-b border-slate-700/50 px-4',
            collapsed ? 'lg:justify-center lg:px-0' : 'justify-between',
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className={clsx('min-w-0', collapsed && 'lg:hidden')}>
              <h1 className="text-lg font-bold tracking-tight leading-tight">LeadScope AI</h1>
              <p className="text-[10px] text-slate-400 font-medium">Find. Analyze. Grow.</p>
            </div>
          </div>

          {/* Mobile: close (X). Desktop: collapse. */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const forceActive = item.match && pathname.startsWith(item.match)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                // When collapsed the label is hidden, so `title` gives a hover tooltip
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    collapsed && 'lg:justify-center lg:px-0',
                    isActive || forceActive
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                  )
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className={clsx('truncate', collapsed && 'lg:sr-only')}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Expand button — desktop, collapsed state only */}
        {collapsed && (
          <div className="hidden lg:flex justify-center py-2 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* User + logout. When collapsed, the avatar and logout icon stack vertically. */}
        <div className={clsx('px-4 py-4 border-t border-slate-700/50', collapsed && 'lg:px-0')}>
          <div className={clsx('flex items-center gap-3', collapsed && 'lg:flex-col lg:gap-2')}>
            <div
              className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-sm font-semibold shrink-0"
              title={collapsed ? user.name : undefined}
            >
              {getInitials(user.name)}
            </div>
            <div className={clsx('min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <p className="text-sm font-medium truncate">{user.name || 'Account'}</p>
              <p className="text-xs text-slate-400 truncate">{user.agencyName || user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white shrink-0"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

// memo → skip re-rendering when the props haven't changed
export default memo(Sidebar)
