/**
 * White panel on the dark ocean background (same look as the landing page's "Try a search" box):
 * a light blue frame (#E9F5FF, 10px / 8px on phones, 24px corners, soft shadow) around a white card
 * (16px corners, #202124 text).
 *
 * The inner card has the `ls-light` class, which switches the theme colours (see styles/index.css),
 * so existing classes such as text-slate-800, bg-inset, border-line, inputs and badges read dark-on-white inside it.
 *
 * Props: title, subtitle, actions (right side of the header), children, className (outer), bodyClassName (inner).
 */
export default function WhitePanel({
  title, subtitle, actions, children, className = '', bodyClassName = '', as: Tag = 'section', titleId, ...rest
}) {
  return (
    <Tag
      className={`min-w-0 rounded-[24px] p-2 sm:p-[10px] ${className}`}
      style={{ background: '#E9F5FF', boxShadow: '0 30px 70px -30px rgba(0,0,0,.6)' }}
      aria-labelledby={title && titleId ? titleId : undefined}
      {...rest}
    >
      <div className={`ls-light h-full min-w-0 rounded-2xl p-4 sm:p-5 lg:p-6 ${bodyClassName}`} style={{ background: '#FFFFFF', color: '#202124' }}>
        {(title || actions) && (
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              {title && <h2 id={titleId} className="text-base font-semibold text-slate-800">{title}</h2>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </div>
    </Tag>
  )
}
