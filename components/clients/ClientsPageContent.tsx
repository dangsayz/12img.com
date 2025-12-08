'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Mail,
  Phone,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react'
import { type ClientWithStats, CONTRACT_STATUS_CONFIG, EVENT_TYPE_LABELS } from '@/lib/contracts/types'
import { CreateClientModal } from './CreateClientModal'

interface ClientsPageContentProps {
  clients: ClientWithStats[]
}

export function ClientsPageContent({ clients }: ClientsPageContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'needs_attention'>('all')

  const filteredClients = clients.filter(client => {
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      !searchQuery ||
      client.firstName.toLowerCase().includes(searchLower) ||
      client.lastName.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)

    if (!matchesSearch) return false

    // Status filter
    if (filter === 'upcoming') {
      if (!client.eventDate) return false
      const eventDate = new Date(client.eventDate)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      return eventDate >= now && eventDate <= thirtyDaysFromNow
    }

    if (filter === 'needs_attention') {
      return (
        client.unreadMessages > 0 ||
        client.contractStatus === 'sent' ||
        client.contractStatus === 'viewed'
      )
    }

    return true
  })

  const stats = {
    total: clients.length,
    upcoming: clients.filter(c => {
      if (!c.eventDate) return false
      const eventDate = new Date(c.eventDate)
      const now = new Date()
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      return eventDate >= now && eventDate <= thirtyDaysFromNow
    }).length,
    needsAttention: clients.filter(
      c => c.unreadMessages > 0 || c.contractStatus === 'sent' || c.contractStatus === 'viewed'
    ).length,
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 -ml-1.5 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-light text-stone-900">Clients</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Client</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filter === 'all'
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <Users className={`w-5 h-5 mb-2 ${filter === 'all' ? 'text-white' : 'text-stone-400'}`} />
          <p className={`text-2xl font-light ${filter === 'all' ? 'text-white' : 'text-stone-900'}`}>
            {stats.total}
          </p>
          <p className={`text-xs ${filter === 'all' ? 'text-stone-300' : 'text-stone-500'}`}>
            Total Clients
          </p>
        </button>

        <button
          onClick={() => setFilter('upcoming')}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filter === 'upcoming'
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <Calendar className={`w-5 h-5 mb-2 ${filter === 'upcoming' ? 'text-white' : 'text-stone-400'}`} />
          <p className={`text-2xl font-light ${filter === 'upcoming' ? 'text-white' : 'text-stone-900'}`}>
            {stats.upcoming}
          </p>
          <p className={`text-xs ${filter === 'upcoming' ? 'text-stone-300' : 'text-stone-500'}`}>
            Upcoming Events
          </p>
        </button>

        <button
          onClick={() => setFilter('needs_attention')}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filter === 'needs_attention'
              ? 'border-stone-900 bg-stone-900 text-white'
              : 'border-stone-200 bg-white hover:border-stone-300'
          }`}
        >
          <MessageSquare
            className={`w-5 h-5 mb-2 ${filter === 'needs_attention' ? 'text-white' : 'text-amber-500'}`}
          />
          <p className={`text-2xl font-light ${filter === 'needs_attention' ? 'text-white' : 'text-stone-900'}`}>
            {stats.needsAttention}
          </p>
          <p className={`text-xs ${filter === 'needs_attention' ? 'text-stone-300' : 'text-stone-500'}`}>
            Needs Attention
          </p>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
        />
      </div>

      {/* Client List */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">
              {searchQuery ? 'No clients match your search' : 'No clients yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-sm text-stone-900 underline hover:no-underline"
              >
                Add your first client
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            <AnimatePresence mode="popLayout">
              {filteredClients.map(client => (
                <ClientRow key={client.id} client={client} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateClientModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </>
  )
}

function ClientRow({ client }: { client: ClientWithStats }) {
  const eventDate = client.eventDate ? new Date(client.eventDate) : null
  const isUpcoming = eventDate && eventDate >= new Date()
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const statusConfig = client.contractStatus
    ? CONTRACT_STATUS_CONFIG[client.contractStatus]
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Link
        href={`/dashboard/clients/${client.id}`}
        className="flex items-center gap-4 p-4 hover:bg-stone-50 transition-colors group"
      >
        {/* Avatar */}
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
          <span className="text-lg font-medium text-stone-600">
            {client.firstName[0]}
            {client.lastName[0]}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-stone-900 truncate">
              {client.firstName} {client.lastName}
              {client.partnerFirstName && (
                <span className="text-stone-500"> & {client.partnerFirstName}</span>
              )}
            </h3>
            {client.unreadMessages > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                {client.unreadMessages}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-stone-500">
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {client.email}
            </span>
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {client.phone}
              </span>
            )}
          </div>
        </div>

        {/* Event Info */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-stone-700">
            {EVENT_TYPE_LABELS[client.eventType]}
          </p>
          {eventDate && (
            <p className="text-xs text-stone-500">
              {eventDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {isUpcoming && daysUntil !== null && daysUntil <= 30 && (
                <span className="ml-1 text-amber-600">({daysUntil}d)</span>
              )}
            </p>
          )}
        </div>

        {/* Contract Status */}
        <div className="hidden md:block">
          {statusConfig ? (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              <FileText className="w-3 h-3" />
              {statusConfig.label}
            </span>
          ) : (
            <span className="text-xs text-stone-400">No contract</span>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors" />
      </Link>
    </motion.div>
  )
}
