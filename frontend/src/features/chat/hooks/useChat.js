import { useCallback, useEffect, useRef, useState } from 'react'
import { getAIResponse } from '../utils/chatEngine'
import { getLeads } from '@/services/leadService'

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: "Hi! I'm your LeadScope assistant. Ask me about your saved leads, or try a suggestion below.",
}

export function useChat() {
  const [messages, setMessages] = useState([WELCOME])
  const [isTyping, setIsTyping] = useState(false)
  const idRef = useRef(0)
  const mounted = useRef(true)

  useEffect(() => () => { mounted.current = false }, [])

  const send = useCallback(async (text) => {
    const query = text.trim()
    if (!query) return

    setMessages((prev) => [...prev, { id: ++idRef.current, role: 'user', content: query }])
    setIsTyping(true)

    let reply
    try {
      const leads = await getLeads()
      reply = getAIResponse(query, leads)
    } catch {
      reply = "Sorry, I couldn't load your leads right now. Please try again."
    }

    if (!mounted.current) return
    setMessages((prev) => [...prev, { id: ++idRef.current, role: 'assistant', content: reply }])
    setIsTyping(false)
  }, [])

  const reset = useCallback(() => {
    setIsTyping(false)
    setMessages([WELCOME])
  }, [])

  return { messages, isTyping, send, reset }
}
