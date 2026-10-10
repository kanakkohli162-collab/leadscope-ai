import { useState } from 'react'
import { Copy, Edit3, Download, RefreshCw, Mail, MessageCircle, Linkedin } from 'lucide-react'
import ScoreCircle from '@/components/ui/ScoreCircle'
import { leads } from '@/mocks'
import { buildOutreachMessage } from '../utils/messageTemplates'


export default function OutreachGeneratorPage() {
  const [selectedLead, setSelectedLead] = useState(leads[0])
  const [service, setService] = useState('Website Development + SEO')
  const [activeTab, setActiveTab] = useState('email')
  const [message, setMessage] = useState(() => buildOutreachMessage(leads[0], 'Website Development + SEO'))
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    setMessage(buildOutreachMessage(selectedLead, service))
  }

  // Picking a different lead immediately drafts a message for that lead
  const handleLeadChange = (e) => {
    const lead = leads.find((l) => l.id === Number(e.target.value))
    setSelectedLead(lead)
    setMessage(buildOutreachMessage(lead, service))
  }

  const tabs = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Outreach Generator</h1>
        <p className="text-sm text-slate-500 mt-1">Create personalized messages using AI</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Selectors */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Selected Lead</label>
            <select
              value={selectedLead.id}
              onChange={handleLeadChange}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {leads.map(l => (
                <option key={l.id} value={l.id}>{l.name} – {l.location}</option>
              ))}
            </select>

            <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <ScoreCircle score={selectedLead.score} size="sm" />
              <div>
                <p className="text-sm font-medium text-slate-800">{selectedLead.name}</p>
                <p className="text-xs text-slate-500">{selectedLead.category} • {selectedLead.location}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Choose Service</label>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option>Website Development + SEO</option>
              <option>Google Listing Optimization</option>
              <option>Online Appointment System</option>
              <option>Digital Marketing Package</option>
              <option>Review Management</option>
            </select>

            <button
              onClick={handleRegenerate}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              Generate Message
            </button>
          </div>
        </div>

        {/* Right: Message */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">AI Generated Messages</h3>
            <button
              onClick={handleRegenerate}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              <RefreshCw size={14} /> Regenerate
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-slate-200">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subject (Email only) */}
          {activeTab === 'email' && (
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
              <input
                type="text"
                defaultValue="Improve Your Online Presence & Get More Patients"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          {/* Message Body */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={14}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />

          {/* Actions */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              <Copy size={14} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors">
              <Edit3 size={14} />
              Edit
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
