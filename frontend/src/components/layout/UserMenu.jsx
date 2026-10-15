import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { getCurrentUser } from '@/services/authService'
import { useLogout } from '@/hooks/useLogout'
import { ROUTES } from '@/config/navigation'
import { getInitials } from '@/utils/format'

/** The avatar + name button in the Topbar, with a dropdown: Settings and Log out. */
export default function UserMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const user = getCurrentUser()
  const logout = useLogout()

  // Close when the user clicks anywhere else or presses Escape
  useEffect(() => {
    if (!open) return
    const onMouseDown = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-card transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0497F6] to-[#4EB9E5] flex items-center justify-center text-white text-xs font-semibold">
          {getInitials(user.name)}
        </div>
        <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[140px] truncate">{user.name || 'Account'}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-60 bg-card border border-slate-200 rounded-xl shadow-lg shadow-black/40 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name || 'Account'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <Link
            to={ROUTES.settings}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-inset"
          >
            <Settings size={16} className="text-slate-400" /> Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 border-t border-line"
          >
            <LogOut size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  )
}
