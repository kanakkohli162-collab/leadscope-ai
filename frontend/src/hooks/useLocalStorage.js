import { useCallback, useState } from 'react'
import { storage } from '@/utils/storage'

/**
 * Like useState, but the value survives a page refresh.
 * Used for the sidebar's collapsed/expanded state.
 *
 * The function passed to useState (lazy initializer) runs only on the first
 * render, so we read localStorage once — not on every re-render.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => storage.get(key, initialValue))

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        storage.set(key, resolved)
        return resolved
      })
    },
    [key],
  )

  return [value, update]
}
