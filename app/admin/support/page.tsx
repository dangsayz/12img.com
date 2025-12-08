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
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-[1400px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Support Messages</h1>
        <p className="text-[#525252] mt-2">Manage user conversations and feedback</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex bg-white border border-[#E5E5E5] overflow-hidden min-h-0">
        {/* Conversations List */}
        <div
          className={`w-full md:w-80 border-r border-[#E5E5E5] flex flex-col ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-2 text-sm text-[#525252]">
              <Inbox className="w-4 h-4" />
              <span>
                {conversations.filter((c) => c.status === 'open').length} open conversations
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-[#525252]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <div className="w-12 h-12 border border-[#E5E5E5] flex items-center justify-center mb-3">
                  <MessageCircle className="w-6 h-6 text-[#525252]" />
                </div>
                <p className="text-sm text-[#525252]">No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-[#F5F5F7] transition-colors ${
                      selectedConversation?.id === conv.id ? 'bg-[#F5F5F7]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#141414] truncate">
                            {conv.user_email || 'Unknown User'}
                          </span>
                          {(conv.unread_count ?? 0) > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-[#141414] text-white text-[10px] flex items-center justify-center font-medium">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-sm text-[#525252] truncate mt-0.5">
                            {conv.last_message.sender_type === 'admin' && (
                              <span className="text-[#525252]">You: </span>
                            )}
                            {conv.last_message.message}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-[#525252]">
                          {formatDate(conv.updated_at)}
                        </span>
                        {conv.status === 'resolved' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
              <div className="p-4 border-b border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="md:hidden p-1 hover:bg-[#F5F5F7] transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 border border-[#E5E5E5] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#525252]" />
                    </div>
                    <div>
                      <h3 className="font-medium text-[#141414]">
                        {selectedConversation.user_business_name || selectedConversation.user_email}
                      </h3>
                      {selectedConversation.user_business_name && (
                        <p className="text-sm text-[#525252]">{selectedConversation.user_email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleStatusChange(
                        selectedConversation.status === 'open' ? 'resolved' : 'open'
                      )
                    }
                    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedConversation.status === 'open'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    {selectedConversation.status === 'open' ? 'Mark Resolved' : 'Reopen'}
                  </button>
                </div>
                
                {/* User Details Bar */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#525252] pt-2 border-t border-[#E5E5E5]">
                  {selectedConversation.user_plan && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="capitalize font-medium text-[#141414]">
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
                    className="flex items-center gap-1 text-[#141414] font-medium border-b border-[#141414] pb-0.5 hover:text-[#525252] hover:border-[#525252] transition-colors ml-auto"
                  >
                    <span>View in Admin</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F5F5F7]">
                {isLoadingConversation ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin text-[#525252]" />
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
                          className={`max-w-[70%] px-4 py-2.5 text-sm ${
                            msg.sender_type === 'admin'
                              ? 'bg-[#141414] text-white'
                              : 'bg-white text-[#141414] border border-[#E5E5E5]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              msg.sender_type === 'admin' ? 'text-white/50' : 'text-[#525252]'
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
              <div className="p-4 border-t border-[#E5E5E5] bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply..."
                    rows={1}
                    className="flex-1 resize-none border border-[#E5E5E5] px-4 py-3 text-sm focus:outline-none focus:border-[#141414] transition-colors max-h-32"
                    style={{ minHeight: '46px' }}
                  />
                  <motion.button
                    onClick={handleSendReply}
                    disabled={!input.trim() || isSending}
                    className="flex items-center justify-center w-11 h-11 bg-[#141414] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black transition-colors"
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
              <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-[#525252]" />
              </div>
              <h3 className="font-serif text-2xl text-[#141414] mb-2">Select a conversation</h3>
              <p className="text-[#525252]">
                Choose a conversation from the list to view messages and reply
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
