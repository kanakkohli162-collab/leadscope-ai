/**
 * LeadScope logo mark: a white map pin with a "scope" ring on a blue rounded square.
 * size = pixels (number) or any CSS length, e.g. "clamp(30px, 5vh, 56px)". Default 40.
 * Decorative by default; pass `label` when the mark stands alone and should be announced.
 */
export default function LogoMark({ size = 40, className = '', label }) {
  const px = typeof size === 'number' ? `${size}px` : size
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={px}
      height={px}
      className={`shrink-0 ${className}`}
      style={{ width: px, height: px }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      focusable="false"
      shapeRendering="geometricPrecision"
    >
      <rect width="64" height="64" rx="16" fill="#0497F6" />
      <path d="M32 12c-8.8 0-16 7-16 15.7C16 39.4 32 52 32 52s16-12.6 16-24.3C48 19 40.8 12 32 12z" fill="#FFFFFF" />
      <circle cx="32" cy="27.5" r="8" fill="none" stroke="#0497F6" strokeWidth="3.5" />
      <circle cx="32" cy="27.5" r="2.6" fill="#0497F6" />
    </svg>
  )
}
