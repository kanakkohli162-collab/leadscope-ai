import { memo, useEffect, useRef, useState } from 'react'
import { Send, Bot, User, X, RotateCcw } from 'lucide-react'
import { chatSuggestions } from '@/mocks'

/** One chat bubble. memo → old bubbles don't re-render when a new message arrives. */
const MessageBubble = memo(function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  return (
    <div className={`flex gap-2.5 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
          <Bot size={14} className="text-primary-600" />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-line break-words ${
          isUser ? 'bg-primary-600 text-white rounded-br-md' : 'bg-slate-100 text-slate-700 rounded-bl-md'
        }`}
      >
        {content}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <User size={14} className="text-slate-600" />
        </div>
      )}
    </div>
  )
})

function TypingIndicator() {
  return (
    <div className="flex gap-2.5" aria-live="polite" aria-label="Assistant is typing">
      <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
        <Bot size={14} className="text-primary-600" />
      </div>
      <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * The popup window. Purely presentational: it receives messages + callbacks
 * from ChatWidget (via useChat) and only owns the text-box value.
 *
 * This file is lazy-loaded — its code is downloaded the first time the user
 * clicks the chat button, not on initial page load.
 */
export default function ChatPanel({ messages, isTyping, onSend, onReset, onClose }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Focus the text box as soon as the popup opens
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Auto-scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isTyping])

  const submit = (text = input) => {
    if (!text.trim()) return
    onSend(text)
    setInput('')
  }

  return (
    <div
      role="dialog"
      aria-label="Ask AI"
      className="flex flex-col bg-white shadow-2xl border border-slate-200 overflow-hidden
                 fixed inset-0 z-50 rounded-none
                 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[380px] sm:h-[560px] sm:max-h-[calc(100vh-8rem)] sm:rounded-2xl
                 animate-chat-in origin-bottom-right"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Ask AI</p>
            <p className="text-[11px] text-primary-100">Ask anything about your leads</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg hover:bg-white/15"
            aria-label="Start new conversation"
            title="New conversation"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15"
            aria-label="Close chat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only before the first question */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {chatSuggestions.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => submit(s)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input — a <form> so Enter submits natively */}
      <form
        className="p-3 border-t border-slate-200 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 min-w-0 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="px-3.5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl transition-colors"
          aria-label="Send"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
