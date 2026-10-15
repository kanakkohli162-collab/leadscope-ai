import { useNavigate } from 'react-router-dom'
import { LIGHT } from '../utils/chartTheme'

/**
 * Opportunity matrix: top categories (rows) × top areas (columns). Each cell = hot leads, darker = more.
 * Hover shows details; click opens My Leads filtered to that category + area.
 */
export default function OpportunityMatrix({ matrix }) {
  const navigate = useNavigate()
  const { categories, areas, cells, max } = matrix

  if (!categories.length || !areas.length) {
    return <p className="text-sm" style={{ color: LIGHT.muted }}>Save leads in a few categories and areas to see the matrix.</p>
  }

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="w-full min-w-[520px] border-separate text-xs" style={{ borderSpacing: 4 }} data-report-matrix>
        <thead>
          <tr>
            <th className="text-left font-medium p-1" style={{ color: LIGHT.muted }}>Category \ Area</th>
            {areas.map((a) => (
              <th key={a} scope="col" className="font-semibold p-1 text-center truncate max-w-[90px]" style={{ color: LIGHT.ink }} title={a}>{a}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((c) => (
            <tr key={c}>
              <th scope="row" className="text-left font-semibold p-1 truncate max-w-[120px]" style={{ color: LIGHT.ink }} title={c}>{c}</th>
              {areas.map((a) => {
                const cell = cells[`${c}|${a}`] || { total: 0, hot: 0, noWebsite: 0 }
                const strength = cell.hot / max
                const detail = `${c} in ${a}: ${cell.hot} hot of ${cell.total} leads, ${cell.noWebsite} without website`
                return (
                  <td key={a} className="p-0">
                    <button
                      type="button"
                      disabled={!cell.total}
                      title={cell.total ? `${detail}. Click to open in My Leads.` : `No ${c.toLowerCase()} saved in ${a}`}
                      aria-label={cell.total ? `${detail}. Open in My Leads` : `No leads for ${c} in ${a}`}
                      onClick={() => navigate(`/my-leads?category=${encodeURIComponent(c)}&area=${encodeURIComponent(a)}`)}
                      className="w-full h-11 rounded-lg font-bold motion-safe:transition-transform motion-safe:hover:scale-105 disabled:cursor-default disabled:hover:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#447EFC]"
                      style={{
                        background: cell.total ? `rgba(68,126,252,${0.08 + strength * 0.85})` : '#F4F7FB',
                        color: strength > 0.5 ? '#FFFFFF' : LIGHT.ink,
                      }}
                    >
                      {cell.total ? cell.hot : '–'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px]" style={{ color: LIGHT.muted }}>Number = hot leads (score 70+). Darker = more. “–” = none saved.</p>
    </div>
  )
}
