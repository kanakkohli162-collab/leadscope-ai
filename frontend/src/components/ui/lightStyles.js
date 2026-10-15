/**
 * Class helpers for content inside a WhitePanel (light palette).
 * Most existing classes already turn light inside a panel (via .ls-light), these are for new or explicit uses.
 */

export const LIGHT = {
  text: '#202124',
  muted: '#5F6368',
  border: '#EBEBEB',
  fill: '#F5F8FC',
  primary: '#447EFC',
  grid: '#EEF1F4',
}

/** Light input / select / textarea */
export const lightInput =
  'w-full px-3 py-2.5 bg-white border border-[#EBEBEB] rounded-lg text-sm text-[#202124] placeholder:text-[#9AA0A6] focus:outline-none focus:border-[#447EFC] focus:ring-4 focus:ring-[rgba(68,126,252,.25)]'

/** Light table parts */
export const lightTable = {
  table: 'w-full text-sm text-[#202124]',
  head: 'bg-[#F5F8FC] text-left text-xs font-semibold text-[#5F6368]',
  row: 'border-t border-[#EBEBEB] hover:bg-[#F5F8FC]',
  cell: 'px-4 py-3',
}

/** Light chips by meaning: hot, problem, success, medium, low, neutral */
const CHIP_TONES = {
  hot: 'bg-[#FFF1D6] text-[#9A6508] border-[#F5A524]/40',
  problem: 'bg-[#FDECEC] text-[#C5221F] border-[#C5221F]/20',
  success: 'bg-[#E6F4EA] text-[#188038] border-[#188038]/20',
  medium: 'bg-[#E8F1FF] text-[#447EFC] border-[#447EFC]/25',
  low: 'bg-[#F1F3F4] text-[#5F6368] border-[#E0E3E7]',
  neutral: 'bg-[#F5F8FC] text-[#5F6368] border-[#EBEBEB]',
}
export const lightChip = (tone = 'neutral') =>
  `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CHIP_TONES[tone] || CHIP_TONES.neutral}`

/** Recharts on white: axis text, grid and white tooltips */
export const lightChart = {
  axis: { tick: { fontSize: 12, fill: '#5F6368' }, axisLine: false, tickLine: false },
  grid: '#EEF1F4',
  tooltip: {
    contentStyle: { background: '#FFFFFF', border: '1px solid #EBEBEB', borderRadius: 12, color: '#202124', fontSize: 13, boxShadow: '0 8px 24px -12px rgba(32,33,36,.35)' },
    labelStyle: { color: '#202124', fontWeight: 600 },
    itemStyle: { color: '#202124' },
    cursor: { fill: '#F5F8FC' },
  },
}
