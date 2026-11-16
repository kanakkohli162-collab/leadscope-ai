
export const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua focus-visible:ring-offset-2 focus-visible:ring-offset-card'

export const chip = (active) =>
  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border motion-safe:transition-colors ${FOCUS} ${
    active
      ? 'bg-primary-600 border-primary-600 text-white'
      : 'bg-inset border-line text-slate-600 hover:bg-line hover:text-slate-800'
  }`

export const INPUT =
  'w-full py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600'

export const LEVEL_COLORS = { High: '#F5A524', Medium: '#0497F6', Low: '#8A9BAD' }
