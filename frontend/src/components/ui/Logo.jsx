import LogoMark from './LogoMark'

/**
 * LeadScope logo: the mark + "LeadScope" (bold, display font) + a blue ".".
 *   size      mark size: pixels or a CSS length (default 40); the text scales with it
 *   showText  false = mark only
 *   light     dark text (#0B1F33) for white backgrounds; default is white text (dark backgrounds)
 *   textClassName  overrides the text size (e.g. a responsive class)
 */
export default function Logo({ size = 40, showText = true, light = false, className = '', textClassName = '' }) {
  const px = typeof size === 'number' ? `${size}px` : size
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: `calc(${px} * 0.28)`, fontSize: textClassName ? undefined : `calc(${px} * 0.6)` }}
    >
      <LogoMark size={size} />
      {showText && (
        <span
          className={`font-display font-bold tracking-tight leading-none ${textClassName}`}
          style={{ color: light ? '#0B1F33' : '#FFFFFF' }}
        >
          LeadScope<span style={{ color: '#0497F6' }}>.</span>
        </span>
      )}
    </span>
  )
}
