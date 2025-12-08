'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, AlertTriangle, Calendar, Zap } from 'lucide-react'
import { type DeliveryProgress } from '@/lib/contracts/types'

interface DeliveryCountdownProps {
  progress: DeliveryProgress
  variant?: 'full' | 'compact' | 'minimal'
  className?: string
}

export function DeliveryCountdown({
  progress,
  variant = 'full',
  className = '',
}: DeliveryCountdownProps) {
  const {
    daysRemaining,
    daysElapsed,
    percentComplete,
    isOverdue,
    deliveryStatus,
    estimatedDeliveryDate,
    deliveryWindowDays,
  } = progress

  // Calculate display values
  const displayDays = Math.abs(daysRemaining || 0)
  const isDelivered = deliveryStatus === 'delivered'
  const isPending = deliveryStatus === 'pending_event'

  // Determine color scheme based on status
  const colorScheme = useMemo(() => {
    if (isDelivered) {
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        accent: 'text-green-600',
        progress: 'bg-green-500',
        icon: CheckCircle,
      }
    }
    if (isOverdue) {
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        accent: 'text-amber-600',
        progress: 'bg-amber-500',
        icon: AlertTriangle,
      }
    }
    if (isPending) {
      return {
        bg: 'bg-stone-50',
        border: 'border-stone-200',
        text: 'text-stone-600',
        accent: 'text-stone-500',
        progress: 'bg-stone-300',
        icon: Calendar,
      }
    }
    // In progress
    if (percentComplete > 75) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        accent: 'text-blue-600',
        progress: 'bg-blue-500',
        icon: Zap,
      }
    }
    return {
      bg: 'bg-stone-50',
      border: 'border-stone-200',
      text: 'text-stone-700',
      accent: 'text-stone-600',
      progress: 'bg-stone-900',
      icon: Clock,
    }
  }, [isDelivered, isOverdue, isPending, percentComplete])

  const StatusIcon = colorScheme.icon

  // Minimal variant - just the countdown number
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StatusIcon className={`w-4 h-4 ${colorScheme.accent}`} />
        <span className={`text-sm font-medium ${colorScheme.text}`}>
          {isDelivered ? 'Delivered' : isPending ? 'Awaiting event' : isOverdue ? `${displayDays}d overdue` : `${displayDays}d remaining`}
        </span>
      </div>
    )
  }

  // Compact variant - small card
  if (variant === 'compact') {
    return (
      <div className={`${colorScheme.bg} ${colorScheme.border} border rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusIcon className={`w-5 h-5 ${colorScheme.accent}`} />
            <span className={`text-sm font-medium ${colorScheme.text}`}>
              {isDelivered ? 'Delivered!' : isPending ? 'Awaiting Event' : 'Delivery Progress'}
            </span>
          </div>
          {!isPending && !isDelivered && (
            <span className={`text-2xl font-light tabular-nums ${colorScheme.accent}`}>
              {displayDays}
              <span className="text-sm ml-1">days</span>
            </span>
          )}
        </div>

        {/* Progress bar */}
        {!isPending && (
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${colorScheme.progress} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentComplete, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}

        {estimatedDeliveryDate && !isDelivered && (
          <p className={`text-xs ${colorScheme.text} mt-2 opacity-75`}>
            Est. delivery: {new Date(estimatedDeliveryDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    )
  }

  // Full variant - detailed card with circular progress
  return (
    <div className={`${colorScheme.bg} ${colorScheme.border} border rounded-2xl p-6 ${className}`}>
      <div className="flex items-start gap-6">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-white/50"
            />
            {/* Progress circle */}
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={colorScheme.progress.replace('bg-', 'text-')}
              initial={{ strokeDasharray: '0 264' }}
              animate={{ 
                strokeDasharray: `${(Math.min(percentComplete, 100) / 100) * 264} 264` 
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isDelivered ? (
              <CheckCircle className={`w-8 h-8 ${colorScheme.accent}`} />
            ) : isPending ? (
              <Calendar className={`w-8 h-8 ${colorScheme.accent}`} />
            ) : (
              <>
                <span className={`text-2xl font-light tabular-nums ${colorScheme.accent}`}>
                  {displayDays}
                </span>
                <span className={`text-xs ${colorScheme.text} opacity-75`}>
                  {isOverdue ? 'overdue' : 'days'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={`w-5 h-5 ${colorScheme.accent}`} />
            <h3 className={`font-semibold ${colorScheme.text}`}>
              {isDelivered 
                ? 'Gallery Delivered!' 
                : isPending 
                  ? 'Awaiting Event' 
                  : isOverdue 
                    ? 'Delivery Overdue' 
                    : 'Delivery In Progress'}
            </h3>
          </div>

          <p className={`text-sm ${colorScheme.text} opacity-75 mb-4`}>
            {isDelivered 
              ? 'Your gallery has been delivered successfully.'
              : isPending 
                ? 'Countdown will begin after the event is completed.'
                : isOverdue 
                  ? 'Your gallery is in final processing and will be ready soon.'
                  : `${daysElapsed} days elapsed of ${deliveryWindowDays} day window.`}
          </p>

          {/* Stats row */}
          {!isPending && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-xs ${colorScheme.text} opacity-60 uppercase tracking-wider`}>
                  Progress
                </p>
                <p className={`text-lg font-medium ${colorScheme.accent}`}>
                  {percentComplete}%
                </p>
              </div>
              {estimatedDeliveryDate && (
                <div>
                  <p className={`text-xs ${colorScheme.text} opacity-60 uppercase tracking-wider`}>
                    Est. Delivery
                  </p>
                  <p className={`text-lg font-medium ${colorScheme.accent}`}>
                    {new Date(estimatedDeliveryDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress bar at bottom */}
      {!isPending && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className={colorScheme.text}>Event Completed</span>
            <span className={colorScheme.text}>Delivery</span>
          </div>
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${colorScheme.progress} rounded-full`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentComplete, 100)}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Simple countdown for client portal
export function ClientDeliveryCountdown({
  progress,
  className = '',
}: {
  progress: DeliveryProgress
  className?: string
}) {
  const { daysRemaining, isOverdue, deliveryStatus, estimatedDeliveryDate } = progress
  const displayDays = Math.abs(daysRemaining || 0)
  const isDelivered = deliveryStatus === 'delivered'
  const isPending = deliveryStatus === 'pending_event'

  if (isDelivered) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-xl p-4 text-center ${className}`}>
        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
        <p className="font-medium text-green-700">Your gallery is ready!</p>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className={`bg-stone-50 border border-stone-200 rounded-xl p-4 text-center ${className}`}>
        <Calendar className="w-8 h-8 text-stone-400 mx-auto mb-2" />
        <p className="font-medium text-stone-600">Awaiting your event</p>
        <p className="text-sm text-stone-500 mt-1">Countdown begins after the event</p>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-stone-900 to-stone-800 rounded-xl p-6 text-center ${className}`}>
      <div className="flex items-baseline justify-center gap-1 mb-2">
        <span className="text-5xl font-extralight text-white tabular-nums">
          {displayDays}
        </span>
        <span className="text-lg text-stone-400">
          {isOverdue ? 'days overdue' : 'days'}
        </span>
      </div>
      <p className="text-stone-400 text-sm">
        {isOverdue 
          ? 'Your gallery is in final processing'
          : 'until your gallery is ready'}
      </p>
      {estimatedDeliveryDate && !isOverdue && (
        <p className="text-stone-500 text-xs mt-3">
          Est. {new Date(estimatedDeliveryDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
