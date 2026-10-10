/**
 * The ONE place that talks to the backend over HTTP.
 * Every service file (authService, leadService) calls `request()`, so things
 * like the auth header, base URL and error handling are written once.
 */
import { API_BASE_URL } from '@/config/env'
import { storage, STORAGE_KEYS } from '@/utils/storage'

// Endpoints that work without a token. A 401 from these means "wrong password",
// not "your session expired", so they are treated differently below.
const PUBLIC_PATHS = ['/auth/login', '/auth/signup']

const NETWORK_MESSAGE = 'Cannot reach the server. Is the backend running on port 8080?'
export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'

// apiClient is plain JS (not a React component), so it can't navigate by itself.
// Instead it announces "session expired" and useSessionGuard (inside the router) reacts.
export const SESSION_EXPIRED_EVENT = 'auth:session-expired'

/**
 * An Error that also remembers the HTTP status (404, 401 ...), so callers can
 * decide what to show. `fromServer` = the text was written by the backend.
 */
export class ApiError extends Error {
  constructor(message, status, fromServer = false) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fromServer = fromServer
  }
}

export async function request(path, options = {}) {
  const isPublic = PUBLIC_PATHS.includes(path)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = storage.get(STORAGE_KEYS.token)
  if (token && !isPublic) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  } catch {
    // fetch only throws when no response arrived at all (server down, no internet)
    throw new ApiError(NETWORK_MESSAGE, 0)
  }

  // Some responses have no JSON body (e.g. DELETE, or an error from the dev proxy)
  const data = await res.json().catch(() => null)

  // When Spring Boot is not running, the Vite proxy answers with an empty 5xx
  if (data === null && res.status >= 500) {
    throw new ApiError(NETWORK_MESSAGE, res.status)
  }

  // Token missing, expired or invalid → forget the session and send the user to /login
  if (res.status === 401 && !isPublic) {
    storage.remove(STORAGE_KEYS.token)
    storage.remove(STORAGE_KEYS.user)
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401)
  }

  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, Boolean(data?.message))
  }
  return data ?? {}
}
