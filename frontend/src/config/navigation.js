/**
 * Single source of truth for the sidebar links AND the page titles in the Topbar.
 * Before, the same list was duplicated in Sidebar.jsx and Topbar.jsx — adding a
 * page meant editing two files. Now you add one entry here.
 */
import {
  LayoutDashboard, Search, Users, Brain, MessageSquare,
  BarChart3, Download, Bookmark, Settings,
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

export const NAV_ITEMS = [
  { to: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
  { to: ROUTES.leadDiscovery, icon: Search, label: 'Lead Discovery' },
  { to: ROUTES.myLeads, icon: Users, label: 'My Leads' },
  // `match` lets the link stay highlighted for every /ai-analysis/:id page
  { to: ROUTES.aiAnalysis(1), match: '/ai-analysis', icon: Brain, label: 'AI Analysis' },
  { to: ROUTES.outreach, icon: MessageSquare, label: 'Outreach Generator' },
  { to: ROUTES.analytics, icon: BarChart3, label: 'Analytics' },
  { to: ROUTES.savedSearches, icon: Bookmark, label: 'Saved Searches' },
  { to: ROUTES.export, icon: Download, label: 'Export Reports' },
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
