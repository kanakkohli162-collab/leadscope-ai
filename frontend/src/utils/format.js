/** "Asha Verma" → "AV", "Kanak" → "K". Used for the round avatar. */
export function getInitials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

/** "Asha Verma" → "Asha". Used for greetings. */
export function getFirstName(name) {
  return (name || '').trim().split(/\s+/)[0] || 'there'
}
