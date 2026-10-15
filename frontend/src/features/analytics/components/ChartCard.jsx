import { LIGHT } from '../utils/chartTheme'

/**
 * White chart card with a light blue frame (outer #E9F5FF, 10px padding, 24px corners; inner white, 16px corners).
 * `reportId` marks the card so "Download report (PDF)" can copy its chart.
 * Fades in once (staggered by `index`) and lifts a little on hover; both off with reduced motion.
 */
export default function ChartCard({ title, caption, index = 0, reportId, className = '', action, children }) {
  return (
    <section
      data-report-chart={reportId}
      data-report-title={title}
      data-report-caption={caption}
      className={`min-w-0 rounded-[24px] p-2 sm:p-[10px] motion-safe:animate-fade-up motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1 ${className}`}
      style={{ background: LIGHT.frame, animationDelay: `${index * 70}ms`, boxShadow: '0 30px 70px -30px rgba(0,0,0,.6)' }}
    >
      <div className="ls-light h-full min-w-0 rounded-2xl p-4 sm:p-5" style={{ background: LIGHT.card, color: LIGHT.ink }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold" style={{ color: LIGHT.ink }}>{title}</h3>
            {caption && <p className="text-xs mt-0.5" style={{ color: LIGHT.muted }}>{caption}</p>}
          </div>
          {action}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </section>
  )
}

/** Shown inside a card when there is nothing to draw yet. */
export function EmptyChart({ children }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-center rounded-xl border border-dashed px-6 text-sm"
      style={{ borderColor: '#C9D7E8', color: LIGHT.muted }}>
      {children}
    </div>
  )
}
