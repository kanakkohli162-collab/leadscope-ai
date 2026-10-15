import { checklist, scoreColor, scoreLabel } from './checkItems'

/**
 * "Download audit PDF": a one-page website audit, made the same way as the other PDF exports
 * (a clean printable page; the browser's "Save as PDF" makes the file).
 */
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function downloadAuditPdf(result, preparedBy) {
  const items = checklist(result)
  const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  const mark = { good: '✅', bad: '❌', unknown: '➖' }
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Website audit – ${esc(result.finalUrl)}</title>
  <style>
    @page { size: A4; margin: 16mm; }
    body { font-family: Arial, sans-serif; color: #202124; margin: 0; }
    h1 { font-size: 22px; margin: 0; } h1 span { color: #447EFC; }
    .muted { color: #5F6368; font-size: 12px; }
    .top { display: flex; align-items: center; gap: 20px; margin: 18px 0; padding: 14px 16px; border: 1px solid #D6E6FB; background: #E9F5FF; border-radius: 14px; }
    .score { width: 84px; height: 84px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center;
      color: #fff; font-weight: 700; font-size: 28px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .score small { font-size: 10px; font-weight: 400; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td { padding: 7px 6px; border-bottom: 1px solid #E8EEF5; vertical-align: top; }
    td.m { width: 26px; font-size: 14px; } td.t { width: 150px; font-weight: 700; } td.w { color: #5F6368; }
    h2 { font-size: 14px; margin: 18px 0 6px; }
    ul { margin: 0; padding-left: 18px; font-size: 12px; line-height: 1.6; }
    .tip { font-size: 13px; padding: 10px 12px; border-left: 4px solid #447EFC; background: #F4F8FF; }
    .foot { margin-top: 22px; font-size: 12px; color: #5F6368; border-top: 1px solid #E8EEF5; padding-top: 8px; }
  </style></head><body>
  <h1>Website audit <span>·</span> ${esc(result.title || result.finalUrl)}</h1>
  <p class="muted">${esc(result.finalUrl)} · ${esc(date)}</p>
  <div class="top">
    <div class="score" style="background:${scoreColor(result.score)}">${esc(result.score)}<small>out of 100</small></div>
    <div><b style="font-size:16px">${esc(scoreLabel(result.score))}</b>
      <p class="muted" style="margin:4px 0 0">Score starts at 100 and loses points for each problem found.</p></div>
  </div>
  <h2>Checklist</h2>
  <table>${items.map((i) => `<tr><td class="m">${mark[i.state]}</td><td class="t">${esc(i.title)}</td><td>${esc(i.result)}<br><span class="w">${esc(i.why)}</span></td></tr>`).join('')}</table>
  <h2>Problems found</h2>
  ${result.issues?.length ? `<ul>${result.issues.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="muted">No problems found.</p>'}
  <h2>Our suggestion</h2>
  <p class="tip">${esc(result.suggestion)}</p>
  <p class="foot">Prepared by ${esc(preparedBy)} with LeadScope AI</p>
  <script>window.onload = () => setTimeout(() => window.print(), 200)</script>
  </body></html>`
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  return true
}
