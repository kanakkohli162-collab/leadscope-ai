import { ApiError, request } from './apiClient'
import { storage, STORAGE_KEYS } from '@/utils/storage'

/**
 * These functions translate between the frontend and the Spring Boot AuthController.
 * The backend's paths, field names and response shape differ from what the pages expect,
 * so we convert here. The pages (LoginPage.jsx) don't need to change.
 */

// Used only when the backend sent a status code but no message of its own
const AUTH_ERROR_MESSAGES = {
  400: 'Please enter a valid email and a password of at least 6 characters.',
  401: 'Incorrect password. Please try again.',
  404: 'No account found with this email. Please sign up first.',
  409: 'An account with this email already exists. Please sign in instead.',
}

function toFriendlyError(err) {
  const fallback = AUTH_ERROR_MESSAGES[err.status]
  if (err instanceof ApiError && !err.fromServer && fallback) {
    return new ApiError(fallback, err.status)
  }
  return err // the backend's own message (or the network message) is already friendly
}

/**
 * Backend returns AuthResponse → { token: "...", user: { id, name, email, agencyName } }
 * LoginPage expects            → { data: { token, id, name, email, ... } }
 */
function toSession(res) {
  return { data: { token: res.token, ...res.user } }
}

export async function login(email, password) {
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return toSession(res)
  } catch (err) {
    throw toFriendlyError(err)
  }
}

/**
 * Backend signup is POST /api/auth/signup and returns the user WITHOUT a token.
 * We do NOT log in automatically: the login page asks the user to sign in.
 */
export async function register({ name, email, password, company }) {
  try {
    return await request('/auth/signup', {
      method: 'POST',
      // the form field is called "company" but the backend calls it "agencyName"
      body: JSON.stringify({ name, email, password, agencyName: company }),
    })
  } catch (err) {
    throw toFriendlyError(err)
  }
}

// The backend has no password-reset endpoint yet, so say so instead of calling it
export async function forgotPassword() {
  throw new Error('Password reset is not available yet.')
}

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

/** The logged-in user saved at login: { id, name, email, agencyName }. Never null. */
export const getCurrentUser = () => storage.get(STORAGE_KEYS.user) || {}

/**
 * GET /api/auth/me → asks the backend "who does this token belong to?".
 * Doubles as a token check: an expired token makes apiClient end the session.
 */
export async function fetchCurrentUser() {
  const user = await request('/auth/me')
  storage.set(STORAGE_KEYS.user, { ...getCurrentUser(), ...user })
  return user
}
