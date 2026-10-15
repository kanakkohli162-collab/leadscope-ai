import { Globe, MapPinned, Star } from 'lucide-react'

/**
 * "What do you sell?" — each service suggests business types that usually need it,
 * and decides which search results are a good fit for it.
 * `suggest` labels all exist in businessCategories.js (so the backend supports them).
 */
export const SELL_SERVICES = [
  {
    id: 'websites',
    label: 'Websites',
    short: 'websites',
    icon: Globe,
    suggest: ['Restaurants', 'Clinics', 'Salons', 'Coaching', 'Hotels', 'Furniture'],
    // No website = needs one most
    fitRank: (r) => (r.hasWebsite ? 0 : 2),
  },
  {
    id: 'listing',
    label: 'Google listing / social media',
    short: 'Google listing / social media',
    icon: MapPinned,
    suggest: ['Cafes', 'Bakeries', 'Gyms', 'Sweet shops', 'Car repair', 'Clothing'],
    // Missing phone and/or incomplete details (no opening hours)
    fitRank: (r) => (r.raw?.phone ? 0 : 1) + (r.serviceGaps.includes('Business profile incomplete') ? 1 : 0),
  },
  {
    id: 'reviews',
    label: 'Review management',
    short: 'review management',
    icon: Star,
    suggest: ['Restaurants', 'Hotels', 'Dentists', 'Hospitals', 'Spas', 'Cafes'],
    // Low rating, few reviews or negative sentiment (only when the data source has ratings)
    fitRank: (r) => {
      let rank = 0
      if (r.raw?.rating != null && r.raw.rating < 3.5) rank += 2
      if (r.raw?.reviewCount != null && r.raw.reviewCount < 20) rank += 1
      if (r.sentimentLabel === 'Negative') rank += 2
      return rank
    },
    needsReviewData: true,
  },
]

export const sellServiceById = (id) => SELL_SERVICES.find((s) => s.id === id) || null

/** True when the results carry rating / review data (Google, demo). OpenStreetMap has none. */
export const hasReviewData = (results) =>
  results.some((r) => r.raw?.rating != null || r.raw?.reviewCount != null || r.sentimentLabel)
