'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Image, Loader2, Check, CheckCheck, Bell } from 'lucide-react'
import { type Message } from '@/server/actions/message.actions'
import { sendMessage, markMessagesRead } from '@/server/actions/message.actions'

interface MessageThreadProps {
  clientId: string
  clientName: string
  initialMessages: Message[]
  isPortal?: boolean
  onSendMessage?: (content: string) => Promise<void>
}

export function MessageThread({
  clientId,
  clientName,
  initialMessages,
  isPortal = false,
  onSendMessage,
}: MessageThreadProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isPending, startTransition] = useTransition()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when viewing
  useEffect(() => {
    if (!isPortal && messages.some(m => !m.isFromPhotographer && m.status !== 'read')) {
      markMessagesRead(clientId)
    }
  }, [clientId, messages, isPortal])

  const handleSend = () => {
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
  }

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

  return (
    <div className="flex flex-col h-[500px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-stone-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Date separator */}
              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-stone-200" />
                <span className="text-xs text-stone-400 font-medium">{group.date}</span>
                <div className="flex-1 h-px bg-stone-200" />
              </div>

              {/* Messages for this date */}
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {group.messages.map(message => {
                    const isOwn = isPortal ? !message.isFromPhotographer : message.isFromPhotographer
                    const isSystem = message.messageType === 'system'

                    // System message - centered, special styling
                    if (isSystem) {
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex justify-center my-3"
                        >
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 rounded-full border border-stone-200/60">
                            <Bell className="w-3.5 h-3.5 text-stone-400" />
                            <p className="text-xs text-stone-600 font-medium">
                              {message.content}
                            </p>
                          </div>
                        </motion.div>
                      )
                    }

                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isOwn
                              ? 'bg-stone-900 text-white rounded-br-md'
                              : 'bg-stone-100 text-stone-900 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 ${
                              isOwn ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <span
                              className={`text-xs ${
                                isOwn ? 'text-stone-400' : 'text-stone-500'
                              }`}
                            >
                              {formatTime(message.createdAt)}
                            </span>
                            {isOwn && (
                              <span className="text-stone-400">
                                {message.status === 'read' ? (
                                  <CheckCheck className="w-3.5 h-3.5" />
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

      {/* Input */}
      <div className="border-t border-stone-200 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${clientName}...`}
              rows={1}
              className="w-full px-4 py-2.5 pr-12 border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || isPending}
            className="p-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
