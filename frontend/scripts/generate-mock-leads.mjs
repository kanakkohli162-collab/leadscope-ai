/**
 * Mock lead generator
 * -------------------
 * WHY THIS FILE EXISTS
 *   The UI needs realistic-looking data before the Spring Boot backend is ready.
 *   Instead of hand-writing 50 objects, we generate them with Faker
 *   (https://fakerjs.dev — an open-source fake-data library).
 *
 * WHY A SCRIPT INSTEAD OF CALLING FAKER IN THE BROWSER
 *   Faker is ~2 MB. If we imported it inside a React component, every user
 *   would download it. Running it once at dev time and saving plain JSON
 *   keeps the production bundle small — this is a performance decision.
 *
 * WHY A FIXED SEED
 *   faker.seed(2026) makes the "random" output identical on every run, so
 *   lead #17 is always the same business. Screenshots, demos and bug reports
 *   stay consistent.
 *
 * HOW TO RUN
 *   npm run mock:generate      → rewrites src/mocks/data/leads.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fakerEN_IN as faker } from '@faker-js/faker' // Indian locale → Indian names & numbers

const TOTAL_LEADS = 50
const __dirname = dirname(fileURLToPath(import.meta.url))
const SEED_FILE = resolve(__dirname, 'seed-leads.json') // the 6 original hand-written leads
const OUT_FILE = resolve(__dirname, '../src/mocks/data/leads.json')

faker.seed(2026)

// ---------- Lookup tables (the "vocabulary" the generator picks from) ----------

const CITIES = {
  Noida: ['Sector 18', 'Sector 62', 'Sector 50', 'Sector 76', 'Sector 137'],
  Delhi: ['Connaught Place', 'Lajpat Nagar', 'Rohini Sector 9', 'Dwarka Sector 12', 'Saket'],
  Gurgaon: ['Sector 45', 'DLF Phase 3', 'Sohna Road', 'Golf Course Road', 'Sector 56'],
  Lucknow: ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Alambagh'],
  Chandigarh: ['Sector 17', 'Sector 22', 'Sector 35', 'Manimajra'],
  Ghaziabad: ['Indirapuram', 'Raj Nagar Extension', 'Vaishali'],
}
const STATES = {
  Noida: 'Uttar Pradesh', Delhi: 'Delhi', Gurgaon: 'Haryana',
  Lucknow: 'Uttar Pradesh', Chandigarh: 'Chandigarh', Ghaziabad: 'Uttar Pradesh',
}

// Category → possible name endings, so names look believable ("Sharma Dental Care")
const CATEGORIES = {
  Gynecologist: ["Women's Clinic", 'Maternity Centre', 'Mother & Child Clinic', 'Fertility Centre'],
  Cardiologist: ['Heart Clinic', 'Cardiac Centre', 'Heart Care Institute'],
  'Dental Clinic': ['Dental Care', 'Dental Studio', 'Smile Dental Clinic', 'Orthodontics'],
  Hospital: ['Hospital', 'Multispeciality Hospital', 'Medical Centre', 'Healthcare'],
  Pharmacy: ['Pharmacy', 'Medicos', 'Chemists', 'Health Mart'],
  'Diagnostic Lab': ['Diagnostics', 'Pathology Lab', 'Imaging Centre', 'Path Labs'],
}
const NAME_PREFIXES = [
  'Sunrise', 'Lotus', 'Lifeline', 'Care Plus', 'Nova', 'Shree', 'Aarogya',
  'City', 'Green Leaf', 'Prime', 'Medilink', 'Sanjeevani', 'Healing Touch', 'Blue Cross',
]
const HOURS = [
  'Mon - Sat: 9:00 AM - 7:00 PM', 'Mon - Sun: 8:00 AM - 10:00 PM',
  'Mon - Fri: 9:00 AM - 5:00 PM', 'Mon - Sat: 10:00 AM - 8:00 PM', 'Open 24 hours',
]
// Re-use the image URLs that already existed in the project
const IMAGES = [
  'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=400&h=300&fit=crop',
]
// weight = how common each status is (lots of New leads, few Converted)
const STATUSES = [
  { value: 'New', weight: 35 }, { value: 'Contacted', weight: 20 },
  { value: 'Follow-up', weight: 15 }, { value: 'Interested', weight: 12 },
  { value: 'Converted', weight: 8 }, { value: 'Not Interested', weight: 10 },
]

// ---------- Helpers ----------

const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '')
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

/** Priority is derived from score so the two never contradict each other. */
const priorityFromScore = (score) => (score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low')

/** "2 hrs ago" → 0 days, "3 days ago" → 3. Used by the chatbot ("contacted this week"). */
function daysFromLabel(label) {
  const m = /(\d+)\s*day/.exec(label)
  return m ? Number(m[1]) : 0
}

function lastContactedLabel() {
  const days = faker.number.int({ min: 0, max: 14 })
  if (days === 0) {
    const hrs = faker.number.int({ min: 1, max: 12 })
    return `${hrs} hr${hrs > 1 ? 's' : ''} ago`
  }
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function businessName(category) {
  const ending = faker.helpers.arrayElement(CATEGORIES[category])
  // Half the names use an Indian surname ("Verma Heart Clinic"), half a brand-like prefix
  const start = faker.datatype.boolean()
    ? faker.person.lastName()
    : faker.helpers.arrayElement(NAME_PREFIXES)
  return `${start} ${ending}`
}

/**
 * The "AI" signals. We generate the raw facts first (website? listing? rating?)
 * and then derive score, gaps and recommendations FROM those facts, so every
 * lead tells a consistent story.
 */
function buildLead(id) {
  const category = faker.helpers.arrayElement(Object.keys(CATEGORIES))
  const location = faker.helpers.arrayElement(Object.keys(CITIES))
  const name = businessName(category)

  const hasWebsite = faker.datatype.boolean({ probability: 0.55 })
  const websiteAnalysis = hasWebsite
    ? faker.helpers.arrayElement(['Optimized', 'Not Optimized', 'Outdated', 'Basic'])
    : 'No Website'
  const listingCompleteness = faker.helpers.arrayElement(['Complete', 'Partial', 'Incomplete'])
  const rating = faker.number.float({ min: 3.2, max: 4.9, fractionDigits: 1 })
  const reviews = faker.number.int({ min: 15, max: 650 })

  const reviewSentiment =
    rating >= 4.2 ? `Positive (${faker.number.int({ min: 70, max: 92 })}%)`
      : rating >= 3.8 ? 'Neutral'
        : 'Mixed'

  // Service gaps come straight from the signals above
  const serviceGaps = []
  if (!hasWebsite) serviceGaps.push('No website')
  if (websiteAnalysis === 'Not Optimized') serviceGaps.push('Website not optimized')
  if (websiteAnalysis === 'Outdated') serviceGaps.push('Website outdated')
  if (listingCompleteness !== 'Complete') serviceGaps.push('Google listing incomplete')
  if (rating < 3.9) serviceGaps.push('Low ratings / mixed reviews')
  if (faker.datatype.boolean({ probability: 0.4 })) serviceGaps.push('No online appointment system')
  if (reviews < 60) serviceGaps.push('Low review count')
  if (serviceGaps.length === 0) serviceGaps.push('Low social media engagement')

  // Lead score: higher = bigger opportunity for a digital-services agency
  let score = 26
  if (!hasWebsite) score += 25
  else if (websiteAnalysis === 'Not Optimized' || websiteAnalysis === 'Outdated') score += 15
  else if (websiteAnalysis === 'Basic') score += 8
  if (listingCompleteness === 'Incomplete') score += 10
  else if (listingCompleteness === 'Partial') score += 5
  if (rating >= 4.2) score += 10 // happy customers + weak digital presence = easy win
  score += Math.min(10, Math.round(reviews / 60))
  score += faker.number.int({ min: -14, max: 14 })
  score = clamp(score, 25, 98)

  const recommendations = []
  if (!hasWebsite) recommendations.push('website development')
  else if (websiteAnalysis !== 'Optimized') recommendations.push('website redesign')
  recommendations.push('SEO')
  if (listingCompleteness !== 'Complete') recommendations.push('Google Business optimization')
  if (rating < 3.9) recommendations.push('Review management')

  const reasonParts = []
  reasonParts.push(rating >= 4.2
    ? `${name} has a strong reputation (${rating}★ from ${reviews} reviews)`
    : `${name} has an average reputation (${rating}★ from ${reviews} reviews)`)
  reasonParts.push(hasWebsite
    ? `but its website is ${websiteAnalysis.toLowerCase()}`
    : 'but no website at all')
  reasonParts.push(`and ${listingCompleteness === 'Incomplete' ? 'an' : 'a'} ${listingCompleteness.toLowerCase()} Google listing.`)

  const status = faker.helpers.weightedArrayElement(STATUSES)
  const lastContacted = lastContactedLabel()
  const area = faker.helpers.arrayElement(CITIES[location])

  return {
    id,
    name,
    category,
    location,
    address: `${faker.number.int({ min: 1, max: 250 })}, ${area}, ${location}, ${STATES[location]}`,
    phone: `+91 ${faker.helpers.arrayElement(['9', '8', '7'])}${faker.string.numeric(4)} ${faker.string.numeric(5)}`,
    website: hasWebsite ? `www.${slugify(name)}.${faker.helpers.arrayElement(['in', 'com', 'co.in'])}` : null,
    hasWebsite,
    rating,
    reviews,
    score,
    priority: priorityFromScore(score),
    status,
    lastContacted,
    lastContactedDays: daysFromLabel(lastContacted),
    image: faker.helpers.arrayElement(IMAGES),
    hours: faker.helpers.arrayElement(HOURS),
    serviceGaps,
    websiteAnalysis,
    listingCompleteness,
    reviewSentiment,
    serviceGapDetected: serviceGaps.length >= 2,
    aiReason: `${reasonParts.join(' ')} ${score >= 75
      ? 'This is a high-conversion opportunity for digital services.'
      : score >= 50
        ? 'There is a clear opportunity to improve its online visibility.'
        : 'Lower priority, but worth nurturing for future outreach.'}`,
    recommendedAction: `Offer ${recommendations.join(' + ')}`,
  }
}

// ---------- Main ----------

const seeds = JSON.parse(readFileSync(SEED_FILE, 'utf8')).map((lead) => ({
  ...lead,
  lastContactedDays: daysFromLabel(lead.lastContacted),
}))

const generated = Array.from(
  { length: TOTAL_LEADS - seeds.length },
  (_, i) => buildLead(seeds.length + i + 1), // ids continue after the seeds: 7, 8, 9 ...
)

const leads = [...seeds, ...generated]
mkdirSync(dirname(OUT_FILE), { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify(leads, null, 2) + '\n')
console.log(`✔ Wrote ${leads.length} leads to ${OUT_FILE}`)
