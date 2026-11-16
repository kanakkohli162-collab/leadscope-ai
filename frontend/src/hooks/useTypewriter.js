import { useEffect, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function useTypewriter(text, runKey) {
  const [typing, setTyping] = useState(false)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!runKey || !text || prefersReducedMotion()) return undefined
    const total = text.length
    const step = Math.max(2, Math.ceil(total / 60))
    let shown = 0
    setCount(0)
    setTyping(true)
    const timer = setInterval(() => {
      shown += step
      if (shown >= total) {
        clearInterval(timer)
        setTyping(false)
      } else {
        setCount(shown)
      }
    }, 16)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey])

  return { shown: typing ? text.slice(0, count) : text, done: !typing, skip: () => setTyping(false) }
}
