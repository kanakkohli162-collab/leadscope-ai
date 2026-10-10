import { request } from './apiClient'
import { storage, STORAGE_KEYS } from '@/utils/storage'

/**
 * These functions translate between the frontend and the Spring Boot AuthController.
 * The backend's paths, field names and response shape differ from what the pages expect,
 * so we convert here. The pages (LoginPage.jsx) don't need to change.
 */

/**
 * Backend returns AuthResponse → { token: "...", user: { id, name, email, agencyName } }
 * LoginPage expects            → { data: { token, id, name, email, ... } }
 */
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

/**
 * Backend signup is POST /api/auth/signup and returns the user WITHOUT a token.
 * So after a successful signup we log in with the same email + password to get one.
 */
export async function register({ name, email, password, company }) {
  await request('/auth/signup', {
    method: 'POST',
    // the form field is called "company" but the backend calls it "agencyName"
    body: JSON.stringify({ name, email, password, agencyName: company }),
  })
  return login(email, password)
}

// Not built on the backend yet; this will 404 until /api/auth/forgot-password exists
export const forgotPassword = (email) =>
  request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })

/** Session helpers: pages never touch localStorage directly. */
export const saveSession = (user) => {
  storage.set(STORAGE_KEYS.token, user.token)
  storage.set(STORAGE_KEYS.user, user)
}
export const clearSession = () => {
  storage.remove(STORAGE_KEYS.token)
  storage.remove(STORAGE_KEYS.user)
}
export const isAuthenticated = () => Boolean(storage.get(STORAGE_KEYS.token))