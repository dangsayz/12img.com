'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  PenTool,
  Camera,
  Palette,
  CheckCircle,
  Image,
  Globe,
  Gift,
  Bell,
  ChevronDown,
  Clock,
} from 'lucide-react'
import { type Milestone, type MilestoneType, MILESTONE_TYPE_CONFIG } from '@/lib/contracts/types'

// Icon mapping
const MILESTONE_ICONS: Record<MilestoneType, React.ComponentType<{ className?: string }>> = {
  contract_initiated: FileText,
  contract_signed: PenTool,
  event_completed: Camera,
  editing_started: Palette,
  editing_complete: CheckCircle,
  gallery_created: Image,
  gallery_published: Globe,
  delivery_complete: Gift,
  custom: Bell,
}

// Standard milestone order for the timeline
const MILESTONE_ORDER: MilestoneType[] = [
  'contract_initiated',
  'contract_signed',
  'event_completed',
  'editing_started',
  'editing_complete',
  'gallery_created',
  'gallery_published',
  'delivery_complete',
]

interface MilestoneTimelineProps {
  milestones: Milestone[]
  currentStatus?: string
  variant?: 'horizontal' | 'vertical'
  showDetails?: boolean
  className?: string
}

export function MilestoneTimeline({
  milestones,
  currentStatus,
  variant = 'horizontal',
  showDetails = true,
  className = '',
}: MilestoneTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Create a map of completed milestones
  const completedMilestones = new Map(
    milestones.map(m => [m.type, m])
  )

  // Build timeline with all standard milestones
  const timelineItems = MILESTONE_ORDER.map(type => {
    const milestone = completedMilestones.get(type)
    const config = MILESTONE_TYPE_CONFIG[type]
    const Icon = MILESTONE_ICONS[type]
    
    return {
      type,
      milestone,
      config,
      Icon,
      isCompleted: !!milestone,
    }
  })

  // Find current step index
  const currentStepIndex = timelineItems.findIndex(item => !item.isCompleted)
  const lastCompletedIndex = currentStepIndex === -1 
    ? timelineItems.length - 1 
    : currentStepIndex - 1

  if (variant === 'vertical') {
    return (
      <div className={`space-y-0 ${className}`}>
        {timelineItems.map((item, index) => {
          const isCompleted = item.isCompleted
          const isCurrent = index === currentStepIndex
          const isPending = index > currentStepIndex && currentStepIndex !== -1
          const Icon = item.Icon

          return (
            <div key={item.type} className="relative">
              {/* Connecting line */}
              {index < timelineItems.length - 1 && (
                <div 
                  className={`absolute left-5 top-10 w-0.5 h-full -ml-px ${
                    isCompleted ? 'bg-stone-900' : 'bg-stone-200'
                  }`}
                />
              )}

              <div className="flex items-start gap-4 pb-8">
                {/* Icon */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted 
                      ? '#1c1917' 
                      : isCurrent 
                        ? '#f5f5f4' 
                        : '#fafaf9',
                  }}
                  className={`relative z-10 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 ${
                    isCompleted 
                      ? 'border-stone-900' 
                      : isCurrent 
                        ? 'border-stone-400' 
                        : 'border-stone-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${
                    isCompleted ? 'text-white' : isCurrent ? 'text-stone-600' : 'text-stone-300'
                  }`} />
                  
                  {/* Pulse for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-stone-400"
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </motion.div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${
                      isCompleted ? 'text-stone-900' : isCurrent ? 'text-stone-700' : 'text-stone-400'
                    }`}>
                      {item.config.label}
                    </h4>
                    {isCompleted && item.milestone && (
                      <span className="text-xs text-stone-400">
                        {new Date(item.milestone.occurredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {isCompleted && item.milestone?.description && showDetails && (
                    <p className="text-sm text-stone-500 mt-1">
                      {item.milestone.description}
                    </p>
                  )}

                  {/* Pending status */}
                  {isPending && (
                    <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal variant
  return (
    <div className={`${className}`}>
      {/* Timeline bar */}
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-stone-200" />
        
        {/* Progress track */}
        <motion.div
          className="absolute top-5 left-0 h-0.5 bg-stone-900"
          initial={{ width: 0 }}
          animate={{ 
            width: `${((lastCompletedIndex + 1) / timelineItems.length) * 100}%` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Milestone nodes */}
        <div className="relative flex justify-between">
          {timelineItems.map((item, index) => {
            const isCompleted = item.isCompleted
            const isCurrent = index === currentStepIndex
            const Icon = item.Icon

            return (
              <div 
                key={item.type} 
                className="flex flex-col items-center"
                style={{ width: `${100 / timelineItems.length}%` }}
              >
                {/* Node */}
                <motion.button
                  onClick={() => item.milestone && setExpandedId(
                    expandedId === item.milestone.id ? null : item.milestone.id
                  )}
                  disabled={!item.milestone}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.15 : 1,
                    backgroundColor: isCompleted 
                      ? '#1c1917' 
                      : isCurrent 
                        ? '#ffffff' 
                        : '#fafaf9',
                  }}
                  whileHover={item.milestone ? { scale: 1.1 } : {}}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-shadow ${
                    isCompleted 
                      ? 'border-stone-900 cursor-pointer hover:shadow-lg' 
                      : isCurrent 
                        ? 'border-stone-400 shadow-sm' 
                        : 'border-stone-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    isCompleted ? 'text-white' : isCurrent ? 'text-stone-600' : 'text-stone-300'
                  }`} />
                  
                  {/* Pulse for current */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-stone-400"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}

                  {/* Expand indicator */}
                  {item.milestone && showDetails && (
                    <motion.div
                      animate={{ rotate: expandedId === item.milestone.id ? 180 : 0 }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full border border-stone-200 flex items-center justify-center"
                    >
                      <ChevronDown className="w-2.5 h-2.5 text-stone-400" />
                    </motion.div>
                  )}
                </motion.button>

                {/* Label */}
                <p className={`mt-3 text-xs text-center font-medium leading-tight ${
                  isCompleted ? 'text-stone-700' : isCurrent ? 'text-stone-500' : 'text-stone-300'
                }`}>
                  {item.config.label}
                </p>

                {/* Date */}
                {isCompleted && item.milestone && (
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {new Date(item.milestone.occurredAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expandedId && showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            {milestones
              .filter(m => m.id === expandedId)
              .map(milestone => (
                <div 
                  key={milestone.id}
                  className="bg-stone-50 rounded-xl p-4 border border-stone-100"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-stone-900">{milestone.title}</h4>
                      <p className="text-sm text-stone-500 mt-1">
                        {new Date(milestone.occurredAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      MILESTONE_TYPE_CONFIG[milestone.type].bgColor
                    } ${MILESTONE_TYPE_CONFIG[milestone.type].color}`}>
                      {MILESTONE_TYPE_CONFIG[milestone.type].label}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="mt-3 text-sm text-stone-600">
                      {milestone.description}
                    </p>
                  )}
                </div>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact version for cards
export function MilestoneTimelineCompact({
  milestones,
  className = '',
}: {
  milestones: Milestone[]
  className?: string
}) {
  const completedCount = milestones.length
  const totalSteps = MILESTONE_ORDER.length
  const progress = (completedCount / totalSteps) * 100

  const lastMilestone = milestones[milestones.length - 1]
  const lastConfig = lastMilestone ? MILESTONE_TYPE_CONFIG[lastMilestone.type] : null

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-stone-900 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-stone-500">
          {completedCount} of {totalSteps} milestones
        </span>
        {lastConfig && (
          <span className={`text-xs font-medium ${lastConfig.color}`}>
            {lastConfig.label}
          </span>
        )}
      </div>
    </div>
  )
}
