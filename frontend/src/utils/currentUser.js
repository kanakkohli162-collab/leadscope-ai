import { storage, STORAGE_KEYS } from './storage'

export function getCurrentUser() {
  return storage.get(STORAGE_KEYS.user) || {}
}

export function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
}