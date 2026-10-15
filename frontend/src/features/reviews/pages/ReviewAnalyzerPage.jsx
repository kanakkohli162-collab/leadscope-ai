import { useState } from 'react'
import { MessageSquareText, Smile, Meh, Frown } from 'lucide-react'
import WhitePanel from '@/components/ui/WhitePanel'
import PageLoader from '@/components/ui/PageLoader'
import { useLeads } from '@/features/leads/hooks/useLeads'
import LeadPicker from '@/features/outreach/components/LeadPicker'
import ReviewSentimentCard from '@/features/leads/components/ReviewSentimentCard'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const MOOD = {
  Positive: { icon: Smile, cls: 'text-emerald-400' },
  Neutral: { icon: Meh, cls: 'text-amber-300' },
  Negative: { icon: Frown, cls: 'text-red-400' },
}

/**
 * Review Analyzer (Synopsis: review sentiment / NLP): pick a saved lead (the result is saved on it)
 * or just paste reviews. Uses the same sentiment API and result design as Lead Details.
 */
export default function ReviewAnalyzerPage() {
  const { leads, setLeads, loading } = useLeads()
  const [mode, setMode] = useState('lead')   // 'lead' | 'paste'
  const [leadId, setLeadId] = useState('')

  const lead = mode === 'lead' ? leads.find((l) => String(l.id) === String(leadId)) : null
  const mood = lead?.sentimentLabel ? MOOD[lead.sentimentLabel] : null

  // Keep the picked lead's saved sentiment up to date after an analysis
  function onResult(res) {
    if (!lead) return
    setLeads((all) => all.map((l) => (l.id === lead.id ? { ...l, sentimentLabel: res.overall, sentimentScore: res.score } : l)))
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 min-w-0 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquareText size={22} className="text-aqua" aria-hidden="true" /> Review Analyzer
        </h1>
        <p className="text-sm text-slate-500 mt-1">Find out how customers feel about a business from its reviews.</p>
      </div>

      <WhitePanel title="What do you want to analyse?">
        <div className="inline-flex rounded-full border border-line bg-inset p-0.5" role="group" aria-label="Analyse for">
          {[['lead', 'A saved lead'], ['paste', 'Just paste reviews']].map(([v, label]) => (
            <button key={v} type="button" aria-pressed={mode === v} onClick={() => setMode(v)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${FOCUS} ${mode === v ? 'bg-primary-600 text-white' : 'text-slate-600 hover:text-slate-800'}`}>
              {label}
            </button>
          ))}
        </div>

        {mode === 'lead' && (
          <div className="mt-4 max-w-md">
            {leads.length ? (
              <>
                <LeadPicker leads={leads} value={leadId} onChange={setLeadId} />
                {lead && (
                  <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                    Last result:{' '}
                    {mood ? (
                      <span className={`inline-flex items-center gap-1 font-semibold ${mood.cls}`}>
                        <mood.icon size={13} aria-hidden="true" /> {lead.sentimentLabel}
                        {lead.sentimentScore != null && ` (${lead.sentimentScore > 0 ? '+' : ''}${lead.sentimentScore})`}
                      </span>
                    ) : 'not analysed yet'}
                    {' · the new result will be saved on this lead.'}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">You have no saved leads yet. Choose “Just paste reviews”, or save some leads first.</p>
            )}
          </div>
        )}
      </WhitePanel>

      {(mode === 'paste' || lead) && (
        <ReviewSentimentCard key={lead ? lead.id : 'paste'} lead={lead || undefined} onResult={onResult} />
      )}
    </div>
  )
}
