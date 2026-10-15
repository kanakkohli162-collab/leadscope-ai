/**
 * Quick client-side check of a message before sending: personal, mentions a gap,
 * clear call to action, and length right for the channel. Each check: { ok, label, tip }.
 */

// Words that show a gap was mentioned (English, Hindi, Hinglish)
const GAP_WORDS = {
  website: ['website', 'site', 'वेबसाइट'],
  incomplete: ['profile', 'listing', 'google', 'phone', 'number', 'hours', 'details', 'timing', 'प्रोफाइल', 'लिस्टिंग'],
  rating: ['rating', 'review', 'रेटिंग', 'रिव्यू'],
  social: ['social', 'instagram', 'facebook', 'सोशल'],
}

function gapWords(gaps) {
  const words = new Set()
  gaps.forEach((g) => {
    const t = g.toLowerCase()
    if (t.includes('website')) GAP_WORDS.website.forEach((w) => words.add(w))
    if (t.includes('incomplete') || t.includes('profile')) GAP_WORDS.incomplete.forEach((w) => words.add(w))
    if (t.includes('rating') || t.includes('review')) GAP_WORDS.rating.forEach((w) => words.add(w))
    if (t.includes('social')) GAP_WORDS.social.forEach((w) => words.add(w))
  })
  return [...words]
}

const CTA = /\?|\bcall\b|\bvisit\b|\bmeet|\breply\b|\bchat\b|\bbaat\b|\bmil(?:te|enge|na)\b|कॉल|मिल|बात/i

export const wordCount = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0)

export function checkMessage({ body, subject, channel, lead }) {
  const text = `${subject || ''}\n${body || ''}`.toLowerCase()
  const name = (lead?.name || '').toLowerCase()
  const firstWord = name.split(/\s+/).find((w) => w.length > 3)
  const personal = Boolean(name) && (text.includes(name) || (firstWord && text.includes(firstWord)))

  const words = gapWords(lead?.serviceGaps || [])
  const mentionsGap = words.length === 0 ? true : words.some((w) => text.includes(w))

  const words_ = wordCount(body || '')
  const chars = (body || '').length
  let lengthOk
  let lengthTip
  if (channel === 'linkedin') {
    lengthOk = chars <= 300
    lengthTip = lengthOk ? `${chars} / 300 characters — fits a connection note.` : `${chars} characters — LinkedIn notes allow 300. Cut it down.`
  } else if (channel === 'whatsapp') {
    lengthOk = words_ <= 90
    lengthTip = lengthOk ? `${words_} words — easy to read on a phone.` : `${words_} words — keep WhatsApp messages under about 90 words.`
  } else {
    lengthOk = words_ >= 30 && words_ <= 180 && Boolean(subject?.trim())
    lengthTip = !subject?.trim() ? 'Add a short subject line.'
      : lengthOk ? `${words_} words with a subject — a good email length.`
        : words_ < 30 ? `${words_} words — add a little more detail.` : `${words_} words — shorten it to under about 180 words.`
  }

  return [
    { ok: personal, label: 'Personal', tip: personal ? 'Mentions the business name.' : `Use “${lead?.name || 'the business name'}” so it doesn’t feel like a mass message.` },
    {
      ok: mentionsGap,
      label: 'Mentions a gap',
      tip: words.length === 0 ? 'No gaps found for this lead.' : mentionsGap ? 'Points to a real problem you noticed.' : `Mention one gap, e.g. “${lead.serviceGaps[0]}”.`,
    },
    { ok: CTA.test(body || ''), label: 'Clear call to action', tip: CTA.test(body || '') ? 'Ends with a clear next step.' : 'End with a question, e.g. “Can we talk for 10 minutes this week?”' },
    { ok: lengthOk, label: 'Length fits the channel', tip: lengthTip },
  ]
}
