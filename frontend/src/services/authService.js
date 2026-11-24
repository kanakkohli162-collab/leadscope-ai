import { request } from './apiClient'
import { storage, STORAGE_KEYS } from '@/utils/storage'


function toSession(res) {
  return { data: { token: res.token, ...res.user } }
}

export async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return toSession(res)
}

export async function register({ name, email, password, company }) {
  await request('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, agencyName: company }),
  })
  return login(email, password)
}

// Password reset is not built yet, so fail with a clear message instead of calling a missing endpoint.
export const forgotPassword = async () => {
  throw new Error('Password reset is not available yet. Please contact your admin.')
}

export const saveSession = (user) => {
  storage.set(STORAGE_KEYS.token, user.token)
  storage.set(STORAGE_KEYS.user, user)
}
export const clearSession = () => {
  storage.remove(STORAGE_KEYS.token)
  storage.remove(STORAGE_KEYS.user)
}
export const isAuthenticated = () => Boolean(storage.get(STORAGE_KEYS.token))