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
  Clock,
} from 'lucide-react'
import { type ExtendedContractStatus, EXTENDED_STATUS_CONFIG } from '@/lib/contracts/types'

// Icon mapping for statuses
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
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showIcon?: boolean
  animated?: boolean
  className?: string
}

export function ContractStatusBadge({
  status,
  size = 'md',
  showLabel = true,
  showIcon = true,
  animated = true,
  className = '',
}: ContractStatusBadgeProps) {
  const config = EXTENDED_STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-1.5 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const Wrapper = animated ? motion.span : 'span'
  const animationProps = animated ? {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.2 },
  } : {}

  return (
    <Wrapper
      {...animationProps}
      className={`inline-flex items-center font-medium rounded-full ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{config.label}</span>}
    </Wrapper>
  )
}

// Larger status card for detail views
interface ContractStatusCardProps {
  status: ExtendedContractStatus
  updatedAt?: string
  className?: string
}

export function ContractStatusCard({
  status,
  updatedAt,
  className = '',
}: ContractStatusCardProps) {
  const config = EXTENDED_STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${config.bgColor} border ${config.color.replace('text-', 'border-').replace('600', '200')} rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <p className={`font-semibold ${config.color}`}>{config.label}</p>
          <p className="text-sm text-stone-500">{config.description}</p>
        </div>
      </div>
      {updatedAt && (
        <div className="flex items-center gap-1 mt-3 text-xs text-stone-400">
          <Clock className="w-3 h-3" />
          <span>
            Updated {new Date(updatedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}
    </motion.div>
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
          const isCompleted = index <= currentIndex
          const isCurrent = status === currentStatus
          const Icon = STATUS_ICONS[status]
          const config = EXTENDED_STATUS_CONFIG[status]

          return (
            <div
              key={status}
              className="flex flex-col items-center"
              style={{ width: `${100 / STATUS_ORDER.length}%` }}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted ? '#1c1917' : '#f5f5f4',
                }}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 ${
                  isCompleted ? 'border-stone-900' : 'border-stone-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCompleted ? 'text-white' : 'text-stone-300'}`} />
              </motion.div>
              <span className={`text-[10px] mt-1 text-center leading-tight ${
                isCompleted ? 'text-stone-700 font-medium' : 'text-stone-400'
              }`}>
                {config.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-stone-100 rounded-full overflow-hidden mt-2">
        <motion.div
          className="h-full bg-stone-900 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
