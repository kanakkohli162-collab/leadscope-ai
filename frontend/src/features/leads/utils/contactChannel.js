export function bestChannel(lead) {
  const hasPhone = lead.phone && lead.phone !== '—'
  if (lead.whatsappUrl) return { channel: 'WhatsApp', reason: 'Their website has a WhatsApp chat link, so they expect messages there.' }
  if (hasPhone) return { channel: 'WhatsApp', reason: 'They list a phone number, and most local businesses reply fastest on WhatsApp.' }
  if (lead.emails?.length) return { channel: 'Email', reason: 'No phone found, but their website shows an email address.' }
  return { channel: 'Visit in person', reason: 'No phone, WhatsApp or email is shown online, so a short visit works best.' }
}

export function toWhatsAppNumber(phone) {
  if (!phone || phone === '—') return null
  const first = phone.split(/[;,/]/)[0]
  let digits = first.replace(/\D/g, '')
  if (first.trim().startsWith('+')) return digits.length >= 8 ? digits : null
  if (digits.startsWith('00')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = `91${digits.slice(1)}`
  else if (digits.length === 10) digits = `91${digits}`
  return digits.length >= 8 ? digits : null
}
