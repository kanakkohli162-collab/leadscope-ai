import { createContext, useContext } from 'react'

// Filled in by <ToastProvider> (components/ui/ToastProvider.jsx)
export const ToastContext = createContext(null)

/**
 * Show a small pop-up message from any component:
 *   const toast = useToast()
 *   toast.success('Saved!')   // green
 *   toast.error('Oops')       // red
 */
export function useToast() {
  const toast = useContext(ToastContext)
  if (!toast) throw new Error('useToast must be used inside <ToastProvider>')
  return toast
}
