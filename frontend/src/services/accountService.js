import { request } from './apiClient'
import { storage, STORAGE_KEYS } from '@/utils/storage'

/**
 * Settings page ↔ Spring Boot AccountController (/api/account). Only ever the logged-in user's own account.
 */

/** Keeps the saved session user (sidebar name, defaults) in step with the backend. The token is kept. */
function rememberUser(user) {
  const current = storage.get(STORAGE_KEYS.user) || {}
  const merged = { ...current, ...user }
  storage.set(STORAGE_KEYS.user, merged)
  return merged
}

/** -> { user, agency: { servicesOffered[], senderName, senderPhone, senderWebsite, signature }, serviceOptions[],
 *      lastLoginAt, currentLoginAt, memberSince, usage: { month, searches, aiMessages, websiteChecks, leadsSaved, totalLeads } } */
export async function getAccount() {
  const res = await request('/account')
  rememberUser(res.user)
  return res
}

export const updateProfile = async (name, agencyName) =>
  rememberUser(await request('/account/profile', { method: 'PUT', body: JSON.stringify({ name, agencyName }) }))

export const changePassword = (currentPassword, newPassword) =>
  request('/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) })

export const updateAgency = (agency) =>
  request('/account/agency', { method: 'PUT', body: JSON.stringify(agency) })

/** { defaultCity, defaultBusinessType, defaultTone, defaultLanguage, defaultChannel } */
export const updatePreferences = async (prefs) =>
  rememberUser(await request('/account/preferences', { method: 'PUT', body: JSON.stringify(prefs) }))

export const deleteAccount = () =>
  request('/account', { method: 'DELETE', body: JSON.stringify({ confirm: 'DELETE' }) })

/** Same rule as the backend: 8+ characters with a letter and a number. */
export const isStrongPassword = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)
