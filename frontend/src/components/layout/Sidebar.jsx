import { memo, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Sparkles, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NAV_ITEMS } from '@/config/navigation'
import { getCurrentUser } from '@/utils/currentUser'

function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { pathname } = useLocation()

  // Logged-in user (saved in the browser at login)
  const user = getCurrentUser() || {}
  const userName = user.name || 'User'
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  // Close the mobile drawer with the Escape key
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => e.key === 'Escape' && onCloseMobile()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, onCloseMobile])

  return (
    <>
      {/* Backdrop — mobile only, while the drawer is open */}
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

        {/* Logged-in user */}
        <div className={clsx('px-4 py-4 border-t border-slate-700/50', collapsed && 'lg:px-0 lg:flex lg:justify-center')}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-sm font-semibold shrink-0"
              title={collapsed ? userName : undefined}
            >
              {initials}
            </div>
            <div className={clsx('min-w-0', collapsed && 'lg:hidden')}>
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-slate-400 truncate">{user.agencyName || user.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(Sidebar)