import { request } from './apiClient'
import { storage, STORAGE_KEYS } from '@/utils/storage'


function rememberUser(user) {
  const current = storage.get(STORAGE_KEYS.user) || {}
  const merged = { ...current, ...user }
  storage.set(STORAGE_KEYS.user, merged)
  return merged
}

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

export const updatePreferences = async (prefs) =>
  rememberUser(await request('/account/preferences', { method: 'PUT', body: JSON.stringify(prefs) }))

export const deleteAccount = () =>
  request('/account', { method: 'DELETE', body: JSON.stringify({ confirm: 'DELETE' }) })

export const isStrongPassword = (p) => p.length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p)
