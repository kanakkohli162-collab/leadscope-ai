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

export const STORAGE_KEYS = {
  token: 'token',
  user: 'user',
  sidebarCollapsed: 'ui.sidebarCollapsed',
  recentSearches: 'leads.recentSearches',
  messageTemplates: 'outreach.templates',
  messageHistory: 'outreach.history',
  recentWebsiteChecks: 'websiteChecker.recent',
}
