import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Copy, Check, Download, RefreshCw, Mail, MessageCircle, Linkedin, Sparkles, ListOrdered, Loader2, BookmarkPlus,
  History, Trash2, CheckCircle2, AlertTriangle, Info, FastForward, FileText,
} from 'lucide-react'
import ScoreCircle from '@/components/ui/ScoreCircle'
import PageLoader from '@/components/ui/PageLoader'
import { useToast } from '@/hooks/useToast'
import { useTypewriter } from '@/hooks/useTypewriter'
import { generateMessage, generateSequence } from '@/services/leadService'
import { useLeads } from '@/features/leads/hooks/useLeads'
import { toWhatsAppNumber } from '@/features/leads/utils/contactChannel'
import LeadPicker from '../components/LeadPicker'
import { checkMessage } from '../utils/messageQuality'
import { loadTemplates, saveTemplate, deleteTemplate, fillTemplate, loadHistory, addToHistory } from '../utils/messageStore'

const SERVICES = [
  'Website Development + SEO',
  'Google Business Profile Optimization',
  'Social Media Marketing',
  'Online Booking System',
  'Review Management',
]
const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
]
const TONES = ['Friendly', 'Professional', 'Short']
const LANGUAGES = ['English', 'Hindi', 'Hinglish']

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const BTN = `inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-line text-sm text-slate-700 hover:bg-inset disabled:opacity-50 ${FOCUS}`
const chip = (active) => `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${FOCUS} ${
  active ? 'bg-primary-600 text-white' : 'bg-inset border border-line text-slate-600 hover:bg-line'
}`

/** Plain-words error for a failed request (the backend already falls back to templates when the AI is busy). */
function friendlyError(err) {
  const msg = err?.message || ''
  if (err instanceof TypeError || /failed to fetch|networkerror/i.test(msg)) return 'We could not reach the server. It may be waking up — please try again in a minute.'
  if (/limit|429/i.test(msg)) return 'The AI limit is reached for now. Please try again in a minute.'
  return 'The AI is busy right now. Please try again in a minute.'
}

const asText = (m) => (m.subject ? `Subject: ${m.subject}\n\n${m.body}` : m.body)

function ChipGroup({ label, options, value, onChange }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((o) => {
          const id = o.id || o
          const Icon = o.icon
          return (
            <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)} className={chip(value === id)}>
              {Icon && <Icon size={14} aria-hidden="true" />} {o.label || o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function OutreachGeneratorPage() {
  const { leads, loading } = useLeads()
  const toast = useToast()
  const [params] = useSearchParams()
  const [leadId, setLeadId] = useState('')
  const [service, setService] = useState(SERVICES[0])
  const [channel, setChannel] = useState('whatsapp')
  const [tone, setTone] = useState('Friendly')
  const [language, setLanguage] = useState('English')
  const [twoVersions, setTwoVersions] = useState(false)

  const [result, setResult] = useState(null)      // { source, note, messages, used }
  const [picked, setPicked] = useState(0)
  const [draft, setDraft] = useState(null)        // { subject, body } being edited
  const [runKey, setRunKey] = useState(0)         // new value = type the message out again
  const [writing, setWriting] = useState(false)
  const [error, setError] = useState('')
  const [sequence, setSequence] = useState(null)  // { source, note, steps }
  const [seqLoading, setSeqLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [templates, setTemplates] = useState(loadTemplates)
  const [history, setHistory] = useState([])

  // Pre-select the lead from ?leadId=… (when coming from Lead Details / Find Leads), else the top-scored lead
  useEffect(() => {
    if (!leadId && leads.length) {
      const best = [...leads].sort((a, b) => b.score - a.score)[0]
      setLeadId(params.get('leadId') || String(best.id))
    }
  }, [leads, leadId, params])

  const lead = leads.find((l) => String(l.id) === String(leadId))
  useEffect(() => { if (lead) setHistory(loadHistory(lead.id)) }, [lead])

  const typed = useTypewriter(draft?.body || '', runKey)
  const quality = useMemo(() => (draft ? checkMessage({ ...draft, channel, lead }) : []), [draft, channel, lead])
  const options = { service, channel, tone, language }
  const whatsapp = toWhatsAppNumber(lead?.phone)

  function reset() {
    setResult(null)
    setDraft(null)
    setSequence(null)
    setError('')
  }

  async function write() {
    if (!lead) return
    setWriting(true)
    setError('')
    try {
      const res = await generateMessage(lead.id, { ...options, versions: twoVersions ? 2 : 1 })
      const messages = res.messages?.length ? res.messages : [{ subject: '', body: res.message }]
      setResult({ ...res, messages })
      setPicked(0)
      setDraft(messages[0])
      setRunKey((k) => k + 1)
      setHistory(addToHistory(lead.id, { channel, ...messages[0] }))
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setWriting(false)
    }
  }

  async function writeSequence() {
    if (!lead) return
    setSeqLoading(true)
    setError('')
    try {
      setSequence(await generateSequence(lead.id, options))
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setSeqLoading(false)
    }
  }

  function pickVersion(i) {
    setPicked(i)
    setDraft(result.messages[i])
    setHistory(addToHistory(lead.id, { channel, ...result.messages[i] }))
  }

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      toast.error('Could not copy. Please select the text and copy it yourself.')
    }
  }

  function download() {
    const blob = new Blob([asText(draft)], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${lead.name.replace(/\s+/g, '_')}_${channel}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  function saveAsTemplate() {
    const name = window.prompt('Name this template', `${channel} – ${service}`)
    if (!name?.trim()) return
    setTemplates(saveTemplate({ name, channel, subject: draft.subject, body: draft.body, businessName: lead.name }))
    toast.success('Template saved. The business name is filled in when you insert it.')
  }

  function insertTemplate(t) {
    setChannel(t.channel)
    setResult(null)
    setDraft({ subject: fillTemplate(t.subject, lead.name), body: fillTemplate(t.body, lead.name) })
  }

  if (loading) return <PageLoader />

  if (!leads.length) {
    return (
      <div className="bg-card rounded-xl border border-slate-200 p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-800">No leads yet</h2>
        <p className="text-sm text-slate-500 mt-1">Add a lead first, then come back to write a message.</p>
        <Link to="/lead-discovery" className="inline-block mt-4 bg-primary-600 text-white font-medium px-5 py-2.5 rounded-md">
          Find Leads →
        </Link>
      </div>
    )
  }

  const mailto = draft
    ? `mailto:${encodeURIComponent(lead?.emails?.[0] || '')}?subject=${encodeURIComponent(draft.subject || '')}&body=${encodeURIComponent(draft.body)}`
    : ''

  return (
    <div className="space-y-6 min-w-0">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Write Message</h1>
        <p className="text-sm text-slate-500 mt-1">Pick a lead and how to reach them, and AI writes a personalised message.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---------- Left: choices ---------- */}
        <div className="space-y-4 min-w-0">
          <div className="bg-card rounded-xl border border-slate-200 p-5">
            <LeadPicker leads={leads} value={leadId} onChange={(id) => { setLeadId(id); reset() }} />
            {lead && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-inset rounded-lg">
                <ScoreCircle score={lead.score} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{lead.name}</p>
                  <p className="text-xs text-slate-500 truncate">{lead.serviceGaps.join(', ') || 'No gaps detected'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-slate-200 p-5 space-y-4">
            <div>
              <label htmlFor="msg-service" className="block text-sm font-medium text-slate-700 mb-2">Service to offer</label>
              <select
                id="msg-service"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <ChipGroup label="Channel" options={CHANNELS} value={channel} onChange={(c) => { setChannel(c); reset() }} />
            <ChipGroup label="Tone" options={TONES} value={tone} onChange={setTone} />
            <ChipGroup label="Language" options={LANGUAGES} value={language} onChange={setLanguage} />
            <label className="flex items-center justify-between gap-3 text-sm text-slate-700 cursor-pointer">
              <span>
                Two versions
                <span className="block text-xs text-slate-500">Get A and B, then pick the one you like</span>
              </span>
              <input type="checkbox" checked={twoVersions} onChange={(e) => setTwoVersions(e.target.checked)} className={`w-4 h-4 accent-primary-600 ${FOCUS}`} />
            </label>
          </div>

          <button
            type="button"
            onClick={write}
            disabled={writing || !lead}
            className={`w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-md ${FOCUS}`}
          >
            {writing ? <Loader2 size={18} className="motion-safe:animate-spin" aria-hidden="true" /> : <Sparkles size={18} aria-hidden="true" />}
            {writing ? 'Writing…' : draft ? 'Write again' : 'Write message'}
          </button>
          <button
            type="button"
            onClick={writeSequence}
            disabled={seqLoading || !lead}
            className={`w-full inline-flex items-center justify-center gap-2 border border-primary-600 text-aqua-light hover:bg-primary-600/10 disabled:opacity-60 font-semibold py-2.5 rounded-md ${FOCUS}`}
          >
            {seqLoading ? <Loader2 size={17} className="motion-safe:animate-spin" aria-hidden="true" /> : <ListOrdered size={17} aria-hidden="true" />}
            {seqLoading ? 'Writing sequence…' : 'Follow-up sequence (Day 1 / 3 / 7)'}
          </button>

          {/* Templates */}
          <div className="bg-card rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><FileText size={15} className="text-aqua" aria-hidden="true" /> My templates</h3>
            {templates.length ? (
              <ul className="mt-3 space-y-2">
                {templates.map((t) => (
                  <li key={t.id} className="flex items-center gap-2">
                    <button type="button" onClick={() => insertTemplate(t)} className={`min-w-0 flex-1 text-left text-sm text-slate-700 hover:text-aqua truncate rounded ${FOCUS}`} title="Insert with this lead's name">
                      {t.name}
                    </button>
                    <span className="shrink-0 text-[11px] text-slate-400 capitalize">{t.channel}</span>
                    <button type="button" onClick={() => setTemplates(deleteTemplate(t.id))} aria-label={`Delete template ${t.name}`} className={`shrink-0 p-1 rounded text-slate-400 hover:text-red-400 ${FOCUS}`}>
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Write a message you like and click <b className="text-slate-700">Save as template</b>. The business name is filled in for each lead.</p>
            )}
          </div>

          {/* History for this lead */}
          {history.length > 0 && (
            <div className="bg-card rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><History size={15} className="text-aqua" aria-hidden="true" /> Message history</h3>
              <ul className="mt-3 space-y-2">
                {history.map((h) => (
                  <li key={h.at}>
                    <button
                      type="button"
                      onClick={() => { setChannel(h.channel); setResult(null); setDraft({ subject: h.subject, body: h.body }) }}
                      className={`w-full text-left rounded-lg border border-line bg-inset px-3 py-2 hover:border-primary-600 ${FOCUS}`}
                    >
                      <span className="block text-[11px] text-slate-400 capitalize">{h.channel} · {new Date(h.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      <span className="block text-xs text-slate-600 line-clamp-2">{h.subject || h.body}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ---------- Right: message ---------- */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" /> {error}
            </p>
          )}

          <div className="bg-card rounded-xl border border-slate-200 p-5 flex flex-col">
            {/* A / B versions */}
            {result?.messages?.length > 1 && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.messages.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={picked === i}
                    onClick={() => pickVersion(i)}
                    className={`text-left rounded-lg border p-3 ${FOCUS} ${picked === i ? 'border-primary-600 bg-primary-600/10' : 'border-line bg-inset hover:border-primary-600/60'}`}
                  >
                    <span className="text-xs font-bold text-aqua-light">Version {i === 0 ? 'A' : 'B'} {picked === i && '· chosen'}</span>
                    <span className="mt-1 block text-xs text-slate-600 line-clamp-3">{m.subject ? `${m.subject} — ` : ''}{m.body}</span>
                  </button>
                ))}
              </div>
            )}

            {draft ? (
              <>
                {channel === 'email' && (
                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Subject</span>
                    <input
                      value={draft.subject || ''}
                      onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                      className="w-full border border-slate-300 bg-inset rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </label>
                )}
                <div className="relative">
                  <label htmlFor="msg-body" className="sr-only">Message</label>
                  <textarea
                    id="msg-body"
                    value={typed.shown}
                    readOnly={!typed.done}
                    onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                    rows={channel === 'email' ? 12 : 8}
                    className="w-full border border-slate-300 bg-inset rounded-lg p-4 text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-600"
                  />
                  {!typed.done && (
                    <button type="button" onClick={typed.skip} className={`absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-card border border-line px-2.5 py-1 text-xs text-slate-600 ${FOCUS}`}>
                      <FastForward size={12} aria-hidden="true" /> Skip
                    </button>
                  )}
                </div>

                {result && (
                  <p className={`text-xs mt-2 flex items-start gap-1.5 ${result.source === 'AI' ? 'text-slate-500' : 'text-amber-300'}`}>
                    <Info size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
                    {result.source === 'AI'
                      ? 'Written by AI — check before sending. You can edit it above.'
                      : `${result.note || 'Written from a template.'}${language !== 'English' ? ' Templates are in English.' : ''} You can edit it above.`}
                  </p>
                )}

                {/* What the AI used */}
                {result?.used && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400 mr-1">What the AI used:</span>
                    {[result.used.businessName, result.used.category, result.used.city].filter(Boolean).map((t) => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-inset border border-line text-slate-600">{t}</span>
                    ))}
                    {result.used.gaps.map((g) => (
                      <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300">{g}</span>
                    ))}
                  </div>
                )}

                {/* Send actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <button type="button" onClick={() => copy(asText(draft), 'main')} className={BTN}>
                    {copied === 'main' ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied === 'main' ? 'Copied!' : 'Copy'}
                  </button>
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(draft.body)}`} target="_blank" rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm ${FOCUS}`}>
                      <MessageCircle size={14} aria-hidden="true" /> Open in WhatsApp
                    </a>
                  )}
                  <a href={mailto} className={BTN} title={lead?.emails?.[0] ? `To ${lead.emails[0]}` : 'No email found for this lead — add one in your email app'}>
                    <Mail size={14} aria-hidden="true" /> Open in Email
                  </a>
                  <button type="button" onClick={saveAsTemplate} className={BTN}><BookmarkPlus size={14} aria-hidden="true" /> Save as template</button>
                  <button type="button" onClick={download} className={BTN}><Download size={14} aria-hidden="true" /> Download</button>
                  <button type="button" onClick={write} disabled={writing} className={BTN}><RefreshCw size={14} aria-hidden="true" /> Regenerate</button>
                </div>

                {/* Quality check */}
                <div className="mt-5 rounded-lg border border-line bg-inset p-4">
                  <p className="text-sm font-semibold text-slate-800">Message check</p>
                  <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {quality.map((q) => (
                      <li key={q.label} className="flex items-start gap-2 text-sm">
                        {q.ok
                          ? <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-green-400" aria-label="OK" />
                          : <AlertTriangle size={16} className="shrink-0 mt-0.5 text-marigold-400" aria-label="Needs work" />}
                        <span className="min-w-0">
                          <span className="font-medium text-slate-700">{q.label}</span>
                          <span className="block text-xs text-slate-500">{q.tip}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center text-sm text-slate-400 border border-dashed border-line rounded-lg p-10 text-center min-h-[240px]">
                {writing ? 'Writing your message…' : <span>Choose a lead and options, then click <b className="mx-1 text-slate-600">Write message</b>.</span>}
              </div>
            )}
          </div>

          {/* Follow-up sequence */}
          {sequence && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2"><ListOrdered size={17} className="text-aqua" aria-hidden="true" /> Follow-up sequence</h2>
                {sequence.source !== 'AI' && <p className="text-xs text-amber-300">{sequence.note || 'Written from a template.'}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sequence.steps.map((s) => (
                  <div key={s.day} className="bg-card rounded-xl border border-slate-200 p-4 flex flex-col">
                    <p className="text-xs font-bold text-aqua-light">{s.label}</p>
                    {s.subject && <p className="mt-2 text-sm font-semibold text-slate-800">{s.subject}</p>}
                    <p className="mt-2 text-sm text-slate-600 whitespace-pre-line flex-1">{s.body}</p>
                    <button type="button" onClick={() => copy(asText(s), `day${s.day}`)} className={`mt-3 self-start ${BTN}`}>
                      {copied === `day${s.day}` ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />} {copied === `day${s.day}` ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
