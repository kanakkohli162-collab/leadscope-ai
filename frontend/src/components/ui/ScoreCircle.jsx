/**
 * Lead score as a ring gauge (0–100).
 * Hot (70+) = marigold, warm (40–69) = azure, cold = deep blue.
 */
export default function ScoreCircle({ score = 0, size = 'md' }) {
  const dims = { sm: 44, md: 56, lg: 84 }
  const px = dims[size] || dims.md
  const stroke = size === 'lg' ? 7 : 4
  const r = (px - stroke) / 2
  const circumference = 2 * Math.PI * r
  const value = Math.max(0, Math.min(100, Number(score) || 0))
  const color = value >= 70 ? '#F5A524' : value >= 40 ? '#0497F6' : '#2A5F8A'
  const textSize = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-base' : 'text-sm'

  return (
    <div
      className="relative shrink-0"
      style={{ width: px, height: px }}
      role="img"
      aria-label={`Lead score ${value} out of 100`}
      title={`Lead score ${value} / 100`}
    >
      <svg width={px} height={px} className="-rotate-90">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" className="ls-ring-track" strokeWidth={stroke} />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center font-display font-bold text-ink ${textSize}`}>
        {value}
      </span>
    </div>
  )
}