/**
 * Export leads to Excel (CSV) or PDF, straight from the browser.
 * No backend needed: the leads are already loaded on the page.
 */

const COLUMNS = [
  ['Business', (l) => l.name],
  ['Category', (l) => l.category],
  ['City', (l) => l.location],
  ['Address', (l) => l.address],
  ['Phone', (l) => l.phone],
  ['Website', (l) => l.website || 'No website'],
  ['Score', (l) => l.score],
  ['Priority', (l) => l.priority],
  ['Status', (l) => l.status],
  ['Opportunities', (l) => (l.serviceGaps || []).join(', ')],
  ['Notes', (l) => l.notes],
]

const today = () => new Date().toISOString().slice(0, 10)

/** Excel: a .csv file opens directly in Excel / Google Sheets */
export function exportLeadsToExcel(leads) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const rows = [
    COLUMNS.map(([h]) => escape(h)).join(','),
    ...leads.map((l) => COLUMNS.map(([, get]) => escape(get(l))).join(',')),
  ]
  // \uFEFF makes Excel read Hindi / ₹ / special characters correctly
  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leadscope-leads-${today()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** PDF: opens a clean printable report; choose "Save as PDF" */
export function exportLeadsToPdf(leads) {
  const esc = (v) => String(v ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const head = COLUMNS.filter(([h]) => h !== 'Notes' && h !== 'Address')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>LeadScope AI – Leads Report</title>
  <style>
    body { font-family: Arial, sans-serif; color: #200B33; padding: 24px; }
    h1 { margin: 0; font-size: 22px; } h1 span { color: #B526E8; }
    p { color: #715A86; margin: 4px 0 16px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #310E50; color: #fff; text-align: left; padding: 7px; }
    td { border-bottom: 1px solid #F0E3FB; padding: 6px 7px; vertical-align: top; }
    tr:nth-child(even) td { background: #FAF4FF; }
  </style></head><body>
  <h1>LeadScope<span>.</span> Leads Report</h1>
  <p>${leads.length} leads · exported on ${new Date().toLocaleDateString('en-IN')}</p>
  <table><thead><tr>${head.map(([h]) => `<th>${h}</th>`).join('')}</tr></thead>
  <tbody>${leads.map((l) => `<tr>${head.map(([, get]) => `<td>${esc(get(l))}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <script>window.onload = () => window.print()</script>
  </body></html>`
  const win = window.open('', '_blank')
  if (!win) { alert('Please allow pop-ups to export the PDF.'); return }
  win.document.write(html)
  win.document.close()
}