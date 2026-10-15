/**
 * Single source of truth for the sidebar links AND the page titles in the Topbar.
 */
import {
  LayoutDashboard, Search, Users, BarChart3, MessageSquare, Settings,
} from 'lucide-react'

export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  leadDiscovery: '/lead-discovery',
  leadDetails: (id = ':id') => `/lead/${id}`,
  aiAnalysis: (id = ':id') => `/ai-analysis/${id}`,
  outreach: '/outreach',
  myLeads: '/my-leads',
  analytics: '/analytics',
  savedSearches: '/saved-searches',
  export: '/export',
  settings: '/settings',
}

// Only pages that use REAL data are shown in the menu
export const NAV_ITEMS = [
  { to: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.leadDiscovery, icon: Search, label: 'Find Leads' },
  { to: ROUTES.myLeads, icon: Users, label: 'My Leads' },
  { to: ROUTES.analytics, icon: BarChart3, label: 'Insights' },
  { to: ROUTES.outreach, icon: MessageSquare, label: 'Write Message' },
  { to: ROUTES.settings, icon: Settings, label: 'Settings' },
]

/** Title shown in the Topbar for the current path. Prefix match handles /lead/12 etc. */
const TITLE_PREFIXES = [
  ['/lead/', 'Lead Details'],
  ['/ai-analysis/', 'AI Lead Analysis'],
]

export function getPageTitle(pathname) {
  const exact = NAV_ITEMS.find((item) => item.to === pathname)
  if (exact) return exact.label
  const prefix = TITLE_PREFIXES.find(([p]) => pathname.startsWith(p))
  return prefix ? prefix[1] : 'LeadScope AI'
}