'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  Palette,
  Gift,
  Archive,
  Sparkles,
} from 'lucide-react'
import {
  type ExtendedContractStatus,
  EXTENDED_STATUS_CONFIG,
  STATUS_TRANSITIONS,
} from '@/lib/contracts/types'
import { updateContractStatus, markEventCompleted } from '@/server/actions/milestone.actions'
import { ContractStatusBadge } from './ContractStatusBadge'

interface StatusTransitionPanelProps {
  contractId: string
  currentStatus: ExtendedContractStatus
  deliveryWindowDays?: number
  onStatusChange?: (newStatus: ExtendedContractStatus) => void
  className?: string
}

// Action configurations for each transition
const TRANSITION_ACTIONS: Partial<Record<ExtendedContractStatus, {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  confirmText: string
  color: string
}>> = {
  in_progress: {
    icon: Camera,
    label: 'Mark Event Completed',
    description: 'Start the delivery countdown timer',
    confirmText: 'Event Completed',
    color: 'bg-blue-600 hover:bg-blue-700',
  },
  editing: {
    icon: Palette,
    label: 'Start Editing',
    description: 'Begin post-processing the photos',
    confirmText: 'Start Editing',
    color: 'bg-purple-600 hover:bg-purple-700',
  },
  ready: {
    icon: Sparkles,
    label: 'Mark Editing Complete',
    description: 'Photos are ready for delivery',
    confirmText: 'Editing Complete',
    color: 'bg-teal-600 hover:bg-teal-700',
  },
  delivered: {
    icon: Gift,
    label: 'Mark as Delivered',
    description: 'Gallery has been sent to client',
    confirmText: 'Mark Delivered',
    color: 'bg-green-600 hover:bg-green-700',
  },
  archived: {
    icon: Archive,
    label: 'Archive Contract',
    description: 'Move to archived contracts',
    confirmText: 'Archive',
    color: 'bg-stone-600 hover:bg-stone-700',
  },
}

export function StatusTransitionPanel({
  contractId,
  currentStatus,
  deliveryWindowDays = 60,
  onStatusChange,
  className = '',
}: StatusTransitionPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeliveryWindow, setShowDeliveryWindow] = useState(false)
  const [customDeliveryDays, setCustomDeliveryDays] = useState(deliveryWindowDays)

  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || []

  const handleTransition = async (newStatus: ExtendedContractStatus) => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      try {
        // Special handling for event completion
        if (newStatus === 'in_progress' && currentStatus === 'signed') {
          const result = await markEventCompleted({
            contractId,
            deliveryWindowDays: customDeliveryDays,
          })

          if (!result.success) {
            setError(result.error?.message || 'Failed to mark event as completed')
            return
          }

          setSuccess('Event marked as completed! Delivery countdown started.')
          onStatusChange?.(newStatus)
          return
        }

        // Standard status transition
        const result = await updateContractStatus({
          contractId,
          newStatus,
        })

        if (!result.success) {
          setError(result.error?.message || 'Failed to update status')
          return
        }

        const config = EXTENDED_STATUS_CONFIG[newStatus]
        setSuccess(`Status updated to ${config.label}`)
        onStatusChange?.(newStatus)
      } catch (e) {
        setError('An unexpected error occurred')
      }
    })
  }

  if (availableTransitions.length === 0) {
    return (
      <div className={`bg-stone-50 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-2 text-stone-500">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm">No further actions available</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-stone-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-stone-700">Next Steps</h3>
          <ContractStatusBadge status={currentStatus} size="sm" />
        </div>
      </div>

      {/* Actions */}
      <div className="divide-y divide-stone-100">
        {availableTransitions.map((nextStatus) => {
          const action = TRANSITION_ACTIONS[nextStatus]
          if (!action) return null

          const Icon = action.icon
          const isEventCompletion = nextStatus === 'in_progress' && currentStatus === 'signed'

          return (
            <div key={nextStatus} className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl ${EXTENDED_STATUS_CONFIG[nextStatus].bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${EXTENDED_STATUS_CONFIG[nextStatus].color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-stone-900">{action.label}</h4>
                  <p className="text-sm text-stone-500 mt-0.5">{action.description}</p>

                  {/* Delivery window input for event completion */}
                  {isEventCompletion && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowDeliveryWindow(!showDeliveryWindow)}
                        className="text-xs text-stone-500 hover:text-stone-700 underline"
                      >
                        {showDeliveryWindow ? 'Hide options' : 'Customize delivery window'}
                      </button>
                      
                      <AnimatePresence>
                        {showDeliveryWindow && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-3 p-3 bg-stone-50 rounded-lg">
                              <label className="block text-xs font-medium text-stone-600 mb-1">
                                Delivery Window (days)
                              </label>
                              <input
                                type="number"
                                value={customDeliveryDays}
                                onChange={(e) => setCustomDeliveryDays(parseInt(e.target.value) || 60)}
                                min={1}
                                max={365}
                                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                              />
                              <p className="text-xs text-stone-400 mt-1">
                                Client will see countdown to this date
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={() => handleTransition(nextStatus)}
                    disabled={isPending}
                    className={`mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${action.color}`}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {action.confirmText}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feedback messages */}
      <AnimatePresence>
        {(error || success) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={`px-4 py-3 flex items-center gap-2 ${
              error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {error ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="text-sm">{error || success}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Quick action buttons for dashboard cards
interface QuickStatusActionsProps {
  contractId: string
  currentStatus: ExtendedContractStatus
  onStatusChange?: (newStatus: ExtendedContractStatus) => void
  className?: string
}

export function QuickStatusActions({
  contractId,
  currentStatus,
  onStatusChange,
  className = '',
}: QuickStatusActionsProps) {
  const [isPending, startTransition] = useTransition()

  const availableTransitions = STATUS_TRANSITIONS[currentStatus] || []
  const nextStatus = availableTransitions[0]

  if (!nextStatus) return null

  const action = TRANSITION_ACTIONS[nextStatus]
  if (!action) return null

  const handleClick = () => {
    startTransition(async () => {
      if (nextStatus === 'in_progress' && currentStatus === 'signed') {
        await markEventCompleted({ contractId })
      } else {
        await updateContractStatus({ contractId, newStatus: nextStatus })
      }
      onStatusChange?.(nextStatus)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${action.color} ${className}`}
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <action.icon className="w-3 h-3" />
      )}
      {action.confirmText}
    </button>
  )
}
