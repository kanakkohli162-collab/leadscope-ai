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

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.success === false) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

export const healthCheck = () => request('/health')
