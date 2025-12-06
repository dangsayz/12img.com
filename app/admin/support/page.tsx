'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Inbox,
  Clock,
  User,
  Building2,
  Calendar,
  CreditCard,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import {
  getAllConversations,
  getConversationById,
  sendAdminReply,
  updateConversationStatus,
  type SupportConversation,
  type SupportMessage,
} from '@/server/actions/support.actions'

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  const loadConversations = async () => {
    setIsLoading(true)
    const result = await getAllConversations()
    if (result.success) {
      setConversations(result.conversations || [])
    }
    setIsLoading(false)
  }

  const selectConversation = async (id: string) => {
    setIsLoadingConversation(true)
    const result = await getConversationById(id)
    if (result.success && result.conversation) {
      setSelectedConversation(result.conversation)
      // Update the conversation in the list to clear unread count
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
      )
    }
    setIsLoadingConversation(false)
  }

  const handleSendReply = async () => {
    if (!input.trim() || !selectedConversation || isSending) return

    const messageText = input.trim()
    setInput('')
    setIsSending(true)

    const result = await sendAdminReply(selectedConversation.id, messageText)

    if (result.success && result.message) {
      setSelectedConversation((prev) =>
        prev
          ? {
              ...prev,
              messages: [...(prev.messages || []), result.message!],
            }
          : null
      )
    } else {
      setInput(messageText)
    }

    setIsSending(false)
  }

  const handleStatusChange = async (status: 'open' | 'resolved') => {
    if (!selectedConversation) return

    const result = await updateConversationStatus(selectedConversation.id, status)
    if (result.success) {
      setSelectedConversation((prev) => (prev ? { ...prev, status } : null))
      setConversations((prev) =>
        prev.map((c) => (c.id === selectedConversation.id ? { ...c, status } : c))
      )
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendReply()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' })
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Support Messages</h1>
        <p className="text-sm text-gray-500 mt-1">Manage user conversations and feedback</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex bg-white rounded-2xl border border-gray-200 overflow-hidden min-h-0">
        {/* Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-gray-200 flex flex-col ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Inbox className="w-4 h-4" />
              <span>
                {conversations.filter((c) => c.status === 'open').length} open conversations
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {conv.user_email || 'Unknown User'}
                          </span>
                          {(conv.unread_count ?? 0) > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-medium">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {conv.last_message.sender_type === 'admin' && (
                              <span className="text-gray-400">You: </span>
                            )}
                            {conv.last_message.message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-gray-400">
                          {formatDate(conv.updated_at)}
                        </span>
                        {conv.status === 'resolved' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Detail */}
        <div
          className={`flex-1 flex flex-col ${
            selectedConversation ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedConversation.user_business_name || selectedConversation.user_email}
                      </h3>
                      {selectedConversation.user_business_name && (
                        <p className="text-sm text-gray-500">{selectedConversation.user_email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedConversation.status === 'open' ? 'resolved' : 'open'
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedConversation.status === 'open'
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {selectedConversation.status === 'open' ? 'Mark Resolved' : 'Reopen'}
                  </button>
                </div>
                
                {/* User Details Bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                  {selectedConversation.user_plan && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="capitalize font-medium text-gray-700">
                        {selectedConversation.user_plan} Plan
                      </span>
                    </div>
                  )}
                  {selectedConversation.user_joined_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Joined {new Date(selectedConversation.user_joined_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Started {formatDate(selectedConversation.created_at)}</span>
                  </div>
                  <Link
                    href={`/admin/users?search=${encodeURIComponent(selectedConversation.user_email || '')}`}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline ml-auto"
                  >
                    <span>View in Admin</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                {isLoadingConversation ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {selectedConversation.messages?.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${
                          msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                            msg.sender_type === 'admin'
                              ? 'bg-gray-900 text-white rounded-br-md'
                              : 'bg-white text-gray-900 rounded-bl-md shadow-sm border border-gray-100'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.sender_type === 'admin' ? 'text-white/50' : 'text-gray-400'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all max-h-32"
                    style={{ minHeight: '46px' }}
                  />
                  <motion.button
                    onClick={handleSendReply}
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
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select a conversation</h3>
              <p className="text-sm text-gray-500">
                Choose a conversation from the list to view messages and reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
