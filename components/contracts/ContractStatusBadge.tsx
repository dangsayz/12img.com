'use client'

import { motion } from 'framer-motion'
import {
  FileText,
  Send,
  Eye,
  PenTool,
  Play,
  Palette,
  CheckCircle,
  Gift,
  Archive,
  XCircle,
} from 'lucide-react'
import { type ExtendedContractStatus, EXTENDED_STATUS_CONFIG } from '@/lib/contracts/types'

// Icon mapping for each status
const STATUS_ICONS: Record<ExtendedContractStatus, React.ComponentType<{ className?: string }>> = {
  draft: FileText,
  sent: Send,
  viewed: Eye,
  signed: PenTool,
  in_progress: Play,
  editing: Palette,
  ready: CheckCircle,
  delivered: Gift,
  archived: Archive,
}

interface ContractStatusBadgeProps {
  status: ExtendedContractStatus
  variant?: 'badge' | 'pill' | 'dot' | 'full'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  showDescription?: boolean
  animated?: boolean
  className?: string
}

export function ContractStatusBadge({
  status,
  variant = 'badge',
  size = 'md',
  showIcon = true,
  showDescription = false,
  animated = false,
  className = '',
}: ContractStatusBadgeProps) {
  const config = EXTENDED_STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

  // Size classes
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5 text-xs gap-1',
      pill: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 'w-3 h-3',
      dot: 'w-1.5 h-1.5',
    },
    md: {
      badge: 'px-2.5 py-1 text-sm gap-1.5',
      pill: 'px-3 py-1.5 text-sm gap-2',
      icon: 'w-4 h-4',
      dot: 'w-2 h-2',
    },
    lg: {
      badge: 'px-3 py-1.5 text-base gap-2',
      pill: 'px-4 py-2 text-base gap-2',
      icon: 'w-5 h-5',
      dot: 'w-2.5 h-2.5',
    },
  }

  // Dot variant - just a colored dot
  if (variant === 'dot') {
    return (
      <span className={`flex items-center gap-2 ${className}`}>
        <motion.span
          className={`${sizeClasses[size].dot} rounded-full ${config.bgColor.replace('bg-', 'bg-').replace('-50', '-500')}`}
          animate={animated ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className={`${config.color} font-medium`}>{config.label}</span>
      </span>
    )
  }

  // Full variant - card-like with description
  if (variant === 'full') {
    return (
      <div className={`${config.bgColor} rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3">
          {showIcon && (
            <div className={`w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
          )}
          <div>
            <p className={`font-semibold ${config.color}`}>{config.label}</p>
            {showDescription && (
              <p className={`text-sm ${config.color} opacity-75 mt-0.5`}>
                {config.description}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Badge or pill variant
  const baseClasses = variant === 'pill' 
    ? `rounded-full ${sizeClasses[size].pill}`
    : `rounded-lg ${sizeClasses[size].badge}`

  if (animated) {
    return (
      <motion.span
        className={`inline-flex items-center font-medium ${baseClasses} ${config.bgColor} ${config.color} ${className}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring' as const, stiffness: 500, damping: 30 }}
      >
        {showIcon && <Icon className={sizeClasses[size].icon} />}
        <span>{config.label}</span>
      </motion.span>
    )
  }

  return (
    <span
      className={`inline-flex items-center font-medium ${baseClasses} ${config.bgColor} ${config.color} ${className}`}
    >
      {showIcon && <Icon className={sizeClasses[size].icon} />}
      <span>{config.label}</span>
    </span>
  )
}

// Status transition button
interface StatusTransitionButtonProps {
  currentStatus: ExtendedContractStatus
  targetStatus: ExtendedContractStatus
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function StatusTransitionButton({
  currentStatus,
  targetStatus,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: StatusTransitionButtonProps) {
  const targetConfig = EXTENDED_STATUS_CONFIG[targetStatus]
  const Icon = STATUS_ICONS[targetStatus]

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm
        transition-all duration-200
        ${disabled || loading
          ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
          : `${targetConfig.bgColor} ${targetConfig.color} hover:opacity-90 hover:shadow-md`
        }
        ${className}
      `}
    >
      {loading ? (
        <motion.div
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span>Mark as {targetConfig.label}</span>
    </button>
  )
}

// Status progress indicator
interface StatusProgressProps {
  currentStatus: ExtendedContractStatus
  className?: string
}

const STATUS_ORDER: ExtendedContractStatus[] = [
  'draft',
  'sent',
  'viewed',
  'signed',
  'in_progress',
  'editing',
  'ready',
  'delivered',
]

export function StatusProgress({ currentStatus, className = '' }: StatusProgressProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const progress = currentIndex === -1 ? 0 : ((currentIndex + 1) / STATUS_ORDER.length) * 100

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        {STATUS_ORDER.map((status, index) => {
          const config = EXTENDED_STATUS_CONFIG[status]
          const Icon = STATUS_ICONS[status]
          const isCompleted = index <= currentIndex
          const isCurrent = index === currentIndex

          return (
            <div
              key={status}
              className={`relative flex flex-col items-center ${
                index < STATUS_ORDER.length - 1 ? 'flex-1' : ''
              }`}
            >
              {/* Connecting line */}
              {index < STATUS_ORDER.length - 1 && (
                <div
                  className={`absolute top-4 left-1/2 w-full h-0.5 ${
                    isCompleted && index < currentIndex ? 'bg-stone-900' : 'bg-stone-200'
                  }`}
                />
              )}

              {/* Node */}
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted ? '#1c1917' : '#fafaf9',
                }}
                className={`relative z-10 w-8 h-8 rounded-lg flex items-center justify-center border-2 ${
                  isCompleted ? 'border-stone-900' : 'border-stone-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-stone-300'}`} />
              </motion.div>

              {/* Label (only for current) */}
              {isCurrent && (
                <motion.span
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute -bottom-6 text-xs font-medium ${config.color} whitespace-nowrap`}
                >
                  {config.label}
                </motion.span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
