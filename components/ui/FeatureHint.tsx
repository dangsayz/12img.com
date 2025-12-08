'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { dismissHint } from '@/server/actions/hints.actions'

interface FeatureHintProps {
  /** Unique ID for this hint - used to track dismissal */
  id: string
  /** Whether this hint has already been dismissed (from server) */
  dismissed?: boolean
  /** Optional badge text shown above the hint */
  badge?: string
  /** Main title of the feature */
  title: string
  /** Description content */
  children: React.ReactNode
  /** Optional className for the container */
  className?: string
}

export function FeatureHint({
  id,
  dismissed = false,
  badge,
  title,
  children,
  className = '',
}: FeatureHintProps) {
  const [isVisible, setIsVisible] = useState(!dismissed)
  const [isPending, startTransition] = useTransition()

  const handleDismiss = () => {
    setIsVisible(false)
    startTransition(async () => {
      await dismissHint(id)
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2 }}
          className={`relative ${className}`}
        >
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            disabled={isPending}
            className="absolute top-3 right-3 p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors z-10"
            aria-label="Dismiss hint"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Badge */}
          {badge && (
            <span className="inline-block px-3 py-1 text-xs font-medium tracking-wider uppercase bg-white/10 text-white/60 rounded-full mb-4">
              {badge}
            </span>
          )}

          {/* Title */}
          <h3 className="text-2xl md:text-3xl font-light text-white mb-3 pr-8">
            {title}
          </h3>

          {/* Content */}
          <div className="text-white/60 text-sm md:text-base leading-relaxed">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Server component wrapper to fetch dismissed status
 * Use this when you need to check dismissal status on the server
 */
export function FeatureHintContainer({
  id,
  dismissedHints = [],
  ...props
}: Omit<FeatureHintProps, 'dismissed'> & { dismissedHints?: string[] }) {
  return <FeatureHint id={id} dismissed={dismissedHints.includes(id)} {...props} />
}
