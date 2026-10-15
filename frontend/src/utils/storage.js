/**
 * Safe wrappers around localStorage.
 * localStorage can THROW (private browsing, storage disabled, quota full).
 * Wrapping it once here means no page crashes because of it.
 */
export const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignore — UI preference just won't persist */
    }
  },
  remove(key) {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
  },
}

// Keys in one place so a typo can't create two different keys for the same thing
export const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  sidebarCollapsed: 'ui.sidebarCollapsed',
  recentSearches: 'leads.recentSearches',
  messageTemplates: 'outreach.templates',
  messageHistory: 'outreach.history',
  recentWebsiteChecks: 'websiteChecker.recent',
}
