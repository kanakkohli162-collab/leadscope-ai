import { request } from './apiClient'

export const getLeads = () => request('/leads')
export const getLead = (id) => request(`/leads/${id}`)

export const searchLeads = (params) => {
  const q = new URLSearchParams()
  if (params.location) q.set('location', params.location)
  if (params.category) q.set('category', params.category)
  if (params.priority) q.set('priority', params.priority)
  if (params.hasWebsite !== undefined && params.hasWebsite !== '') q.set('hasWebsite', params.hasWebsite)
  return request(`/leads/search?${q.toString()}`)
}

export const updateLead = (id, data) =>
  request(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const createLead = (data) =>
  request('/leads', { method: 'POST', body: JSON.stringify(data) })

export const getDashboardStats = () => request('/leads/dashboard/stats')

export const generateOutreach = (id, service) =>
  request(`/leads/${id}/outreach`, { method: 'POST', body: JSON.stringify({ service }) })
