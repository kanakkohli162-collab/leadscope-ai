import { useEffect, useState } from 'react'
import { CircleCheck, Loader2, Circle } from 'lucide-react'

const STEPS = ['Fetching businesses', 'Cleaning data', 'Checking digital gaps', 'Scoring leads']
const STEP_MS = 1500

/**
 * Shown while a search runs: 4 steps tick one after another (the last one waits for the server),
 * then all tick when `done`. Animations are switched off for people who prefer reduced motion.
 */
export default function SearchProgress({ city, done }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), STEP_MS)
    return () => clearInterval(timer)
  }, [])

  const current = done ? STEPS.length : step

  return (
    <div className="space-y-4" aria-live="polite" aria-busy={!done}>
      <div>
        <p className="text-sm font-semibold text-slate-800">
          Finding businesses in {city}… <span className="font-normal text-slate-500">usually takes 5–10 seconds</span>
        </p>
        <ol className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((label, i) => {
            const state = i < current ? 'done' : i === current ? 'active' : 'waiting'
            return (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm motion-safe:transition-colors ${
                  state === 'done' ? 'border-green-500/40 text-green-300 bg-green-500/10'
                    : state === 'active' ? 'border-primary-600 text-slate-800 bg-inset'
                      : 'border-line text-slate-400'
                }`}
              >
                {state === 'done' && <CircleCheck size={16} aria-hidden="true" />}
                {state === 'active' && <Loader2 size={16} className="text-aqua motion-safe:animate-spin" aria-hidden="true" />}
                {state === 'waiting' && <Circle size={16} aria-hidden="true" />}
                <span>{label}</span>
                <span className="sr-only">{state === 'done' ? '(done)' : state === 'active' ? '(working)' : ''}</span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-line p-5 motion-safe:animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 rounded bg-line" />
                <div className="h-3 w-1/3 rounded bg-line" />
              </div>
              <div className="w-11 h-11 rounded-full bg-line" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-line" />
              <div className="h-3 w-2/3 rounded bg-line" />
            </div>
            <div className="mt-5 flex gap-2">
              <div className="h-7 w-20 rounded-md bg-line" />
              <div className="h-7 w-24 rounded-md bg-line" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
