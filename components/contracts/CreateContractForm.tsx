'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { type ClientProfile, EVENT_TYPE_LABELS, CLAUSE_CATEGORY_LABELS } from '@/lib/contracts/types'
import { getClausesForEventType, EVENT_TYPE_DEFAULTS, type ClauseTemplate } from '@/lib/contracts/event-clauses'
import { createContract } from '@/server/actions/contract.actions'

// Event type icons
const EVENT_TYPE_ICONS: Record<string, string> = {
  wedding: '💒',
  engagement: '💍',
  portrait: '📸',
  family: '👨‍👩‍👧‍👦',
  newborn: '👶',
  maternity: '🤰',
  corporate: '🏢',
  event: '🎉',
  other: '📷',
}

interface CreateContractFormProps {
  client: ClientProfile
}

interface ClauseState {
  id: string
  enabled: boolean
}

export function CreateContractForm({ client }: CreateContractFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['payment', 'copyright', 'liability']))
  
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
        templateClauseIds: enabledClauseIds, // Pass selected template clause IDs
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

      // Redirect to the contract detail page
      router.push(`/dashboard/contracts/${result.data?.id}`)
    })
  }

  const eventDate = client.eventDate ? new Date(client.eventDate) : null
  const balanceDueDate = client.balanceDueDate ? new Date(client.balanceDueDate) : null
  
  // Calculate balance due
  const balanceDue = client.packagePrice && client.retainerFee 
    ? client.packagePrice - client.retainerFee 
    : client.packagePrice || null

  // Days until event
  const daysUntilEvent = eventDate 
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/clients/${client.id}`}
                className="p-2 -ml-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div className="hidden sm:block h-6 w-px bg-stone-200" />
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-2xl">{EVENT_TYPE_ICONS[client.eventType] || '📷'}</span>
                <div>
                  <h1 className="text-base font-semibold text-stone-900">New Contract</h1>
                  <p className="text-xs text-stone-500">
                    {client.firstName} {client.lastName}
                    {client.partnerFirstName && ` & ${client.partnerFirstName}`}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-full text-sm font-medium text-stone-700">
                {EVENT_TYPE_LABELS[client.eventType]}
              </span>
              <button
                onClick={handleCreateContract}
                disabled={isPending || enabledCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-full hover:bg-stone-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Contract</span>
                    <span className="sm:hidden">Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column - Contract Details (Sticky on Desktop) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="lg:sticky lg:top-24">
              {/* Client Hero Card */}
              <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-6 text-white mb-6 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-3xl">
                    {EVENT_TYPE_ICONS[client.eventType] || '📷'}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">
                      {client.firstName} {client.lastName}
                      {client.partnerFirstName && (
                        <span className="font-normal text-white/70"> & {client.partnerFirstName}</span>
                      )}
                    </h2>
                    <p className="text-white/60 text-sm">{EVENT_TYPE_LABELS[client.eventType]}</p>
                  </div>
                </div>
                
                {/* Event Countdown */}
                {daysUntilEvent !== null && daysUntilEvent > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-sm">Days until event</span>
                      <span className="text-2xl font-bold">{daysUntilEvent}</span>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Date
                    </div>
                    <p className="font-medium text-sm">
                      {eventDate
                        ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'TBD'}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      Hours
                    </div>
                    <p className="font-medium text-sm">
                      {client.packageHours ? `${client.packageHours}h` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Details Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm mb-4">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Location</p>
                      <p className="text-sm font-medium text-stone-900">{client.eventLocation || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-stone-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-500">Venue</p>
                      <p className="text-sm font-medium text-stone-900">{client.eventVenue || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Payment Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-stone-600">Package Total</span>
                    <span className="text-sm font-semibold text-stone-900">
                      {client.packagePrice ? `$${client.packagePrice.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="h-px bg-stone-100" />
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-stone-600">Deposit/Retainer</span>
                    <span className="text-sm font-medium text-stone-900">
                      {client.retainerFee ? `$${client.retainerFee.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-stone-600">Balance Due</span>
                    <span className="text-sm font-medium text-stone-900">
                      {balanceDue !== null ? `$${balanceDue.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  
                  {balanceDueDate && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-stone-600">Due Date</span>
                      <span className="text-sm font-medium text-amber-600">
                        {balanceDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>

                {!client.retainerFee && !client.packagePrice && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                    <p className="text-xs text-amber-700">
                      Payment details can be added by editing the client profile.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Clause Selection */}
          <div className="lg:col-span-8">
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-stone-900">Contract Clauses</h2>
              <p className="text-stone-500 mt-1">
                Select the terms to include in this contract. Required clauses cannot be removed.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-700">
                  {enabledCount} of {availableClauses.length} clauses selected
                </span>
                <span className="text-xs text-stone-500">
                  {requiredCount} required
                </span>
              </div>
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-stone-600 to-stone-900 rounded-full transition-all duration-300"
                  style={{ width: `${(enabledCount / availableClauses.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Error creating contract</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Clause Categories */}
            <div className="space-y-4">
              {Object.entries(clausesByCategory).map(([category, clauses]) => {
                const enabledInCategory = clauses.filter(c => clauseStates.find(s => s.id === c.id)?.enabled).length
                const isExpanded = expandedCategories.has(category)
                
                return (
                  <div 
                    key={category}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm"
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-5 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          enabledInCategory === clauses.length 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : enabledInCategory > 0 
                              ? 'bg-amber-100 text-amber-600'
                              : 'bg-stone-100 text-stone-400'
                        }`}>
                          {enabledInCategory === clauses.length ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-bold">{enabledInCategory}</span>
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-stone-900">
                            {CLAUSE_CATEGORY_LABELS[category as keyof typeof CLAUSE_CATEGORY_LABELS] || category}
                          </h3>
                          <p className="text-xs text-stone-500 mt-0.5">
                            {enabledInCategory} of {clauses.length} selected
                          </p>
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
                          <div className="px-5 pb-5 space-y-3">
                            {clauses.map(clause => {
                              const state = clauseStates.find(s => s.id === clause.id)
                              const isEnabled = state?.enabled ?? false

                              return (
                                <div
                                  key={clause.id}
                                  onClick={() => toggleClause(clause.id, clause.isRequired)}
                                  className={`group p-4 rounded-xl border-2 transition-all duration-200 ${
                                    isEnabled
                                      ? 'border-stone-900 bg-stone-50 shadow-sm'
                                      : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-sm'
                                  } ${clause.isRequired ? 'cursor-default' : 'cursor-pointer'}`}
                                >
                                  <div className="flex items-start gap-4">
                                    <div
                                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                                        isEnabled
                                          ? 'bg-stone-900 text-white shadow-sm'
                                          : 'border-2 border-stone-300 group-hover:border-stone-400'
                                      }`}
                                    >
                                      {isEnabled && <Check className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="font-semibold text-stone-900">{clause.title}</h4>
                                        {clause.isRequired && (
                                          <span className="text-xs px-2 py-0.5 bg-stone-900 text-white rounded-full font-medium">
                                            Required
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                                        {clause.content.replace(/\{\{[^}]+\}\}/g, '___').substring(0, 180)}...
                                      </p>
                                    </div>
                                  </div>
                                </div>
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

            {/* Bottom CTA for Mobile */}
            <div className="lg:hidden mt-8 sticky bottom-4">
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
                    <Sparkles className="w-5 h-5" />
                    Create Contract
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
