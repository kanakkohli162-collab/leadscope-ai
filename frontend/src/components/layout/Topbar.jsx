import { memo, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ChevronDown, Menu, LogOut, Settings } from 'lucide-react'
import { getPageTitle } from '@/config/navigation'
import { getCurrentUser } from '@/utils/currentUser'
import { clearSession } from '@/services/authService'

function Topbar({ onOpenMobileNav }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const title = getPageTitle(pathname)

  const user = getCurrentUser() || {}
  const name = user.name || 'User'
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  // Close the menu when clicking outside it
  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function logout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger: only on screens where the sidebar is hidden */}
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

      {/* User menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#B526E8] to-[#FF5CD2] flex items-center justify-center text-white text-sm font-semibold">
            {initials}
          </div>
          <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[160px] truncate">{name}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div role="menu" className="absolute right-0 mt-2 w-60 rounded-xl bg-white border border-slate-200 shadow-xl py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email || ''}</p>
            </div>
            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Settings size={16} /> Settings
            </Link>
            <button
              type="button"
              onClick={logout}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={16} /> Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default memo(Topbar)