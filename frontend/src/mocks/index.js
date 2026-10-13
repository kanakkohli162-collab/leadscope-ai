/**
 * Single entry point for all mock data.
 *
 * Pages import from '@/mocks' instead of reaching into individual files.
 * When the real backend is connected, you swap these imports for calls in
 * src/services/* and nothing else in the app needs to know.
 *
 * leads.json is GENERATED — don't edit it by hand.
 * Run `npm run mock:generate` (see scripts/generate-mock-leads.mjs).
 */
import leadsData from './data/leads.json'

// Object.freeze → accidental mutation (e.g. leads.sort()) throws in dev instead of silently
// reordering the shared array for every page.
export const leads = Object.freeze(leadsData)

/** Week-over-week changes are not derivable from a static list, so they stay hard-coded. */
export const weeklyChanges = {
  total: '+12% from last week',
  highPriority: '+16% from last week',
  needWebsite: '+32% from last week',
  poorReviews: '+10% from last week',
}

export const leadTrendData = [
  { name: 'Mon', leads: 12, contacted: 8 },
  { name: 'Tue', leads: 19, contacted: 14 },
  { name: 'Wed', leads: 15, contacted: 11 },
  { name: 'Thu', leads: 22, contacted: 18 },
  { name: 'Fri', leads: 28, contacted: 20 },
  { name: 'Sat', leads: 10, contacted: 6 },
  { name: 'Sun', leads: 8, contacted: 4 },
]

export const recentExports = [
  { id: 1, filename: 'leads_report_2024-09-20.xlsx', type: 'Excel', date: '20 Sep 2024' },
  { id: 2, filename: 'high_priority_leads.pdf', type: 'PDF', date: '18 Sep 2024' },
  { id: 3, filename: 'all_leads_report.xlsx', type: 'Excel', date: '15 Sep 2024' },
  { id: 4, filename: 'no_website_leads.pdf', type: 'PDF', date: '12 Sep 2024' },
]

export const savedSearches = [
  { id: 1, name: 'Gynecologist - Noida', location: 'Noida', category: 'Gynecologist', lastUsed: '20 Sep 2024' },
  { id: 2, name: 'Cardiologist - Delhi', location: 'Delhi', category: 'Cardiologist', lastUsed: '18 Sep 2024' },
  { id: 3, name: 'Dental Clinic - Gurgaon', location: 'Gurgaon', category: 'Dental Clinic', lastUsed: '15 Sep 2024' },
  { id: 4, name: 'Pharmacy - Noida', location: 'Noida', category: 'Pharmacy', lastUsed: '10 Sep 2024' },
]

export const chatSuggestions = [
  'Show high-priority gynecologists in Noida',
  "Which leads don't have websites?",
  'Give me the top 10 leads',
  'How many leads were contacted this week?',
]
