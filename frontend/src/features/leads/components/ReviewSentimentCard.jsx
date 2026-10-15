import { useState } from 'react'
import { MessageSquareText, Loader2, ExternalLink, Smile, Meh, Frown } from 'lucide-react'
import { analyzeSentiment } from '@/services/leadService'

// Colour + icon for each result
const STYLE = {
  Positive: { icon: Smile, text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  Neutral: { icon: Meh, text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  Negative: { icon: Frown, text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
}

export default function ReviewSentimentCard({ lead }) {
  const [reviews, setReviews] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Opens this business on Google Maps so the user can copy real reviews
  const mapsUrl = lead
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.location || ''}`)}`
    : null

  async function handleAnalyze() {
    if (!reviews.trim()) {
      setError('Paste at least one review first.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      setResult(await analyzeSentiment(reviews))
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const s = result ? STYLE[result.overall] || STYLE.Neutral : null
  const pct = (n) => (result?.total ? Math.round((n * 100) / result.total) : 0)

  return (
    <div className="bg-card rounded-xl border border-slate-200 p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquareText size={18} className="text-aqua" />
            Review Sentiment (AI / NLP)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Copy 5–10 customer reviews from Google Maps and paste them below, one per line.
          </p>
        </div>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium text-primary-600 hover:text-aqua flex items-center gap-1"
          >
            Open on Google Maps <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* Input */}
      <textarea
        rows={5}
        value={reviews}
        onChange={(e) => setReviews(e.target.value)}
        placeholder="Paste reviews here, one per line…"
        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-medium px-4 py-2.5 rounded-md transition-colors"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Analysing…' : 'Analyse Sentiment'}
        </button>
        {reviews && !loading && (
          <button
            onClick={() => { setReviews(''); setResult(null); setError('') }}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Result */}
      {result && s && (
        <div className={`rounded-xl border ${s.border} ${s.bg} p-4 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className={`flex items-center gap-2 text-lg font-bold ${s.text}`}>
              <s.icon size={24} />
              {result.overall}
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${s.text}`}>
                {result.score > 0 ? '+' : ''}{result.score}
              </p>
              <p className="text-xs text-slate-500">Sentiment score (−100 to +100)</p>
            </div>
          </div>

          {/* Positive / Neutral / Negative bar */}
          <div>
            <div className="flex h-3 rounded-full overflow-hidden bg-inset">
              <div className="bg-emerald-500" style={{ width: `${pct(result.positive)}%` }} />
              <div className="bg-amber-400" style={{ width: `${pct(result.neutral)}%` }} />
              <div className="bg-red-500" style={{ width: `${pct(result.negative)}%` }} />
            </div>
            <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-600">
              <span>🟢 Positive: {result.positive}</span>
              <span>🟡 Neutral: {result.neutral}</span>
              <span>🔴 Negative: {result.negative}</span>
              <span className="text-slate-400">({result.total} reviews)</span>
            </div>
          </div>

          {result.summary && <p className="text-sm text-slate-700">{result.summary}</p>}

          {result.concerns?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Main customer concerns</p>
              <div className="flex flex-wrap gap-2">
                {result.concerns.map((c) => (
                  <span key={c} className="text-xs bg-inset border border-line text-slate-700 px-2.5 py-1 rounded-full">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-500">
            Formula: Sentiment Score = (Positive − Negative) ÷ Total × 100. Above +20 = Positive, below −20 = Negative.
          </p>
        </div>
      )}
    </div>
  )
}