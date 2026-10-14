import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, X } from 'lucide-react'
import { useChat } from '../hooks/useChat'

const loadPanel = () => import('./ChatPanel')
const ChatPanel = lazy(loadPanel)

const PAGE_HELP = [
  { match: '/dashboard', hello: '👋 Want a quick summary of your leads?',
    suggestions: ['Give me a summary', 'Who should I contact first?', 'Show high-priority leads', 'How many converted leads?'] },
  { match: '/lead-discovery', hello: '🔎 Not sure what to search? I can help.',
    suggestions: ['How does lead scoring work?', 'What should I search?', 'Show high-priority leads', 'Which businesses have no website?'] },
  { match: '/my-leads', hello: '🔥 Want to see your hottest leads?',
    suggestions: ['Show high-priority leads', 'Which businesses have no website?', 'Show contacted leads', 'Who should I contact first?'] },
  { match: '/lead/', hello: '💡 Need help pitching this business?',
    suggestions: ['Who should I contact first?', 'How does lead scoring work?', 'Show follow-up leads', 'Give me a summary'] },
  { match: '/outreach', hello: '✍️ Tip: pick a lead, a service and a channel.',
    suggestions: ['Which businesses have no website?', 'Show interested leads', 'Who should I contact first?', 'Give me a summary'] },
]
const DEFAULT_HELP = {
  hello: '👋 Hi! Ask me anything about your leads.',
  suggestions: ['Give me a summary', 'Show high-priority leads', 'Which businesses have no website?', 'Who should I contact first?'],
}

const CSS = `
@keyframes cw-pulse { 0% { box-shadow: 0 0 0 0 rgba(181,38,232,.55); } 70% { box-shadow: 0 0 0 16px rgba(181,38,232,0); } 100% { box-shadow: 0 0 0 0 rgba(181,38,232,0); } }
@keyframes cw-pop { from { opacity: 0; transform: translateY(8px) scale(.95); } to { opacity: 1; transform: none; } }
.cw-pulse { animation: cw-pulse 2.4s ease-out infinite; }
.cw-pop { animation: cw-pop .35s cubic-bezier(.2,.8,.2,1.1) forwards; }
@media (prefers-reduced-motion: reduce) { .cw-pulse, .cw-pop { animation: none !important; } }
`

export default function ChatWidget() {
  const { pathname } = useLocation()
  const help = PAGE_HELP.find((p) => pathname.startsWith(p.match)) || DEFAULT_HELP

  const [open, setOpen] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const [dismissed, setDismissed] = useState({})
  const chat = useChat()

  const close = useCallback(() => setOpen(false), [])
  const openChat = useCallback(() => { setOpen(true); setTeaser(false) }, [])
  const toggle = useCallback(() => { setOpen((o) => !o); setTeaser(false) }, [])

  useEffect(() => {
    setTeaser(false)
    if (open || dismissed[help.hello]) return
    const t = setTimeout(() => setTeaser(true), 1500)
    return () => clearTimeout(t)
  }, [pathname, open, dismissed, help.hello])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  const askFromTeaser = (q) => {
    openChat()
    chat.send(q)
  }

  return (
    <>
      <style>{CSS}</style>

      {open && (
        <Suspense fallback={null}>
          <ChatPanel
            messages={chat.messages}
            isTyping={chat.isTyping}
            suggestions={help.suggestions}
            onSend={chat.send}
            onReset={chat.reset}
            onClose={close}
          />
        </Suspense>
      )}

      {teaser && !open && (
        <div className="cw-pop fixed bottom-24 right-5 sm:right-6 z-50 w-[290px] rounded-2xl bg-white border border-slate-200 shadow-2xl p-4">
          <button
            type="button"
            onClick={() => { setTeaser(false); setDismissed((d) => ({ ...d, [help.hello]: true })) }}
            className="absolute top-2 right-2 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
          <p className="text-sm font-semibold text-slate-800 pr-5">{help.hello}</p>
          <div className="mt-3 flex flex-col gap-1.5">
            {help.suggestions.slice(0, 2).map((s) => (
              <button key={s} type="button" onClick={() => askFromTeaser(s)}
                className="text-left text-xs px-3 py-2 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 font-medium transition-colors">
                {s}
              </button>
            ))}
          </div>
          <span className="absolute -bottom-2 right-7 w-4 h-4 bg-white border-r border-b border-slate-200 rotate-45" />
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        onMouseEnter={loadPanel}
        onFocus={loadPanel}
        aria-label={open ? 'Close Ask AI' : 'Open Ask AI'}
        aria-expanded={open}
        title="Ask AI"
        className={`${open ? '' : 'cw-pulse'} fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 h-14 rounded-full
                    bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-600/30
                    flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95
                    ${open ? 'w-14 max-sm:hidden' : 'w-14 sm:w-auto sm:px-5'}`}
      >
        {open ? <X size={24} /> : (<><Bot size={24} /><span className="hidden sm:inline text-sm font-semibold">Ask AI</span></>)}
      </button>
    </>
  )
}