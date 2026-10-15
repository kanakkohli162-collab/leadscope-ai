/**
 * "Download report (PDF)": same approach as exportLeadsToPdf — opens a clean printable page and the browser's
 * "Save as PDF" makes the file. Charts are copied from the page as SVG (sharp in the PDF, no extra library).
 */

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

/** Every chart card on the page marked with data-report-chart → { title, caption, svg | html } */
function collectCharts(root) {
  return [...root.querySelectorAll('[data-report-chart]')].map((card) => {
    const svg = card.querySelector('svg.recharts-surface')
    const matrix = card.querySelector('[data-report-matrix]')
    let body = ''
    if (svg) {
      const copy = svg.cloneNode(true)
      copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      copy.removeAttribute('style')
      copy.setAttribute('style', 'max-width:100%;height:auto')
      body = new XMLSerializer().serializeToString(copy)
    } else if (matrix) {
      body = matrix.outerHTML
    }
    const legend = card.querySelector('[data-report-legend]')
    return {
      title: card.dataset.reportTitle,
      caption: card.dataset.reportCaption,
      body: body + (legend ? `<p class="legend">${esc(legend.textContent)}</p>` : ''),
    }
  }).filter((c) => c.body)
}

export function downloadInsightsReport({ root, summary, insights, aiSummary, filtersText }) {
  const charts = collectCharts(root)
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>LeadScope AI – Insights report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #202124; padding: 24px; }
    h1 { margin: 0; font-size: 22px; } h1 span { color: #447EFC; }
    .muted { color: #5F6368; font-size: 12px; margin: 4px 0 18px; }
    .row { display: flex; gap: 10px; margin-bottom: 18px; }
    .kpi { flex: 1; border: 1px solid #D6E6FB; background: #E9F5FF; border-radius: 12px; padding: 10px 12px; }
    .kpi b { display: block; font-size: 20px; } .kpi span { font-size: 11px; color: #5F6368; }
    h2 { font-size: 15px; margin: 18px 0 8px; }
    ul { margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.5; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .chart { border: 1px solid #D6E6FB; border-radius: 14px; padding: 10px 12px; break-inside: avoid; }
    .chart h3 { margin: 0; font-size: 13px; } .chart p { margin: 2px 0 6px; font-size: 11px; color: #5F6368; }
    .chart .legend { margin-top: 4px; }
    table { border-collapse: separate; border-spacing: 3px; font-size: 10px; width: 100%; }
    table button { width: 100%; border: 0; border-radius: 6px; padding: 6px 0; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  </style></head><body>
  <h1>LeadScope AI <span>–</span> Insights report</h1>
  <p class="muted">${esc(date)} · ${esc(filtersText)}</p>
  <div class="row">${summary.map((s) => `<div class="kpi"><b>${esc(s.value)}</b><span>${esc(s.label)}</span></div>`).join('')}</div>
  ${insights.length ? `<h2>What your data says</h2><ul>${insights.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  ${aiSummary ? `<h2>AI summary</h2><p style="font-size:13px;line-height:1.5">${esc(aiSummary.summary)}</p>
    <ul>${aiSummary.recommendations.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
  <h2>Charts</h2>
  <div class="grid">${charts.map((c) => `<div class="chart"><h3>${esc(c.title)}</h3>${c.caption ? `<p>${esc(c.caption)}</p>` : ''}${c.body}</div>`).join('')}</div>
  <script>window.onload = () => setTimeout(() => window.print(), 300)</script>
  </body></html>`
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  return true
}
