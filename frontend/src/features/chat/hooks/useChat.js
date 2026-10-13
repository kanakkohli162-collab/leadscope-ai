import { useCallback, useEffect, useRef, useState } from 'react'
import { getAIResponse } from '../utils/chatEngine'

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I'm your LeadScope AI assistant. Ask me anything about your leads, analytics, or outreach. Try one of the suggestions below!",
}

const TYPING_DELAY_MS = 800

/**
 * All chat STATE + LOGIC, with zero UI.
 *
 * Why a custom hook? The popup (ChatPanel) only renders when open, but the
 * conversation must survive closing/reopening it. So the hook is called in
 * ChatWidget (always mounted) and the messages are passed down to the panel.
 */
export function useChat() {
  const [messages, setMessages] = useState([WELCOME])
  const [isTyping, setIsTyping] = useState(false)
  const timerRef = useRef(null)
  const idRef = useRef(0) // stable unique keys for messages (better than array index)

  // If the component unmounts mid-"typing", cancel the pending reply
  useEffect(() => () => clearTimeout(timerRef.current), [])

  const send = useCallback((text) => {
    const query = text.trim()
    if (!query) return

    setMessages((prev) => [...prev, { id: ++idRef.current, role: 'user', content: query }])
    setIsTyping(true)

    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: ++idRef.current, role: 'assistant', content: getAIResponse(query) },
      ])
      setIsTyping(false)
    }, TYPING_DELAY_MS)
  }, [])

  const reset = useCallback(() => {
    clearTimeout(timerRef.current)
    setIsTyping(false)
    setMessages([WELCOME])
  }, [])

  return { messages, isTyping, send, reset }
}
