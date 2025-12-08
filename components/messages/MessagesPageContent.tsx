'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageSquare, ChevronRight, User } from 'lucide-react'
import { type MessageThread } from '@/server/actions/message.actions'

interface MessagesPageContentProps {
  threads: MessageThread[]
}

export function MessagesPageContent({ threads }: MessagesPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredThreads = threads.filter(thread => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      thread.clientName.toLowerCase().includes(searchLower) ||
      thread.clientEmail.toLowerCase().includes(searchLower)
    )
  })

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-stone-900">Messages</h1>
          <p className="text-sm text-stone-500 mt-1">
            {totalUnread > 0
              ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
        />
      </div>

      {/* Thread List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {filteredThreads.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">
              {searchQuery ? 'No conversations match your search' : 'No messages yet'}
            </p>
            {!searchQuery && (
              <p className="text-sm text-stone-400 mt-2">
                Messages will appear here when you start chatting with clients
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <AnimatePresence mode="popLayout">
              {filteredThreads.map(thread => (
                <ThreadRow key={thread.clientId} thread={thread} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </>
  )
}

function ThreadRow({ thread }: { thread: MessageThread }) {
  const timeAgo = getTimeAgo(thread.lastMessageAt)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Link
        href={`/dashboard/clients/${thread.clientId}?tab=messages`}
        className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors group"
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-medium text-stone-600">
              {thread.clientName
                .split(' ')
                .map(n => n[0])
                .join('')
                .slice(0, 2)}
            </span>
          </div>
          {thread.unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3
              className={`font-medium truncate ${
                thread.unreadCount > 0 ? 'text-stone-900' : 'text-stone-700'
              }`}
            >
              {thread.clientName}
            </h3>
            <span className="text-xs text-stone-400 flex-shrink-0">{timeAgo}</span>
          </div>
          <p
            className={`text-sm truncate mt-0.5 ${
              thread.unreadCount > 0 ? 'text-stone-700 font-medium' : 'text-stone-500'
            }`}
          >
            {thread.isFromPhotographer && <span className="text-stone-400">You: </span>}
            {thread.lastMessage}
          </p>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
      </Link>
    </motion.div>
  )
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}d`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
