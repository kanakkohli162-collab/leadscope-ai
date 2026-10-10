import { memo } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Bell, ChevronDown, Menu } from 'lucide-react'
import { getPageTitle } from '@/config/navigation'

function Topbar({ onOpenMobileNav }) {
  const { pathname } = useLocation()
  const title = getPageTitle(pathname)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — only on screens where the sidebar is hidden */}
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold text-slate-800 truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads..."
            className="pl-9 pr-4 py-2 w-64 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button type="button" className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors" aria-label="Notifications">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <button type="button" className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
            MS
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block">Megha Sharma</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </header>
  )
}

export default memo(Topbar)
