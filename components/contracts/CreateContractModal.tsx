'use client'

import { useState, useTransition, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Wand2,
  Calendar,
  MapPin,
  Building2,
  Package,
  Lightbulb,
  Heart,
  Camera,
  Clock,
  DollarSign,
  X,
} from 'lucide-react'
import { type ClientProfile, EVENT_TYPE_LABELS, CLAUSE_CATEGORY_LABELS } from '@/lib/contracts/types'
import { getClausesForEventType, EVENT_TYPE_DEFAULTS, type ClauseTemplate } from '@/lib/contracts/event-clauses'
import { createContract } from '@/server/actions/contract.actions'

interface CreateContractModalProps {
  isOpen: boolean
  onClose: () => void
  client: ClientProfile
}

interface ClauseState {
  id: string
  enabled: boolean
}

// Hints for first-time users
const HINTS = [
  {
    icon: Check,
    title: 'Select Clauses',
    description: 'Choose which terms to include. Required clauses are pre-selected.',
  },
  {
    icon: FileText,
    title: 'Auto-Filled Details',
    description: 'Client info and package details are pulled from their profile.',
  },
  {
    icon: Wand2,
    title: 'Smart Defaults',
    description: 'Clauses are pre-configured based on the event type.',
  },
]

// Event type icons and colors
const EVENT_TYPE_CONFIG: Record<string, { icon: typeof Heart; color: string; bg: string }> = {
  wedding: { icon: Heart, color: 'text-rose-600', bg: 'bg-rose-50' },
  engagement: { icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
  portrait: { icon: Camera, color: 'text-violet-600', bg: 'bg-violet-50' },
  family: { icon: Heart, color: 'text-amber-600', bg: 'bg-amber-50' },
  newborn: { icon: Heart, color: 'text-sky-600', bg: 'bg-sky-50' },
  maternity: { icon: Heart, color: 'text-purple-600', bg: 'bg-purple-50' },
  corporate: { icon: Camera, color: 'text-slate-600', bg: 'bg-slate-50' },
  event: { icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  other: { icon: Camera, color: 'text-stone-600', bg: 'bg-stone-50' },
}

// Countdown component built into the modal for better control
function CompactCountdown({ eventDate }: { eventDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = eventDate.getTime() - Date.now()
    return {
      days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
      hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
      mins: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
    }
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = eventDate.getTime() - Date.now()
      setTimeLeft({
        days: Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24))),
        hours: Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24)),
        mins: Math.max(0, Math.floor((diff / 1000 / 60) % 60)),
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [eventDate])

  if (timeLeft.days <= 0 && timeLeft.hours <= 0) {
    return (
      <div className="text-center py-3">
        <span className="text-emerald-600 font-medium">Event day!</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-3">
      <div className="text-center">
        <div className="text-3xl font-extralight text-stone-900 tabular-nums">{timeLeft.days}</div>
        <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Days</div>
      </div>
      <div className="text-stone-300 text-xl font-light">:</div>
      <div className="text-center">
        <div className="text-3xl font-extralight text-stone-900 tabular-nums">{String(timeLeft.hours).padStart(2, '0')}</div>
        <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Hours</div>
      </div>
      <div className="text-stone-300 text-xl font-light">:</div>
      <div className="text-center">
        <div className="text-3xl font-extralight text-stone-900 tabular-nums">{String(timeLeft.mins).padStart(2, '0')}</div>
        <div className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">Mins</div>
      </div>
    </div>
  )
}

export function CreateContractModal({ isOpen, onClose, client }: CreateContractModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['payment', 'copyright', 'liability']))
  const [showHints, setShowHints] = useState(false)
  
  // Check if this is the first time creating a contract
  useEffect(() => {
    if (isOpen) {
      const hasSeenHints = localStorage.getItem('create-contract-hints-seen')
      if (!hasSeenHints) {
        setShowHints(true)
      }
    }
  }, [isOpen])
  
  const dismissHints = () => {
    localStorage.setItem('create-contract-hints-seen', 'true')
    setShowHints(false)
  }
  
  // Get clauses for this event type
  const availableClauses = useMemo(() => 
    getClausesForEventType(client.eventType), 
    [client.eventType]
  )
  
  // Initialize clause states - required clauses are enabled by default
  const [clauseStates, setClauseStates] = useState<ClauseState[]>(() =>
    availableClauses.map(clause => ({
      id: clause.id,
      enabled: clause.isRequired,
    }))
  )

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setClauseStates(
        availableClauses.map(clause => ({
          id: clause.id,
          enabled: clause.isRequired,
        }))
      )
      setError(null)
      setExpandedCategories(new Set(['payment', 'copyright', 'liability']))
    }
  }, [isOpen, availableClauses])

  // Group clauses by category
  const clausesByCategory = useMemo(() => {
    const grouped: Record<string, ClauseTemplate[]> = {}
    availableClauses.forEach(clause => {
      if (!grouped[clause.category]) {
        grouped[clause.category] = []
      }
      grouped[clause.category].push(clause)
    })
    return grouped
  }, [availableClauses])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const toggleClause = (clauseId: string, isRequired: boolean) => {
    if (isRequired) return // Can't toggle required clauses
    
    setClauseStates(prev =>
      prev.map(state =>
        state.id === clauseId ? { ...state, enabled: !state.enabled } : state
      )
    )
  }

  const enabledClauseIds = clauseStates.filter(s => s.enabled).map(s => s.id)
  const enabledCount = enabledClauseIds.length
  const requiredCount = availableClauses.filter(c => c.isRequired).length

  const handleCreateContract = () => {
    setError(null)
    
    startTransition(async () => {
      const result = await createContract({
        clientId: client.id,
        templateClauseIds: enabledClauseIds,
        mergeDataOverrides: {
          delivery_weeks: EVENT_TYPE_DEFAULTS[client.eventType]?.deliveryWeeks || '2-3',
          estimated_images: EVENT_TYPE_DEFAULTS[client.eventType]?.estimatedImages || '50-100',
          retainer_amount: EVENT_TYPE_DEFAULTS[client.eventType]?.retainerAmount || '50%',
        },
      })

      if (!result.success) {
        setError(result.error?.message || 'Failed to create contract')
        return
      }

      // Refresh the page data first so the client detail page shows the new contract
      router.refresh()
      
      // Close modal and navigate to the contract detail page
      onClose()
      router.push(`/dashboard/contracts/${result.data?.id}`)
    })
  }

  const eventDate = client.eventDate ? new Date(client.eventDate) : null
  const clientName = `${client.firstName}${client.partnerFirstName ? ` & ${client.partnerFirstName}` : ` ${client.lastName}`}`
  const eventConfig = EVENT_TYPE_CONFIG[client.eventType] || EVENT_TYPE_CONFIG.other
  const EventIcon = eventConfig.icon

  // Calculate days until event
  const daysUntil = eventDate 
    ? Math.max(0, Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-stone-950/20 backdrop-blur-sm" />
      
      {/* Main container */}
      <div className="relative flex-1 flex flex-col bg-gradient-to-b from-stone-50 to-white overflow-hidden">
        {/* First-Time Hints Overlay */}
        <AnimatePresence>
          {showHints && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={dismissHints}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ delay: 0.1 }}
                onClick={e => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Header */}
                <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-8 py-10 text-center">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, white 0%, transparent 50%)' }} />
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-5 ring-1 ring-white/20">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Create Your Contract</h2>
                    <p className="text-stone-400 text-sm">Quick tips to get started</p>
                  </div>
                </div>
                
                {/* Hints */}
                <div className="p-8 space-y-5">
                  {HINTS.map((hint, index) => {
                    const Icon = hint.icon
                    return (
                      <motion.div
                        key={hint.title}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="flex items-start gap-4"
                      >
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 flex items-center justify-center flex-shrink-0 ring-1 ring-stone-200/50">
                          <Icon className="w-5 h-5 text-stone-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-stone-900">{hint.title}</h3>
                          <p className="text-sm text-stone-500 mt-0.5 leading-relaxed">{hint.description}</p>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
                
                {/* Footer */}
                <div className="px-8 py-5 bg-stone-50/80 border-t border-stone-100 flex items-center justify-between">
                  <p className="text-xs text-stone-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    You won't see this again
                  </p>
                  <button
                    onClick={dismissHints}
                    className="px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-all hover:shadow-lg"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Bar */}
        <header className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-stone-200/60 px-4 sm:px-6 py-4">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 -ml-2 hover:bg-stone-100 rounded-xl transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-stone-500 group-hover:text-stone-900 group-hover:-translate-x-0.5 transition-all" />
              </button>
              
              <div className="hidden sm:block w-px h-6 bg-stone-200" />
              
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${eventConfig.bg} flex items-center justify-center`}>
                  <EventIcon className={`w-4.5 h-4.5 ${eventConfig.color}`} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-0.5">Overview</p>
                  <h1 className="text-lg font-semibold text-stone-900">{clientName}</h1>
                </div>
              </div>
            </div>

            {/* Right: Create Button */}
            <button
              onClick={handleCreateContract}
              disabled={isPending || enabledCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="hidden sm:inline">Creating...</span>
                </>
              ) : (
                <>
                  <span className="text-base leading-none">+</span>
                  <span className="hidden sm:inline">Create Contract</span>
                  <span className="sm:hidden">Create</span>
                </>
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Error</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column: Client & Event Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client Hero Card - Light Theme */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-stone-50 to-stone-100 p-6 shadow-sm border border-stone-200/60"
                >
                  {/* Decorative elements */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-stone-200/30 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-stone-200/30 to-transparent rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                  
                  <div className="relative">
                    {/* Client name & type */}
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <p className="text-stone-400 text-xs uppercase tracking-wider mb-1">Client</p>
                        <h2 className="text-xl font-semibold text-stone-900">{clientName}</h2>
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${eventConfig.bg} flex items-center justify-center shadow-sm`}>
                        <EventIcon className={`w-5 h-5 ${eventConfig.color}`} />
                      </div>
                    </div>

                    {/* Event countdown */}
                    {eventDate && daysUntil !== null && daysUntil > 0 && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 mb-5 border border-stone-200/60 shadow-sm">
                        <p className="text-stone-400 text-xs uppercase tracking-wider text-center mb-3">Event Countdown</p>
                        <CompactCountdown eventDate={eventDate} />
                        <p className="text-center text-stone-400 text-xs mt-3">
                          {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    )}

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 gap-3">
                      {client.packageHours && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-stone-200/60 shadow-sm">
                          <div className="flex items-center gap-2 text-stone-400 text-xs mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            Coverage
                          </div>
                          <p className="font-semibold text-stone-900">{client.packageHours} hours</p>
                        </div>
                      )}
                      {client.packagePrice && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-stone-200/60 shadow-sm">
                          <div className="flex items-center gap-2 text-stone-400 text-xs mb-1">
                            <DollarSign className="w-3.5 h-3.5" />
                            Package
                          </div>
                          <p className="font-semibold text-stone-900">${client.packagePrice.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Event Details Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
                    <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-stone-400" />
                      Event Details
                    </h2>
                  </div>
                  <div className="p-5 space-y-4">
                    {eventDate && (
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-stone-500" />
                        </div>
                        <div>
                          <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Date</p>
                          <p className="font-medium text-stone-900">
                            {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-stone-500" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Location</p>
                        <p className="font-medium text-stone-900">
                          {client.eventLocation || <span className="text-stone-400 italic font-normal">Not set</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-stone-500" />
                      </div>
                      <div>
                        <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Venue</p>
                        <p className="font-medium text-stone-900">
                          {client.eventVenue || <span className="text-stone-400 italic font-normal">Not set</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Package Details Card */}
                {client.packageName && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
                      <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-stone-400" />
                        Package
                      </h2>
                    </div>
                    <div className="p-5">
                      <p className="text-lg font-semibold text-stone-900 mb-3">{client.packageName}</p>
                      {client.packageDescription && (
                        <p className="text-sm text-stone-500 leading-relaxed">{client.packageDescription}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Clause Selection */}
              <div className="lg:col-span-3">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden"
                >
                  {/* Header with progress */}
                  <div className="px-6 py-5 border-b border-stone-100 bg-gradient-to-r from-stone-50 to-white">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-stone-400" />
                        Contract Clauses
                      </h2>
                      <div className="text-sm text-stone-500">
                        <span className="font-semibold text-stone-900">{enabledCount}</span> selected
                        <span className="text-stone-400 ml-1">({requiredCount} required)</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(enabledCount / availableClauses.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-stone-600 to-stone-900 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {Object.entries(clausesByCategory).map(([category, clauses]) => {
                      const enabledInCategory = clauses.filter(c => clauseStates.find(s => s.id === c.id)?.enabled).length
                      const isExpanded = expandedCategories.has(category)
                      
                      return (
                        <div key={category}>
                          {/* Category Header */}
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                                enabledInCategory === clauses.length 
                                  ? 'bg-emerald-100 text-emerald-600' 
                                  : enabledInCategory > 0 
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-stone-100 text-stone-400'
                              }`}>
                                {enabledInCategory === clauses.length ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <span className="text-sm font-bold">{enabledInCategory}</span>
                                )}
                              </div>
                              <div className="text-left">
                                <span className="font-semibold text-stone-900">
                                  {CLAUSE_CATEGORY_LABELS[category as keyof typeof CLAUSE_CATEGORY_LABELS] || category}
                                </span>
                                <span className="text-xs text-stone-400 ml-2">
                                  {enabledInCategory}/{clauses.length}
                                </span>
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`} />
                          </button>

                          {/* Clauses */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-5 pb-5 space-y-2">
                                  {clauses.map(clause => {
                                    const state = clauseStates.find(s => s.id === clause.id)
                                    const isEnabled = state?.enabled ?? false

                                    return (
                                      <motion.div
                                        key={clause.id}
                                        whileHover={{ scale: clause.isRequired ? 1 : 1.005 }}
                                        whileTap={{ scale: clause.isRequired ? 1 : 0.995 }}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                          isEnabled
                                            ? 'border-stone-900 bg-stone-50 shadow-sm'
                                            : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                                        } ${clause.isRequired ? 'cursor-default' : 'cursor-pointer'}`}
                                        onClick={() => toggleClause(clause.id, clause.isRequired)}
                                      >
                                        <div className="flex items-start gap-3">
                                          <div
                                            className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                              isEnabled
                                                ? 'bg-stone-900 text-white shadow-sm'
                                                : 'border-2 border-stone-300'
                                            }`}
                                          >
                                            {isEnabled && <Check className="w-3 h-3" />}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <h4 className="font-semibold text-stone-900">{clause.title}</h4>
                                              {clause.isRequired && (
                                                <span className="text-[10px] px-2 py-0.5 bg-stone-900 text-white rounded-full font-semibold uppercase tracking-wide">
                                                  Required
                                                </span>
                                              )}
                                            </div>
                                            <p className="text-sm text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                                              {clause.content.replace(/\{\{[^}]+\}\}/g, '___').substring(0, 150)}...
                                            </p>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* Mobile CTA */}
                <div className="lg:hidden mt-6 sticky bottom-4">
                  <button
                    onClick={handleCreateContract}
                    disabled={isPending || enabledCount === 0}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-stone-900 text-white font-medium rounded-2xl hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Contract...
                      </>
                    ) : (
                      <>
                        <span className="text-lg leading-none">+</span>
                        Create Contract
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
