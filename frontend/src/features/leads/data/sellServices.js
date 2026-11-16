import { Globe, MapPinned, Star } from 'lucide-react'

export const SELL_SERVICES = [
  {
    id: 'websites',
    label: 'Websites',
    short: 'websites',
    icon: Globe,
    suggest: ['Restaurants', 'Clinics', 'Salons', 'Coaching', 'Hotels', 'Furniture'],
    fitRank: (r) => (r.hasWebsite ? 0 : 2),
  },
  {
    id: 'listing',
    label: 'Google listing / social media',
    short: 'Google listing / social media',
    icon: MapPinned,
    suggest: ['Cafes', 'Bakeries', 'Gyms', 'Sweet shops', 'Car repair', 'Clothing'],
    fitRank: (r) => (r.raw?.phone ? 0 : 1) + (r.serviceGaps.includes('Business profile incomplete') ? 1 : 0),
  },
  {
    id: 'reviews',
    label: 'Review management',
    short: 'review management',
    icon: Star,
    suggest: ['Restaurants', 'Hotels', 'Dentists', 'Hospitals', 'Spas', 'Cafes'],
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

export const hasReviewData = (results) =>
  results.some((r) => r.raw?.rating != null || r.raw?.reviewCount != null || r.sentimentLabel)
