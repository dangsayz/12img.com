'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
  ArrowRight,
  X,
  Trash2,
  Loader2,
} from 'lucide-react'
import { type ClientWithStats, CONTRACT_STATUS_CONFIG, EVENT_TYPE_LABELS } from '@/lib/contracts/types'
import { parseLocalDate } from '@/lib/contracts/merge-fields'
import { CreateClientModal } from './CreateClientModal'
import { OnboardingHint, FeatureBanner } from '@/components/onboarding'
import { checkContractLimits, type ContractLimitStatus } from '@/server/actions/contract.actions'
import { archiveClientProfile } from '@/server/actions/client.actions'
import { useRouter } from 'next/navigation'

interface ClientsPageContentProps {
  clients: ClientWithStats[]
}

export function ClientsPageContent({ clients }: ClientsPageContentProps) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [contractLimits, setContractLimits] = useState<ContractLimitStatus | null>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'needs_attention'>('all')

  // Check if user came from "New Contract" button - only once on mount
  const hasHandledNewParam = useState(() => {
    // Check on initial render only
    if (typeof window !== 'undefined' && searchParams.get('new') === 'true') {
      window.history.replaceState({}, '', '/dashboard/clients')
      return true
    }
    return false
  })[0]

  useEffect(() => {
    if (hasHandledNewParam) {
      handleNewContract()
    }
  }, [hasHandledNewParam])

  // Check contract limits and show appropriate modal
  const handleNewContract = async () => {
    const result = await checkContractLimits()
    if (result.success && result.data) {
      setContractLimits(result.data)
      if (result.data.canCreate) {
        setShowCreateModal(true)
      } else {
        setShowUpgradeModal(true)
      }
    } else {
      // If check fails, still try to show modal (will fail on submit with proper error)
      setShowCreateModal(true)
    }
  }

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
      const eventDate = parseLocalDate(client.eventDate)
      if (!eventDate) return false
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
      const eventDate = parseLocalDate(c.eventDate)
      if (!eventDate) return false
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
      {/* Onboarding Tour */}
      <OnboardingHint section="clients" />

      {/* Header */}
      <div className="flex items-center justify-between mb-8" data-onboarding="clients-header">
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
          onClick={handleNewContract}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
          data-onboarding="clients-add"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Client</span>
        </button>
      </div>

      {/* First-time user hint */}
      <FeatureBanner
        id="clients-getting-started"
        title="Getting Started with Clients"
        description="Add a client, send them a contract, and they'll get a secure portal link to sign, message you, and track their project — all in one place."
        icon={<Users className="w-5 h-5 text-white" />}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6" data-onboarding="clients-stats">
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
      <div className="relative mb-6" data-onboarding="clients-search">
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
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden" data-onboarding="clients-list">
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

      {/* Upgrade Modal - Contract Limit Reached */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="relative px-8 pt-8 pb-6 text-center border-b border-stone-100">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Custom Arrow Up Icon */}
                <div className="w-14 h-14 bg-stone-900 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M12 19V5M12 5L5 12M12 5L19 12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-2">
                  Contract Limit Reached
                </p>
                <h2 className="text-xl font-light text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                  Upgrade Your Plan
                </h2>
              </div>

              {/* Content */}
              <div className="px-8 py-6">
                <p className="text-center text-stone-600 mb-6">
                  You've used <span className="font-semibold text-stone-900">{contractLimits?.currentCount || 0}</span> of{' '}
                  <span className="font-semibold text-stone-900">
                    {contractLimits?.limit === 'unlimited' ? 'unlimited' : contractLimits?.limit || 1}
                  </span>{' '}
                  contracts this month on the{' '}
                  <span className="font-semibold text-stone-900 capitalize">{contractLimits?.plan || 'Free'}</span> plan.
                </p>

                <div className="bg-stone-50 p-4 mb-6">
                  <p className="text-sm font-medium text-stone-700 mb-3">Upgrade to get more contracts:</p>
                  <ul className="text-sm text-stone-600 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-stone-400 rounded-full" />
                      Essential: 5 contracts/month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-stone-400 rounded-full" />
                      Pro: 15 contracts/month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-stone-400 rounded-full" />
                      Studio: 50 contracts/month
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-stone-400 rounded-full" />
                      Elite: Unlimited contracts
                    </li>
                  </ul>
                </div>

                <Link
                  href="/pricing"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-stone-900 text-white text-sm tracking-[0.1em] uppercase font-medium hover:bg-black transition-colors"
                >
                  View Plans
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ClientRow({ client }: { client: ClientWithStats }) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const eventDate = parseLocalDate(client.eventDate)
  const isUpcoming = eventDate && eventDate >= new Date()
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const statusConfig = client.contractStatus
    ? CONTRACT_STATUS_CONFIG[client.contractStatus]
    : null

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    const result = await archiveClientProfile(client.id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error?.message || 'Failed to delete client')
    }
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Link
          href={`/dashboard/clients/${client.id}`}
          className="flex items-center gap-3 sm:gap-4 p-4 hover:bg-stone-50 transition-colors group active:bg-stone-100"
        >
          {/* Avatar */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
            <span className="text-base sm:text-lg font-medium text-stone-600">
              {client.firstName[0]}
              {client.lastName[0]}
            </span>
          </div>

          {/* Info - Mobile optimized */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-stone-900 truncate text-[15px] sm:text-base">
                {client.firstName}
                {client.partnerFirstName && (
                  <span className="text-stone-400 font-normal"> & {client.partnerFirstName}</span>
                )}
              </h3>
              {client.unreadMessages > 0 && (
                <span className="w-5 h-5 text-[11px] font-semibold bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                  {client.unreadMessages}
                </span>
              )}
            </div>
            {/* Mobile: single line with email only, truncated */}
            <p className="text-sm text-stone-500 truncate mt-0.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 text-stone-400" />
              <span className="truncate">{client.email}</span>
            </p>
          </div>

          {/* Right side - Phone on mobile, more info on desktop */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Phone - compact on mobile */}
            {client.phone && (
              <div className="text-right hidden xs:block sm:hidden">
                <p className="text-xs text-stone-400 tabular-nums">{client.phone}</p>
              </div>
            )}
            
            {/* Desktop: Event Info + Phone */}
            <div className="hidden sm:block text-right min-w-[100px]">
              <p className="text-sm font-medium text-stone-700">
                {EVENT_TYPE_LABELS[client.eventType]}
              </p>
              {eventDate && (
                <p className="text-xs text-stone-500">
                  {eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                  {isUpcoming && daysUntil !== null && daysUntil <= 30 && (
                    <span className="ml-1 text-amber-600">({daysUntil}d)</span>
                  )}
                </p>
              )}
            </div>

            {/* Contract Status - Desktop only */}
            <div className="hidden md:block min-w-[90px]">
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

            {/* Delete Button - appears on hover */}
            <button
              onClick={handleDelete}
              className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Remove client"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Arrow */}
            <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors flex-shrink-0" />
          </div>
        </Link>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm p-6 shadow-2xl rounded-2xl"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 text-center mb-2">
                Remove Client?
              </h3>
              <p className="text-sm text-stone-500 text-center mb-6">
                <span className="font-medium text-stone-700">{client.firstName} {client.lastName}</span> and all associated contracts will be archived. This action can be undone from settings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
