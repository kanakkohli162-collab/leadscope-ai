import { useEffect, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Counts from 0 up to `value` once (~900 ms). Shows the number at once with reduced motion. */
export default function CountUp({ value, suffix = '' }) {
  const [shown, setShown] = useState(() => (reduced() ? value : 0))

  useEffect(() => {
    if (reduced()) {
      setShown(value)
      return undefined
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 900)
      setShown(Math.round(value * (1 - (1 - t) ** 3)))   // ease-out
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <>{shown}{suffix}</>
}
