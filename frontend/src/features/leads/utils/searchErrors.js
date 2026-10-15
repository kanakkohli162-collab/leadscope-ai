/** Turns any search error into plain words (no technical text). */
export function friendlySearchError(err) {
  const msg = err?.message || ''
  if (err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(msg)) {
    return 'We could not reach the server. It may be waking up — please try again in a minute.'
  }
  if (/limit/i.test(msg)) return "Today's search limit is reached. Please try again in a minute, or tomorrow."
  if (/city not found|not responding|please enter/i.test(msg)) return msg   // already friendly (from our backend)
  if (/\(5\d\d\)/.test(msg)) return 'The server is starting up or busy. Please try again in a minute.'
  return 'Something went wrong with the search. Please try again.'
}
