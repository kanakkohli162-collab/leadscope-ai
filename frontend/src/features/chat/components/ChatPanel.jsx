import { memo, useEffect, useRef, useState } from 'react'
import { Send, Bot, User, X, RotateCcw } from 'lucide-react'

const MessageBubble = memo(function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 shrink-0 rounded-full bg-primary-600/20 text-aqua-light flex items-center justify-center"><Bot size={15} /></div>
      )}
      <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line leading-relaxed ${
        isUser ? 'bg-primary-600 text-white rounded-br-md' : 'bg-inset border border-line text-slate-800 rounded-bl-md'}`}>
        {content}
      </div>
      {isUser && (
        <div className="w-7 h-7 shrink-0 rounded-full bg-line text-slate-700 flex items-center justify-center"><User size={15} /></div>
      )}
    </div>
  )
})

function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center">
      <div className="w-7 h-7 rounded-full bg-primary-600/20 text-aqua-light flex items-center justify-center"><Bot size={15} /></div>
      <div className="px-4 py-3 rounded-2xl bg-inset border border-line flex gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  )
}

export default function ChatPanel({ messages, isTyping, suggestions = [], onSend, onReset, onClose }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [messages, isTyping])

  const submit = (text = input) => {
    if (!text.trim() || isTyping) return
    onSend(text)
    setInput('')
  }

  return (
    <div role="dialog" aria-label="Ask AI"
      className="flex flex-col bg-card shadow-2xl shadow-black/50 border border-line overflow-hidden fixed inset-0 z-50 rounded-none
                 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[390px] sm:h-[580px] sm:max-h-[calc(100vh-8rem)] sm:rounded-2xl animate-chat-in origin-bottom-right">
      <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: 'linear-gradient(135deg, #001C36 0%, #0497F6 60%, #4EB9E5 100%)' }}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={19} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 ring-2 ring-[#0080DD]" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Ask AI</p>
            <p className="text-[11px] text-primary-100">Answers from your saved leads</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onReset} className="p-1.5 rounded-lg hover:bg-white/15" aria-label="New conversation" title="New conversation"><RotateCcw size={16} /></button>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/15" aria-label="Close chat"><X size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => <MessageBubble key={m.id} role={m.role} content={m.content} />)}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {suggestions.length > 0 && (
        <div className="px-3 pt-2 pb-1 border-t border-line">
          <p className="px-1 pb-1.5 text-[11px] font-medium text-slate-400">Quick questions</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestions.map((s) => (
              <button type="button" key={s} onClick={() => submit(s)} disabled={isTyping}
                className="shrink-0 px-3 py-1.5 bg-primary-600/15 border border-primary-600/30 rounded-full text-xs font-medium text-aqua-light hover:bg-primary-600/25 disabled:opacity-50">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <form className="p-3 border-t border-line flex gap-2" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your leads…"
          className="flex-1 min-w-0 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-600" />
        <button type="submit" disabled={!input.trim() || isTyping}
          className="px-3.5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-md" aria-label="Send">
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
