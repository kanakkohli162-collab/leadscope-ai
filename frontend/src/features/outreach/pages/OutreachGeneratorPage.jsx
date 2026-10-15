import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Copy, Download, RefreshCw, Mail, MessageCircle, Linkedin, Send, Sparkles } from 'lucide-react'
import ScoreCircle from '@/components/ui/ScoreCircle'
import PageLoader from '@/components/ui/PageLoader'
import { generateMessage } from '@/services/leadService'
import { useLeads } from '@/features/leads/hooks/useLeads'

const SERVICES = [
  'Website Development + SEO',
  'Google Business Profile Optimization',
  'Social Media Marketing',
  'Online Booking System',
  'Review Management',
]

const tabs = [
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
]

export default function OutreachGeneratorPage() {
  const { leads, loading } = useLeads()
  const [params] = useSearchParams()
  const [leadId, setLeadId] = useState('')
  const [service, setService] = useState(SERVICES[0])
  const [channel, setChannel] = useState('email')
  const [message, setMessage] = useState('')
  const [source, setSource] = useState('')
  const [writing, setWriting] = useState(false)
  const [copied, setCopied] = useState(false)

  // Pre-select the lead from ?leadId=… (when coming from Lead Details), else the first lead
  useEffect(() => {
    if (!leadId && leads.length) setLeadId(params.get('leadId') || String(leads[0].id))
  }, [leads, leadId, params])

  const lead = leads.find((l) => String(l.id) === String(leadId))

  async function write() {
    if (!lead) return
    setWriting(true)
    try {
      const res = await generateMessage(lead.id, service, channel)
      setMessage(res.message)
      setSource(res.source)
    } catch (e) {
      alert(e.message)
    } finally {
      setWriting(false)
    }
  }

  function copy() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function download() {
    const blob = new Blob([message], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${lead.name.replace(/\s+/g, '_')}_${channel}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // WhatsApp click-to-chat: opens WhatsApp with the message typed in (user presses send)
  function openWhatsApp() {
    let digits = (lead.phone || '').replace(/\D/g, '')
    if (digits.length === 10) digits = '91' + digits
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, '_blank')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Write Message</h1>
        <p className="text-sm text-slate-500 mt-1">Pick a lead and a service, and AI writes a personalised message.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: choices */}
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Lead</label>
            <select
              value={leadId}
              onChange={(e) => { setLeadId(e.target.value); setMessage('') }}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {leads.map((l) => <option key={l.id} value={l.id}>{l.name} – {l.location}</option>)}
            </select>
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

          <div className="bg-card rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Service to offer</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
            >
              {SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <button
            onClick={write}
            disabled={writing || !lead}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 rounded-md"
          >
            <Sparkles size={18} /> {writing ? 'Writing…' : message ? 'Write again' : 'Write message'}
          </button>
        </div>

        {/* Right: message */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-slate-200 p-5 flex flex-col">
          <div className="flex gap-2 mb-4">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setChannel(id); setMessage('') }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium ${
                  channel === id ? 'bg-primary-600 text-white' : 'bg-inset border border-line text-slate-600 hover:bg-line'
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {message ? (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="flex-1 w-full border border-slate-200 rounded-lg p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-600"
              />
              <p className="text-xs text-amber-300 mt-2">
                {source === 'AI' ? 'Written by AI' : 'Written from a template (AI key not set)'} — check before sending. You can edit it above.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <button onClick={copy} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line text-sm text-slate-700 hover:bg-inset">
                  <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={download} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line text-sm text-slate-700 hover:bg-inset">
                  <Download size={14} /> Download
                </button>
                <button onClick={write} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-line text-sm text-slate-700 hover:bg-inset">
                  <RefreshCw size={14} /> Regenerate
                </button>
                {channel === 'whatsapp' && lead?.phone && lead.phone !== '—' && (
                  <button onClick={openWhatsApp} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm">
                    <Send size={14} /> Open in WhatsApp
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400 border border-dashed border-line rounded-lg p-10 text-center">
              Choose a lead and service, then click <b className="mx-1">Write message</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}