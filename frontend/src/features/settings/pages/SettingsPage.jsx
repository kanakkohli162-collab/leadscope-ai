import { useState } from 'react'
import { User, Building, MessageSquare, Brain, Bell, Camera } from 'lucide-react'

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building },
  { id: 'outreach', label: 'Outreach', icon: MessageSquare },
  { id: 'ai', label: 'AI Settings', icon: Brain },
  { id: 'notifications', label: 'Notifications', icon: Bell },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [form, setForm] = useState({
    name: 'Megha Sharma',
    email: 'megha@example.com',
    company: 'LeadScope AI',
    designation: 'Marketing Manager',
    phone: '+91 98765 43210',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs */}
        <div className="lg:w-56 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-2 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-slate-800">Profile Information</h3>

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center text-white text-2xl font-bold">
                    MS
                  </div>
                  <button className="absolute bottom-0 right-0 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm hover:bg-slate-50">
                    <Camera size={12} className="text-slate-600" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Profile Photo</p>
                  <p className="text-xs text-slate-500">JPG, PNG. Max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Designation</label>
                  <input
                    name="designation"
                    value={form.designation}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'company' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Company Information</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Company Name</label>
                <input defaultValue="LeadScope AI" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Industry</label>
                <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Digital Marketing Agency</option>
                  <option>Web Development</option>
                  <option>SEO Services</option>
                  <option>Healthcare Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Website</label>
                <input defaultValue="https://leadscope.ai" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'outreach' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Outreach Preferences</h3>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Default Signature</label>
                <textarea
                  rows={4}
                  defaultValue="Best regards,&#10;LeadScope AI Team"
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Preferred Channel</label>
                <select className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option>Email</option>
                  <option>WhatsApp</option>
                  <option>LinkedIn</option>
                </select>
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">AI Settings</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Auto Lead Scoring</p>
                    <p className="text-xs text-slate-500">Automatically score new leads using AI</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Service Gap Detection</p>
                    <p className="text-xs text-slate-500">Detect website and listing gaps automatically</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                </label>
                <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Review Sentiment Analysis</p>
                    <p className="text-xs text-slate-500">Analyze review sentiment with NLP</p>
                  </div>
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                </label>
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800">Notification Settings</h3>
              <div className="space-y-3">
                {[
                  { title: 'New High-Priority Leads', desc: 'Get notified when high-score leads are found' },
                  { title: 'Outreach Responses', desc: 'Alert when a lead replies to your message' },
                  { title: 'Weekly Reports', desc: 'Receive weekly performance summary' },
                  { title: 'System Updates', desc: 'Product updates and new features' },
                ].map(item => (
                  <label key={item.title} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-primary-600 rounded" />
                  </label>
                ))}
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
