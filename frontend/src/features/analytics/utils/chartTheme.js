/** Light chart theme for the white Insights cards. */
export const LIGHT = { frame: '#E9F5FF', card: '#FFFFFF', ink: '#202124', muted: '#5F6368', accent: '#447EFC', grid: '#E8EEF5' }

export const PRIORITY_COLORS = { High: '#F5A524', Medium: '#447EFC', Low: '#B0BEC5' }
export const SENTIMENT_COLORS = { Positive: '#34A853', Neutral: '#FBBC04', Negative: '#EA4335' }

/** White tooltips */
export const TOOLTIP = {
  contentStyle: { background: '#FFFFFF', border: '1px solid #DCE6F2', borderRadius: 12, color: '#202124', fontSize: 13, boxShadow: '0 8px 24px -12px rgba(32,33,36,.35)' },
  labelStyle: { color: '#202124', fontWeight: 600 },
  itemStyle: { color: '#202124' },
  cursor: { fill: '#F1F6FD' },
}

export const AXIS = { tick: { fontSize: 12, fill: '#5F6368' }, axisLine: false, tickLine: false }

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
/** Recharts draw animation (~900 ms), off with reduced motion */
export const ANIM = { isAnimationActive: !reduced, animationDuration: 900 }
