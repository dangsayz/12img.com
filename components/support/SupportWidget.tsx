'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, CheckCheck } from 'lucide-react'
import { useAuth } from '@clerk/nextjs'
import {
  getOrCreateConversation,
  sendSupportMessage,
  getUserMessages,
  type SupportMessage,
} from '@/server/actions/support.actions'

export function SupportWidget() {
  const { isSignedIn, isLoaded } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load messages when widget opens
  useEffect(() => {
    if (isOpen && isSignedIn) {
      loadMessages()
    }
  }, [isOpen, isSignedIn])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const loadMessages = async () => {
    setIsLoading(true)
    const result = await getUserMessages()
    if (result.success) {
      setMessages(result.messages || [])
      setConversationId(result.conversationId || null)
    }
    setIsLoading(false)
  }

  const handleSend = async () => {
    if (!input.trim() || isSending) return

    const messageText = input.trim()
    setInput('')
    setIsSending(true)

    // If no conversation exists, create one
    let currentConversationId = conversationId
    if (!currentConversationId) {
      const convResult = await getOrCreateConversation()
      if (convResult.success && convResult.conversation) {
        currentConversationId = convResult.conversation.id
        setConversationId(currentConversationId)
      } else {
        setIsSending(false)
        return
      }
    }

    // Optimistically add the message
    const optimisticMessage: SupportMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: currentConversationId,
      sender_type: 'user',
      sender_id: '',
      message: messageText,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])

    const result = await sendSupportMessage(currentConversationId, messageText)
    
    if (result.success && result.message) {
      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMessage.id ? result.message! : m))
      )
    } else {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      setInput(messageText) // Restore input
    }

    setIsSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Don't render for non-authenticated users or while loading
  if (!isLoaded || !isSignedIn) return null

  return (
    <>
      {/* Floating Badge */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg shadow-gray-900/25 hover:shadow-xl hover:shadow-gray-900/30 transition-shadow"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? 20 : 0, pointerEvents: isOpen ? 'none' : 'auto' }}
        transition={{ duration: 0.2 }}
      >
        <MessageCircle className="w-6 h-6" />
        {messages.some((m) => m.sender_type === 'admin' && !m.read_at) && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-blue-500 rounded-full ring-2 ring-white" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-50 w-[calc(100vw-48px)] max-w-[400px] h-[min(600px,calc(100vh-100px))] bg-white rounded-2xl shadow-2xl shadow-gray-900/20 flex flex-col overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-6 py-5 text-white">
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Need help?</h3>
                    <p className="text-sm text-white/70">We typically reply within a few hours</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Start a conversation</h4>
                    <p className="text-sm text-gray-500">
                      Have a question, feedback, or need help? We&apos;re here for you.
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                            msg.sender_type === 'user'
                              ? 'bg-gray-900 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-[10px] ${
                              msg.sender_type === 'user' ? 'text-white/50 justify-end' : 'text-gray-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {msg.sender_type === 'user' && msg.read_at && (
                              <CheckCheck className="w-3 h-3 text-blue-400" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all max-h-32"
                    style={{ minHeight: '46px' }}
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                    className="flex items-center justify-center w-11 h-11 rounded-xl bg-gray-900 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
