import { memo, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import clsx from 'clsx'
import { Sparkles, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { NAV_ITEMS } from '@/config/navigation'
import { getCurrentUser } from '@/utils/currentUser'

function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }) {
  const { pathname } = useLocation()

  const user = getCurrentUser() || {}
  const userName = user.name || 'User'
  const initials = userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => e.key === 'Escape' && onCloseMobile()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen, onCloseMobile])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={clsx(
          'fixed inset-0 z-30 bg-ink/40 backdrop-blur-[1px] transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        aria-label="Main navigation"
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-white border-r border-primary-100 text-ink shrink-0',
          'transition-[width,transform] duration-300 ease-in-out',
          'lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          collapsed ? 'w-64 lg:w-[76px]' : 'w-64',
        )}
      >
        <div className={clsx('flex items-center h-16 px-4', collapsed ? 'lg:justify-center lg:px-0' : 'justify-between')}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-sm shadow-primary-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className={clsx('min-w-0', collapsed && 'lg:hidden')}>
              <p className="font-display text-lg font-bold leading-tight text-ink">LeadScope AI</p>
              <p className="text-[11px] text-slate-500">Find businesses that need you</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-700"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-700"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

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
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    collapsed && 'lg:justify-center lg:px-0',
                    isActive || forceActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-600 hover:bg-mist hover:text-ink',
                  )
                }
              >
                <Icon size={19} className="shrink-0" />
                <span className={clsx('truncate', collapsed && 'lg:sr-only')}>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {collapsed && (
          <div className="hidden lg:flex justify-center py-2">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="p-2 rounded-lg text-slate-400 hover:bg-primary-50 hover:text-primary-700"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        <div className={clsx('p-3', collapsed && 'lg:flex lg:justify-center')}>
          <div className={clsx('flex items-center gap-3 rounded-xl bg-mist p-3', collapsed && 'lg:bg-transparent lg:p-0')}>
            <div
              className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shrink-0"
              title={collapsed ? userName : undefined}
            >
              {initials}
            </div>
            <div className={clsx('min-w-0', collapsed && 'lg:hidden')}>
              <p className="text-sm font-semibold truncate text-ink">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{user.agencyName || user.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default memo(Sidebar)