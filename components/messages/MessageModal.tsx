'use client'

import { useState, useRef, useEffect, useTransition, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Loader2,
  Check,
  CheckCheck,
  MessageSquare,
  Minimize2,
  Maximize2,
  Phone,
  Mail,
  MoreVertical,
} from 'lucide-react'
import { type Message } from '@/server/actions/message.actions'
import { sendMessage, markMessagesRead } from '@/server/actions/message.actions'

interface MessageModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  initialMessages: Message[]
  isPortal?: boolean
  onSendMessage?: (content: string) => Promise<void>
}

export function MessageModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientEmail,
  clientPhone,
  initialMessages,
  isPortal = false,
  onSendMessage,
}: MessageModalProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [messages, isOpen])

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isOpen])

  // Mark messages as read when viewing
  useEffect(() => {
    if (isOpen && !isPortal && messages.some(m => !m.isFromPhotographer && m.status !== 'read')) {
      markMessagesRead(clientId)
    }
  }, [clientId, messages, isPortal, isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || isPending) return

    const content = newMessage.trim()
    setNewMessage('')

    // Optimistic update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      clientId,
      photographerId: '',
      isFromPhotographer: !isPortal,
      messageType: 'text',
      content,
      status: 'sent',
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    }
    setMessages(prev => [...prev, optimisticMessage])

    startTransition(async () => {
      if (onSendMessage) {
        await onSendMessage(content)
      } else {
        const result = await sendMessage({
          clientId,
          content,
          messageType: 'text',
        })

        if (result.success && result.data) {
          setMessages(prev =>
            prev.map(m => (m.id === optimisticMessage.id ? result.data! : m))
          )
        }
      }
    })
  }, [newMessage, isPending, clientId, isPortal, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ''
  messages.forEach(msg => {
    const msgDate = formatDate(msg.createdAt)
    if (msgDate !== currentDate) {
      currentDate = msgDate
      groupedMessages.push({ date: msgDate, messages: [msg] })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg)
    }
  })

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal - Slide from right */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 flex flex-col ${
              isExpanded ? 'w-full md:w-[800px]' : 'w-full md:w-[480px]'
            }`}
          >
            {/* Header */}
            <div className="flex-shrink-0 border-b border-stone-100 bg-white">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-stone-700 to-stone-900 flex items-center justify-center shadow-lg">
                    <span className="text-sm font-semibold text-white">
                      {getInitials(clientName)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-stone-900">{clientName}</h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      {clientEmail && (
                        <a
                          href={`mailto:${clientEmail}`}
                          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                        >
                          <Mail className="w-3 h-3" />
                          <span className="hidden sm:inline">{clientEmail}</span>
                        </a>
                      )}
                      {clientPhone && (
                        <a
                          href={`tel:${clientPhone}`}
                          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          <span className="hidden sm:inline">{clientPhone}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden md:flex p-2 hover:bg-stone-100 rounded-lg transition-colors"
                    title={isExpanded ? 'Minimize' : 'Expand'}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-5 h-5 text-stone-500" />
                    ) : (
                      <Maximize2 className="w-5 h-5 text-stone-500" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-stone-50/50">
              <div className="p-6 space-y-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-stone-400" />
                    </div>
                    <h3 className="text-lg font-medium text-stone-900 mb-2">
                      Start the conversation
                    </h3>
                    <p className="text-sm text-stone-500 max-w-xs">
                      Send a message to {clientName} to begin your conversation.
                    </p>
                  </div>
                ) : (
                  groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Date separator */}
                      <div className="flex items-center justify-center mb-6">
                        <span className="px-3 py-1 bg-white border border-stone-200 rounded-full text-xs font-medium text-stone-500 shadow-sm">
                          {group.date}
                        </span>
                      </div>

                      {/* Messages for this date */}
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {group.messages.map((message, msgIndex) => {
                            const isOwn = isPortal
                              ? !message.isFromPhotographer
                              : message.isFromPhotographer
                            const showAvatar =
                              msgIndex === 0 ||
                              group.messages[msgIndex - 1]?.isFromPhotographer !==
                                message.isFromPhotographer

                            return (
                              <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                              >
                                {/* Avatar placeholder for alignment */}
                                <div className="w-8 flex-shrink-0">
                                  {showAvatar && !isOwn && (
                                    <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center">
                                      <span className="text-xs font-medium text-stone-600">
                                        {getInitials(clientName)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Message bubble */}
                                <div
                                  className={`max-w-[70%] ${
                                    isOwn
                                      ? 'bg-stone-900 text-white rounded-2xl rounded-br-md'
                                      : 'bg-white text-stone-900 rounded-2xl rounded-bl-md shadow-sm border border-stone-100'
                                  } px-4 py-3`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                    {message.content}
                                  </p>
                                  <div
                                    className={`flex items-center gap-1.5 mt-2 ${
                                      isOwn ? 'justify-end' : 'justify-start'
                                    }`}
                                  >
                                    <span
                                      className={`text-[10px] ${
                                        isOwn ? 'text-stone-400' : 'text-stone-400'
                                      }`}
                                    >
                                      {formatTime(message.createdAt)}
                                    </span>
                                    {isOwn && (
                                      <span className="text-stone-400">
                                        {message.status === 'read' ? (
                                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : message.status === 'delivered' ? (
                                          <CheckCheck className="w-3.5 h-3.5" />
                                        ) : (
                                          <Check className="w-3.5 h-3.5" />
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-stone-200 bg-white p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value)
                      // Auto-resize
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${clientName}...`}
                    rows={1}
                    className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-300 focus:bg-white transition-all text-sm"
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px',
                    }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSend}
                  disabled={!newMessage.trim() || isPending}
                  className="flex-shrink-0 p-3 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-stone-900/20"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
              <p className="text-[10px] text-stone-400 mt-2 text-center">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
