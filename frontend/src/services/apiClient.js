/**
 * The ONE place that talks to the backend over HTTP.
 * Every service file (authService, leadService) calls `request()`, so things
 * like the auth header, base URL and error handling are written once.
 */
import { API_BASE_URL } from '@/config/env'
import { storage, STORAGE_KEYS } from '@/utils/storage'

export async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = storage.get(STORAGE_KEYS.token)
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  // Some error responses (e.g. 502 from a proxy) are not JSON — don't crash on them
  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

export const healthCheck = () => request('/health')
