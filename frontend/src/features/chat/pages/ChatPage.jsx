import { useEffect, useRef, useState } from 'react'
import { Send, RotateCcw, Bot } from 'lucide-react'
import WhitePanel from '@/components/ui/WhitePanel'
import { useChat } from '../hooks/useChat'
import { MessageBubble, TypingIndicator } from '../components/ChatPanel'

const EXAMPLES = [
  'Show high-priority leads',
  'Which businesses have no website?',
  'Which leads are from Noida?',
  'Who should I contact first?',
]
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua'

/**
 * Ask AI as a full page (Synopsis: chatbot): same answers as the floating Ask AI button,
 * from the user's saved leads. The floating button is hidden on this page.
 */
export default function ChatPage() {
  const chat = useChat()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [chat.messages, chat.isTyping])

  function submit(text = input) {
    if (!text.trim() || chat.isTyping) return
    chat.send(text)
    setInput('')
  }

  return (
    <div className="space-y-6 min-w-0 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Bot size={22} className="text-aqua" aria-hidden="true" /> Ask AI</h1>
        <p className="text-sm text-slate-500 mt-1">Ask questions about your saved leads in plain words.</p>
      </div>

      <WhitePanel
        as="div"
        bodyClassName="flex flex-col !p-0 h-[calc(100vh-15rem)] min-h-[440px]"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-line">
          <p className="text-sm font-semibold text-slate-800">Conversation</p>
          <button type="button" onClick={chat.reset} className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-inset hover:text-slate-800 ${FOCUS}`}>
            <RotateCcw size={14} aria-hidden="true" /> New conversation
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3" aria-live="polite">
          {chat.messages.map((m) => <MessageBubble key={m.id} role={m.role} content={m.content} />)}
          {chat.isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 sm:px-5 pt-3 border-t border-line">
          <p className="text-[11px] font-medium text-slate-400 mb-2">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((q) => (
              <button key={q} type="button" onClick={() => submit(q)} disabled={chat.isTyping}
                className={`px-3 py-1.5 rounded-full border border-primary-600/30 bg-primary-600/10 text-xs font-medium text-aqua-light hover:bg-primary-600/20 disabled:opacity-50 ${FOCUS}`}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <form className="p-4 sm:p-5 flex gap-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <label htmlFor="ask-ai-input" className="sr-only">Your question</label>
          <input
            id="ask-ai-input"
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your leads, e.g. gyms in Lucknow without website"
            className="flex-1 min-w-0 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
          />
          <button type="submit" disabled={!input.trim() || chat.isTyping} aria-label="Send"
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-semibold rounded-md ${FOCUS}`}>
            <Send size={16} aria-hidden="true" /> <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </WhitePanel>
    </div>
  )
}
