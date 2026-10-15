import {
  UtensilsCrossed, Coffee, Croissant, Candy, Stethoscope, Smile, Hospital, Pill, Scissors, Flower2,
  Dumbbell, HeartPulse, School, GraduationCap, BookOpen, Shirt, Tv, Sofa, ShoppingCart, Hotel, Wrench,
  Building2, Plane,
} from 'lucide-react'

/**
 * Business types for the Find Leads chips. Every `label` is matched by the backend
 * (GeoapifyService.CATEGORY_MAP) to a real OpenStreetMap category, so only supported types are listed.
 */
export const CATEGORY_GROUPS = [
  { group: 'Food', items: [
    { label: 'Restaurants', icon: UtensilsCrossed },
    { label: 'Cafes', icon: Coffee },
    { label: 'Bakeries', icon: Croissant },
    { label: 'Sweet shops', icon: Candy },
  ] },
  { group: 'Health', items: [
    { label: 'Clinics', icon: Stethoscope },
    { label: 'Dentists', icon: Smile },
    { label: 'Hospitals', icon: Hospital },
    { label: 'Pharmacies', icon: Pill },
  ] },
  { group: 'Beauty & fitness', items: [
    { label: 'Salons', icon: Scissors },
    { label: 'Spas', icon: Flower2 },
    { label: 'Gyms', icon: Dumbbell },
    { label: 'Yoga', icon: HeartPulse },
  ] },
  { group: 'Education', items: [
    { label: 'Schools', icon: School },
    { label: 'Coaching', icon: BookOpen },
    { label: 'Colleges', icon: GraduationCap },
  ] },
  { group: 'Shops', items: [
    { label: 'Clothing', icon: Shirt },
    { label: 'Electronics', icon: Tv },
    { label: 'Furniture', icon: Sofa },
    { label: 'Supermarkets', icon: ShoppingCart },
  ] },
  { group: 'Services', items: [
    { label: 'Hotels', icon: Hotel },
    { label: 'Car repair', icon: Wrench },
    { label: 'Real estate', icon: Building2 },
    { label: 'Travel agents', icon: Plane },
  ] },
]

const ALL = CATEGORY_GROUPS.flatMap((g) => g.items)

export const POPULAR_CATEGORIES = ['Restaurants', 'Cafes', 'Dentists', 'Clinics', 'Salons', 'Gyms', 'Coaching', 'Hotels']
  .map((label) => ALL.find((c) => c.label === label))
