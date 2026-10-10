import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Bot, X } from 'lucide-react'
import { useChat } from '../hooks/useChat'

// The popup's code is split into its own file and only fetched when needed.
const loadPanel = () => import('./ChatPanel')
const ChatPanel = lazy(loadPanel)

/**
 * Floating "Ask AI" button fixed to the bottom-right of every page.
 * Rendered once in AppLayout, so it is available on all logged-in pages.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const chat = useChat() // conversation state lives here so it survives close/reopen

  const toggle = useCallback(() => setOpen((o) => !o), [])
  const close = useCallback(() => setOpen(false), [])

  // Escape closes the popup
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  // Count unread replies while closed → small badge on the button
  const [seen, setSeen] = useState(chat.messages.length)
  useEffect(() => {
    if (open) setSeen(chat.messages.length)
  }, [open, chat.messages.length])
  const unread = open ? 0 : chat.messages.length - seen

  return (
    <>
      {open && (
        <Suspense fallback={null}>
          <ChatPanel
            messages={chat.messages}
            isTyping={chat.isTyping}
            onSend={chat.send}
            onReset={chat.reset}
            onClose={close}
          />
        </Suspense>
      )}

      <button
        type="button"
        onClick={toggle}
        // Prefetch: start downloading the panel when the mouse is over the button,
        // so by the time the user clicks it's usually already loaded.
        onMouseEnter={loadPanel}
        onFocus={loadPanel}
        aria-label={open ? 'Close Ask AI' : 'Open Ask AI'}
        aria-expanded={open}
        title="Ask AI"
        className={`fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 w-14 h-14 rounded-full
                    bg-primary-600 hover:bg-primary-700 text-white shadow-xl shadow-primary-600/30
                    flex items-center justify-center transition-transform hover:scale-105 active:scale-95
                    ${open ? 'max-sm:hidden' : ''}`}
      >
        {open ? <X size={24} /> : <Bot size={26} />}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[11px] font-bold flex items-center justify-center ring-2 ring-white">
            {unread}
          </span>
        )}
      </button>
    </>
  )
}
