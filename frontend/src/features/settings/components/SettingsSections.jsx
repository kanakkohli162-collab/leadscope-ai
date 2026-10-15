import { useState } from 'react'
import WhitePanel from '@/components/ui/WhitePanel'
import {
  User, KeyRound, Briefcase, SlidersHorizontal, BarChart3, ShieldCheck, Download, Trash2, LogOut, Loader2, Check,
  Eye, EyeOff,
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import {
  updateProfile, changePassword, updateAgency, updatePreferences, isStrongPassword,
} from '@/services/accountService'
import { getLeads } from '@/services/leadService'
import { exportLeadsToExcel } from '@/features/leads/utils/exportLeads'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'
const INPUT = 'w-full px-3 py-2.5 border border-slate-300 bg-inset rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600'
const SAVE = `inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2.5 rounded-md ${FOCUS}`

const friendly = (e) => (e instanceof TypeError || /failed to fetch/i.test(e?.message || '')
  ? 'We could not reach the server. Please try again in a minute.'
  : e?.message || 'Something went wrong. Please try again.')

function Section({ icon: Icon, title, caption, children, tone = 'text-aqua' }) {
  return (
    <WhitePanel>
      <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
        <Icon size={18} className={tone} aria-hidden="true" /> {title}
      </h2>
      {caption && <p className="text-xs text-slate-500 mt-1">{caption}</p>}
      <div className="mt-4">{children}</div>
    </WhitePanel>
  )
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-500 mt-1">{hint}</span>}
    </label>
  )
}

// ---------- 1. Profile ----------
export function ProfileSection({ user, onSaved }) {
  const toast = useToast()
  const [name, setName] = useState(user.name || '')
  const [agencyName, setAgencyName] = useState(user.agencyName || '')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      onSaved(await updateProfile(name.trim(), agencyName.trim()))
      toast.success('Profile saved')
    } catch (err) {
      toast.error(friendly(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon={User} title="Profile" caption={`Signed in as ${user.email}`}>
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name"><input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required className={INPUT} /></Field>
        <Field label="Agency name"><input value={agencyName} onChange={(e) => setAgencyName(e.target.value)} maxLength={120} placeholder="e.g. Pixel Digital" className={INPUT} /></Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving || !name.trim()} className={SAVE}>
            {saving ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />} Save profile
          </button>
        </div>
      </form>
    </Section>
  )
}

// ---------- 2. Password ----------
export function PasswordSection() {
  const toast = useToast()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setError('') }

  async function save(e) {
    e.preventDefault()
    if (!isStrongPassword(form.next)) return setError('The new password needs at least 8 characters, with a letter and a number.')
    if (form.next !== form.confirm) return setError('The two new passwords are not the same.')
    setSaving(true)
    try {
      await changePassword(form.current, form.next)
      setForm({ current: '', next: '', confirm: '' })
      toast.success('Password changed')
    } catch (err) {
      setError(friendly(err))
    } finally {
      setSaving(false)
    }
  }

  const type = show ? 'text' : 'password'
  return (
    <Section icon={KeyRound} title="Change password" caption="At least 8 characters, with a letter and a number.">
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Current password"><input type={type} value={form.current} onChange={set('current')} autoComplete="current-password" required className={INPUT} /></Field>
        <Field label="New password"><input type={type} value={form.next} onChange={set('next')} autoComplete="new-password" required className={INPUT} /></Field>
        <Field label="Confirm new password"><input type={type} value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required className={INPUT} /></Field>
        <div className="sm:col-span-3 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className={SAVE}>
            {saving ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <KeyRound size={16} aria-hidden="true" />} Change password
          </button>
          <button type="button" onClick={() => setShow((s) => !s)} className={`inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 rounded ${FOCUS}`}>
            {show ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />} {show ? 'Hide' : 'Show'} passwords
          </button>
          {form.next && (
            <span className={`text-xs ${isStrongPassword(form.next) ? 'text-green-400' : 'text-slate-500'}`}>
              {isStrongPassword(form.next) ? '✓ Strong enough' : 'Needs 8+ characters, a letter and a number'}
            </span>
          )}
        </div>
        {error && <p role="alert" className="sm:col-span-3 text-sm text-red-400">{error}</p>}
      </form>
    </Section>
  )
}

// ---------- 3. Agency profile for messages ----------
export function AgencySection({ agency, serviceOptions, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    servicesOffered: agency.servicesOffered || [],
    senderName: agency.senderName || '',
    senderPhone: agency.senderPhone || '',
    senderWebsite: agency.senderWebsite || '',
    signature: agency.signature || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggle = (s) => setForm((f) => ({
    ...f, servicesOffered: f.servicesOffered.includes(s) ? f.servicesOffered.filter((x) => x !== s) : [...f.servicesOffered, s],
  }))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      onSaved(await updateAgency(form))
      toast.success('Agency profile saved. New messages will use it.')
    } catch (err) {
      toast.error(friendly(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section icon={Briefcase} title="Agency profile for messages" caption="Write Message only offers these services and ends every message with your signature.">
      <form onSubmit={save} className="space-y-4">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700 mb-2">Services you offer</legend>
          <div className="flex flex-wrap gap-2">
            {serviceOptions.map((s) => {
              const on = form.servicesOffered.includes(s)
              return (
                <button key={s} type="button" aria-pressed={on} onClick={() => toggle(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${FOCUS} ${on ? 'bg-primary-600 border-primary-600 text-white' : 'bg-inset border-line text-slate-600 hover:bg-line'}`}>
                  {on && <Check size={13} aria-hidden="true" />} {s}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">None chosen = messages can offer any service.</p>
        </fieldset>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Sender name"><input value={form.senderName} onChange={set('senderName')} maxLength={80} placeholder="e.g. Kanak" className={INPUT} /></Field>
          <Field label="Phone"><input value={form.senderPhone} onChange={set('senderPhone')} maxLength={30} inputMode="tel" placeholder="e.g. +91 98260 11223" className={INPUT} /></Field>
          <Field label="Website"><input value={form.senderWebsite} onChange={set('senderWebsite')} maxLength={200} placeholder="e.g. pixeldigital.in" className={INPUT} /></Field>
        </div>
        <Field label="Signature" hint="Used exactly as written at the end of messages. Empty = your name, agency, phone and website.">
          <textarea value={form.signature} onChange={set('signature')} maxLength={500} rows={3} placeholder={'Warm regards,\nKanak | Pixel Digital | +91 98260 11223'} className={INPUT} />
        </Field>
        <button type="submit" disabled={saving} className={SAVE}>
          {saving ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />} Save agency profile
        </button>
      </form>
    </Section>
  )
}

// ---------- 4. Default preferences ----------
const TONES = ['Friendly', 'Professional', 'Short']
const LANGUAGES = ['English', 'Hindi', 'Hinglish']
const CHANNELS = [['whatsapp', 'WhatsApp'], ['email', 'Email'], ['linkedin', 'LinkedIn']]

export function PreferencesSection({ user, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    defaultCity: user.defaultCity || '',
    defaultBusinessType: user.defaultBusinessType || '',
    defaultTone: user.defaultTone || '',
    defaultLanguage: user.defaultLanguage || '',
    defaultChannel: user.defaultChannel || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    setSaving(true)
    try {
      onSaved(await updatePreferences(form))
      toast.success('Defaults saved. Find Leads and Write Message will start with them.')
    } catch (err) {
      toast.error(friendly(err))
    } finally {
      setSaving(false)
    }
  }

  const select = (key, options) => (
    <select value={form[key]} onChange={set(key)} className={INPUT}>
      <option value="">No default</option>
      {options.map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o}>{o}</option>))}
    </select>
  )

  return (
    <Section icon={SlidersHorizontal} title="Default preferences" caption="Pre-fill Find Leads and Write Message.">
      <form onSubmit={save} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="City"><input value={form.defaultCity} onChange={set('defaultCity')} maxLength={60} placeholder="e.g. Indore" className={INPUT} /></Field>
        <Field label="Business type"><input value={form.defaultBusinessType} onChange={set('defaultBusinessType')} maxLength={60} placeholder="e.g. Restaurants" className={INPUT} /></Field>
        <Field label="Message tone">{select('defaultTone', TONES)}</Field>
        <Field label="Language">{select('defaultLanguage', LANGUAGES)}</Field>
        <Field label="Channel">{select('defaultChannel', CHANNELS)}</Field>
        <div className="flex items-end">
          <button type="submit" disabled={saving} className={SAVE}>
            {saving ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />} Save defaults
          </button>
        </div>
      </form>
    </Section>
  )
}

// ---------- 5. Usage this month ----------
export function UsageSection({ usage }) {
  const month = new Date(`${usage.month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  const items = [
    ['Searches', usage.searches],
    ['Messages written', usage.aiMessages],
    ['Website checks', usage.websiteChecks],
    ['Leads saved', usage.leadsSaved],
  ]
  return (
    <Section icon={BarChart3} title="Usage this month" caption={month}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-line bg-inset px-4 py-3">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-display text-2xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">
        “Leads saved” is exact ({usage.totalLeads} leads in total). Searches, messages and website checks are counted from
        this update onwards, so earlier activity is not included.
      </p>
    </Section>
  )
}

// ---------- 6. Privacy ----------
export function PrivacySection({ onDelete }) {
  const toast = useToast()
  const [exporting, setExporting] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function downloadData() {
    setExporting(true)
    try {
      const leads = await getLeads()
      if (!leads.length) toast.success('You have no saved leads yet, so there is nothing to download.')
      else exportLeadsToExcel(leads)
    } catch (err) {
      toast.error(friendly(err))
    } finally {
      setExporting(false)
    }
  }

  async function remove(e) {
    e.preventDefault()
    if (confirm !== 'DELETE') return
    setDeleting(true)
    try {
      await onDelete()
    } catch (err) {
      toast.error(friendly(err))
      setDeleting(false)
    }
  }

  return (
    <Section icon={ShieldCheck} title="Privacy" caption="Your data belongs to you.">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-800">Download my data</p>
            <p className="text-xs text-slate-500">All your saved leads as an Excel file.</p>
          </div>
          <button type="button" onClick={downloadData} disabled={exporting}
            className={`inline-flex items-center gap-2 rounded-lg border border-line bg-inset hover:bg-line disabled:opacity-60 px-4 py-2.5 text-sm font-medium text-slate-700 ${FOCUS}`}>
            {exporting ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />} Download my data
          </button>
        </div>

        <form onSubmit={remove} className="rounded-lg border border-red-500/40 bg-red-500/5 p-4">
          <p className="text-sm font-semibold text-red-300">Delete my account</p>
          <p className="text-xs text-slate-500 mt-0.5">This deletes your account and all your leads for good. It cannot be undone.</p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-end gap-3">
            <label className="flex-1">
              <span className="block text-xs text-slate-500 mb-1">Type <b className="text-slate-700">DELETE</b> to confirm</span>
              <input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" className={INPUT} />
            </label>
            <button type="submit" disabled={confirm !== 'DELETE' || deleting}
              className={`inline-flex items-center justify-center gap-2 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-40 px-4 py-2.5 text-sm font-semibold text-white ${FOCUS}`}>
              {deleting ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden="true" /> : <Trash2 size={16} aria-hidden="true" />} Delete my account
            </button>
          </div>
        </form>
      </div>
    </Section>
  )
}

// ---------- 7. Security ----------
export function SecuritySection({ lastLoginAt, currentLoginAt, onLogout }) {
  const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  return (
    <Section icon={ShieldCheck} tone="text-green-400" title="Security" caption="Your password is stored securely (BCrypt), and only you can see your leads.">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600 space-y-0.5">
          <p>Last login before this one: <b className="text-slate-800">{lastLoginAt ? fmt(lastLoginAt) : 'Not recorded yet'}</b></p>
          {currentLoginAt && <p className="text-xs text-slate-500">This session started {fmt(currentLoginAt)}.</p>}
        </div>
        <button type="button" onClick={onLogout}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-500/30 text-red-400 font-medium hover:bg-red-500/10 ${FOCUS}`}>
          <LogOut size={17} aria-hidden="true" /> Log out
        </button>
      </div>
    </Section>
  )
}
