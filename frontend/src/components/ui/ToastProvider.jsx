import { useCallback, useMemo, useRef, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'
import { ToastContext } from '@/hooks/useToast'

const AUTO_CLOSE_MS = 3500

const STYLES = {
  success: { box: 'bg-green-50 border-green-200 text-green-800', icon: CheckCircle },
  error: { box: 'bg-red-50 border-red-200 text-red-800', icon: AlertCircle },
}

/**
 * Wraps the whole app (see App.jsx) so any page can call useToast().
 * It keeps the list of visible toasts and draws them in the top-right corner.
 * Living above the router means a toast survives the page change after login.
 */
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message, type) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), AUTO_CLOSE_MS) // auto-close
  }, [dismiss])

  // useMemo → the same object every render, so components using useToast() don't re-render needlessly
  const api = useMemo(() => ({
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}

      <div className="fixed top-4 right-4 z-[100] space-y-2 w-[calc(100%-2rem)] max-w-sm" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const { box, icon: Icon } = STYLES[toast.type] || STYLES.success
          return (
            <div key={toast.id} className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-lg text-sm font-medium ${box}`}>
              <Icon size={18} className="shrink-0 mt-0.5" />
              <p className="flex-1">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Close message">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
