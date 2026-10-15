/**
 * Single source of truth for the sidebar links AND the page titles in the Topbar.
 */
import {
  LayoutDashboard, Search, Users, KanbanSquare, MapPinned, BarChart3, MessageSquare, Globe, Settings,
  Bot, MessageSquareText, Download,
} from 'lucide-react'

export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  leadDiscovery: '/lead-discovery',
  leadDetails: (id = ':id') => `/lead/${id}`,
  aiAnalysis: (id = ':id') => `/ai-analysis/${id}`,
  outreach: '/outreach',
  websiteChecker: '/website-checker',
  myLeads: '/my-leads',
  pipeline: '/pipeline',
  opportunityMap: '/opportunity-map',
  analytics: '/analytics',
  savedSearches: '/saved-searches',
  export: '/export',
  chatbot: '/chatbot',
  reviewAnalyzer: '/review-analyzer',
  settings: '/settings',
}

// Sidebar sections (small labels, hidden when the sidebar is collapsed). Only pages with REAL data.
export const NAV_GROUPS = [
  { label: 'Main', items: [
    { to: ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    { to: ROUTES.leadDiscovery, icon: Search, label: 'Find Leads' },
    { to: ROUTES.myLeads, icon: Users, label: 'My Leads' },
    { to: ROUTES.pipeline, icon: KanbanSquare, label: 'Pipeline' },
  ] },
  { label: 'Analyze', items: [
    { to: ROUTES.analytics, icon: BarChart3, label: 'Insights' },
    { to: ROUTES.opportunityMap, icon: MapPinned, label: 'Opportunity Map' },
    { to: ROUTES.websiteChecker, icon: Globe, label: 'Website Checker' },
    { to: ROUTES.reviewAnalyzer, icon: MessageSquareText, label: 'Review Analyzer' },
  ] },
  { label: 'Outreach', items: [
    { to: ROUTES.outreach, icon: MessageSquare, label: 'Write Message' },
    { to: ROUTES.chatbot, icon: Bot, label: 'Ask AI' },
  ] },
  { label: 'Tools', items: [
    { to: ROUTES.export, icon: Download, label: 'Reports & Export' },
  ] },
  { label: 'Account', items: [
    { to: ROUTES.settings, icon: Settings, label: 'Settings' },
  ] },
]

// All sidebar links in one list (used for the Topbar page title)
export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items)

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