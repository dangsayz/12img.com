'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  Calendar,
  CreditCard,
  ExternalLink,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  MoreHorizontal,
  X,
  ChevronDown,
} from 'lucide-react'
import Link from 'next/link'
import {
  getAllConversations,
  getConversationById,
  getConversationCounts,
  sendAdminReply,
  updateConversationStatus,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  type SupportConversation,
  type SupportMessage,
  type ConversationFilter,
} from '@/server/actions/support.actions'

const TABS: { key: ConversationFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'archived', label: 'Archived' },
]

const PAGE_SIZE = 50

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<SupportConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingConversation, setIsLoadingConversation] = useState(false)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ConversationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [counts, setCounts] = useState({ all: 0, open: 0, resolved: 0, archived: 0 })
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load conversations when filter or search changes
  useEffect(() => {
    setPage(1)
    setConversations([])
    loadConversations(1, true)
  }, [activeFilter, debouncedSearch])

  // Load counts on mount
  useEffect(() => {
    loadCounts()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConversation?.messages])

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMoreConversations()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [hasMore, isLoadingMore])

  const loadCounts = async () => {
    const result = await getConversationCounts()
    if (result.success && result.counts) {
      setCounts(result.counts)
    }
  }

  const loadConversations = async (pageNum: number = 1, reset: boolean = false) => {
    if (reset) setIsLoading(true)
    
    const result = await getAllConversations({
      filter: activeFilter,
      page: pageNum,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
    })
    
    if (result.success) {
      if (reset) {
        setConversations(result.conversations || [])
      } else {
        setConversations(prev => [...prev, ...(result.conversations || [])])
      }
      setHasMore(result.hasMore || false)
      setTotal(result.total || 0)
    }
    
    setIsLoading(false)
  }

  const loadMoreConversations = async () => {
    if (isLoadingMore || !hasMore) return
    
    setIsLoadingMore(true)
    const nextPage = page + 1
    setPage(nextPage)
    
    const result = await getAllConversations({
      filter: activeFilter,
      page: nextPage,
      pageSize: PAGE_SIZE,
      search: debouncedSearch || undefined,
    })
    
    if (result.success) {
      setConversations(prev => [...prev, ...(result.conversations || [])])
      setHasMore(result.hasMore || false)
    }
    
    setIsLoadingMore(false)
  }

  const selectConversation = async (id: string) => {
    setIsLoadingConversation(true)
    setContextMenuId(null)
    
    const result = await getConversationById(id)
    if (result.success && result.conversation) {
      setSelectedConversation(result.conversation)
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
      loadCounts()
    }
  }

  const [isArchiving, setIsArchiving] = useState(false)
  
  const handleArchive = async (id: string) => {
    setIsArchiving(true)
    const result = await archiveConversation(id)
    if (result.success) {
      // Remove from list if not viewing archived
      if (activeFilter !== 'archived') {
        setConversations(prev => prev.filter(c => c.id !== id))
      }
      if (selectedConversation?.id === id) {
        setSelectedConversation(null)
      }
      loadCounts()
    } else {
      console.error('Archive failed:', result.error)
    }
    setIsArchiving(false)
    setContextMenuId(null)
  }

  const handleUnarchive = async (id: string) => {
    const result = await unarchiveConversation(id)
    if (result.success) {
      // Remove from archived view
      if (activeFilter === 'archived') {
        setConversations(prev => prev.filter(c => c.id !== id))
      }
      if (selectedConversation?.id === id) {
        setSelectedConversation(prev => prev ? { ...prev, status: 'resolved' } : null)
      }
      loadCounts()
    }
    setContextMenuId(null)
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    const result = await deleteConversation(id)
    if (result.success) {
      setConversations(prev => prev.filter(c => c.id !== id))
      if (selectedConversation?.id === id) {
        setSelectedConversation(null)
      }
      loadCounts()
    }
    setIsDeleting(false)
    setDeleteConfirmId(null)
    setContextMenuId(null)
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
    <div className="h-[calc(100vh-140px)] flex flex-col max-w-[1400px]">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h1 className="font-serif text-2xl lg:text-3xl text-[#141414]">Support Messages</h1>
        <p className="text-[#525252] text-sm mt-1">Manage user conversations and feedback</p>
      </div>

      {/* Main Content - Takes remaining height */}
      <div className="flex-1 flex bg-white border border-[#E5E5E5] overflow-hidden min-h-[600px]">
        {/* Conversations List */}
        <div
          className={`w-full md:w-96 border-r border-[#E5E5E5] flex flex-col ${
            selectedConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Tabs - Scrollable on mobile */}
          <div className="border-b border-[#E5E5E5] overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`flex-1 min-w-[80px] px-4 py-3.5 text-xs font-medium transition-colors relative ${
                    activeFilter === tab.key
                      ? 'text-[#141414]'
                      : 'text-[#737373] hover:text-[#525252] active:text-[#525252]'
                  }`}
                >
                  <span>{tab.label}</span>
                  {counts[tab.key] > 0 && (
                    <span className={`ml-1.5 ${activeFilter === tab.key ? 'text-[#141414]' : 'text-[#A3A3A3]'}`}>
                      {counts[tab.key]}
                    </span>
                  )}
                  {activeFilter === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-[#E5E5E5]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#F5F5F7] rounded"
                >
                  <X className="w-3 h-3 text-[#737373]" />
                </button>
              )}
            </div>
            {total > 0 && (
              <p className="text-[10px] text-[#A3A3A3] mt-2">
                {total} conversation{total !== 1 ? 's' : ''}
                {debouncedSearch && ` matching "${debouncedSearch}"`}
              </p>
            )}
          </div>

          {/* Conversation List with Infinite Scroll */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-[#525252]" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                <div className="w-12 h-12 border border-[#E5E5E5] flex items-center justify-center mb-3">
                  {activeFilter === 'archived' ? (
                    <Archive className="w-6 h-6 text-[#525252]" />
                  ) : (
                    <MessageCircle className="w-6 h-6 text-[#525252]" />
                  )}
                </div>
                <p className="text-sm text-[#525252]">
                  {debouncedSearch 
                    ? 'No conversations found' 
                    : activeFilter === 'archived' 
                      ? 'No archived conversations'
                      : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`relative group ${
                      selectedConversation?.id === conv.id ? 'bg-[#F5F5F7]' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <button
                      onClick={() => selectConversation(conv.id)}
                      className="w-full p-4 text-left transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#141414] truncate text-sm">
                              {conv.user_email || 'Unknown User'}
                            </span>
                            {(conv.unread_count ?? 0) > 0 && (
                              <span className="flex-shrink-0 w-5 h-5 bg-[#141414] text-white text-[10px] flex items-center justify-center font-medium">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          {conv.last_message && (
                            <p className="text-xs text-[#737373] truncate mt-1">
                              {conv.last_message.sender_type === 'admin' && (
                                <span className="text-[#525252]">You: </span>
                              )}
                              {conv.last_message.message}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] text-[#A3A3A3]">
                            {formatDate(conv.updated_at)}
                          </span>
                          {conv.status === 'archived' ? (
                            <Archive className="w-3.5 h-3.5 text-[#A3A3A3]" />
                          ) : conv.status === 'resolved' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {/* Context Menu Button - Always visible on mobile, hover on desktop */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setContextMenuId(contextMenuId === conv.id ? null : conv.id)
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center md:w-8 md:h-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-[#E5E5E5] active:bg-[#D4D4D4] rounded-lg transition-all"
                    >
                      <MoreHorizontal className="w-5 h-5 md:w-4 md:h-4 text-[#737373]" />
                    </button>
                    
                    {/* Context Menu Dropdown */}
                    <AnimatePresence>
                      {contextMenuId === conv.id && (
                        <>
                          {/* Backdrop to close menu */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setContextMenuId(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            className="absolute right-2 top-14 z-50 bg-white border border-[#E5E5E5] shadow-lg py-1 min-w-[160px] rounded-lg"
                          >
                            {conv.status === 'archived' ? (
                              <button
                                onClick={() => handleUnarchive(conv.id)}
                                className="w-full px-4 py-3 text-left text-sm text-[#525252] hover:bg-[#F5F5F7] active:bg-[#E5E5E5] flex items-center gap-3"
                              >
                                <ArchiveRestore className="w-5 h-5" />
                                Unarchive
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchive(conv.id)}
                                className="w-full px-4 py-3 text-left text-sm text-[#525252] hover:bg-[#F5F5F7] active:bg-[#E5E5E5] flex items-center gap-3"
                              >
                                <Archive className="w-5 h-5" />
                                Archive
                              </button>
                            )}
                            <button
                              onClick={() => setDeleteConfirmId(conv.id)}
                              className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 active:bg-red-100 flex items-center gap-3"
                            >
                              <Trash2 className="w-5 h-5" />
                              Delete
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                
                {/* Load More Trigger */}
                <div ref={loadMoreRef} className="h-1" />
                
                {/* Loading More Indicator */}
                {isLoadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#525252]" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Delete Confirmation Modal - Mobile optimized */}
        <AnimatePresence>
          {deleteConfirmId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50"
              onClick={() => setDeleteConfirmId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white p-6 w-full md:max-w-sm md:mx-4 shadow-xl rounded-t-2xl md:rounded-xl"
              >
                <h3 className="font-medium text-[#141414] text-lg mb-2">Delete Conversation?</h3>
                <p className="text-sm text-[#525252] mb-6">
                  This will permanently delete this conversation and all messages. This action cannot be undone.
                </p>
                <div className="flex flex-col-reverse md:flex-row gap-3 md:justify-end">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="w-full md:w-auto px-4 py-3 md:py-2 text-sm text-[#525252] hover:text-[#141414] active:bg-[#F5F5F7] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    disabled={isDeleting}
                    className="w-full md:w-auto px-4 py-3 md:py-2 text-sm bg-red-600 text-white hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Delete Conversation
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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
                  <div className="flex items-center gap-2">
                    {selectedConversation.status !== 'archived' && (
                      <button
                        onClick={() => handleArchive(selectedConversation.id)}
                        disabled={isArchiving}
                        className="p-2 text-[#737373] hover:text-[#141414] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
                        title="Archive conversation"
                      >
                        {isArchiving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Archive className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {selectedConversation.status === 'archived' ? (
                      <button
                        onClick={() => handleUnarchive(selectedConversation.id)}
                        className="px-3 py-1.5 text-sm font-medium border border-[#E5E5E5] bg-white text-[#525252] hover:bg-[#F5F5F7] transition-colors flex items-center gap-1.5"
                      >
                        <ArchiveRestore className="w-4 h-4" />
                        Unarchive
                      </button>
                    ) : (
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
                    )}
                  </div>
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
