import { storage, STORAGE_KEYS } from '@/utils/storage'

/**
 * The Website Checker checklist: each check with its state (good / bad / unknown),
 * a short label and a plain-English explanation of why it matters.
 */
export function checklist(r) {
  const opened = r.reachable
  const secs = (r.loadTimeMs / 1000).toFixed(1)
  return [
    {
      key: 'opens',
      title: 'Website opens',
      state: opened ? 'good' : 'bad',
      result: opened ? 'Opens without errors' : 'Does not open',
      why: 'If the website does not open, customers who search for the business find nothing.',
    },
    {
      key: 'https',
      title: 'Secure (HTTPS)',
      state: r.https ? 'good' : 'bad',
      result: r.https ? 'Has the padlock (HTTPS)' : 'No HTTPS',
      why: 'HTTPS is the padlock in the address bar. Without it, browsers show “Not secure” and Google ranks the site lower.',
    },
    {
      key: 'mobile',
      title: 'Mobile-friendly',
      state: !opened ? 'unknown' : r.mobileFriendly ? 'good' : 'bad',
      result: !opened ? 'Could not check' : r.mobileFriendly ? 'Fits phone screens' : 'Not set up for phones',
      why: 'Most customers search on their phones. A mobile-friendly site fits the screen without zooming in.',
    },
    {
      key: 'speed',
      title: 'Speed',
      state: !opened ? 'unknown' : r.loadTimeMs > 3000 ? 'bad' : 'good',
      result: !opened ? 'Could not check' : `${r.loadTimeMs > 3000 ? 'Slow' : 'Fast'} (${secs} s)`,
      why: 'Pages should load in under 3 seconds. Many visitors leave a slow site before it even appears.',
    },
    {
      key: 'fresh',
      title: 'Up to date',
      state: !opened || r.copyrightYear == null ? 'unknown' : r.outdated ? 'bad' : 'good',
      result: !opened ? 'Could not check' : r.copyrightYear == null ? 'No © year shown'
        : r.outdated ? `Outdated (© ${r.copyrightYear})` : `Up to date (© ${r.copyrightYear})`,
      why: 'The © year at the bottom of the page. A year 3+ years old makes the business look inactive.',
    },
    {
      key: 'meta',
      title: 'Page description',
      state: !opened ? 'unknown' : r.hasMetaDescription ? 'good' : 'bad',
      result: !opened ? 'Could not check' : r.hasMetaDescription ? 'Has a description for Google' : 'No description for Google',
      why: 'The short text Google shows under the link in search results. Without it, Google picks random text.',
    },
  ]
}

/**
 * Which of two sites is better on each check: 0 = first, 1 = second, null = same / can't tell.
 * Booleans: good beats bad; speed: faster wins; up to date: newer © year wins.
 */
export function betterPerCheck(a, b) {
  const ca = checklist(a)
  const cb = checklist(b)
  const rank = { good: 2, unknown: 1, bad: 0 }
  const out = {}
  ca.forEach((item, i) => {
    const other = cb[i]
    let winner = rank[item.state] === rank[other.state] ? null : rank[item.state] > rank[other.state] ? 0 : 1
    if (winner === null && item.key === 'speed' && a.reachable && b.reachable && a.loadTimeMs !== b.loadTimeMs) {
      winner = a.loadTimeMs < b.loadTimeMs ? 0 : 1
    }
    if (winner === null && item.key === 'fresh' && a.copyrightYear && b.copyrightYear && a.copyrightYear !== b.copyrightYear) {
      winner = a.copyrightYear > b.copyrightYear ? 0 : 1
    }
    out[item.key] = winner
  })
  out.score = a.score === b.score ? null : a.score > b.score ? 0 : 1
  return out
}

/** Red (0) → amber → green (100) */
export const scoreColor = (score) => `hsl(${Math.round(Math.max(0, Math.min(100, score)) * 1.25)}, 72%, 48%)`
export const scoreLabel = (score) => (score >= 75 ? 'Healthy' : score >= 50 ? 'Needs work' : 'Poor')

// ---- recent checks (this browser): last 10 ----

const MAX_RECENT = 10

export function loadRecent() {
  const list = storage.get(STORAGE_KEYS.recentWebsiteChecks, [])
  return Array.isArray(list) ? list : []
}

export function addRecent(url, score) {
  const list = [{ url, score, at: new Date().toISOString() }, ...loadRecent().filter((r) => r.url !== url)].slice(0, MAX_RECENT)
  storage.set(STORAGE_KEYS.recentWebsiteChecks, list)
  return list
}

export function clearRecent() {
  storage.remove(STORAGE_KEYS.recentWebsiteChecks)
  return []
}
