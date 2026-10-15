import { storage, STORAGE_KEYS } from '@/utils/storage'

/**
 * Saved message templates and per-lead message history, kept in this browser (localStorage).
 * storage.get / set already catch errors (private mode, storage full), so the page never breaks.
 */

const MAX_TEMPLATES = 20
const MAX_HISTORY = 5
export const BUSINESS_PLACEHOLDER = '{business}'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ---- templates: [{ id, name, channel, subject, body }] with {business} in place of the business name ----

export function loadTemplates() {
  const list = storage.get(STORAGE_KEYS.messageTemplates, [])
  return Array.isArray(list) ? list : []
}

export function saveTemplate({ name, channel, subject, body, businessName }) {
  const swap = (text) => (businessName ? (text || '').replace(new RegExp(escapeRegex(businessName), 'gi'), BUSINESS_PLACEHOLDER) : text || '')
  const template = { id: Date.now(), name: name.trim().slice(0, 60), channel, subject: swap(subject), body: swap(body) }
  const list = [template, ...loadTemplates()].slice(0, MAX_TEMPLATES)
  storage.set(STORAGE_KEYS.messageTemplates, list)
  return list
}

export function deleteTemplate(id) {
  const list = loadTemplates().filter((t) => t.id !== id)
  storage.set(STORAGE_KEYS.messageTemplates, list)
  return list
}

/** Template text with {business} filled in. */
export const fillTemplate = (text, businessName) => (text || '').split(BUSINESS_PLACEHOLDER).join(businessName || '')

// ---- history: { [leadId]: [{ at, channel, subject, body }] }, last 5 per lead ----

export function loadHistory(leadId) {
  const all = storage.get(STORAGE_KEYS.messageHistory, {})
  const list = all && typeof all === 'object' ? all[leadId] : null
  return Array.isArray(list) ? list : []
}

export function addToHistory(leadId, entry) {
  const all = storage.get(STORAGE_KEYS.messageHistory, {}) || {}
  const previous = Array.isArray(all[leadId]) ? all[leadId] : []
  const same = (e) => e.body === entry.body && e.subject === entry.subject
  const list = [{ ...entry, at: new Date().toISOString() }, ...previous.filter((e) => !same(e))].slice(0, MAX_HISTORY)
  storage.set(STORAGE_KEYS.messageHistory, { ...all, [leadId]: list })
  return list
}
