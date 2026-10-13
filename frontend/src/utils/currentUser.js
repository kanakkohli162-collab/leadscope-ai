import { storage, STORAGE_KEYS } from './storage'

/** The logged-in user saved at login: { id, name, email, agencyName, token } */
export function getCurrentUser() {
  return storage.get(STORAGE_KEYS.user) || {}
}

/** "Kanak Kohli" -> "KK", for the round avatar */
export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}