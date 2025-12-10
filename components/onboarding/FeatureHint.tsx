'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lightbulb } from 'lucide-react'

interface FeatureHintProps {
  id: string // Unique ID to track dismissal in localStorage
  title: string
  description: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  children?: React.ReactNode
}

/**
 * A dismissable hint tooltip that shows once for first-time users.
 * Once dismissed, it won't show again (stored in localStorage).
 */
export function FeatureHint({ 
  id, 
  title, 
  description, 
  position = 'bottom',
  children 
}: FeatureHintProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  const storageKey = `hint_dismissed_${id}`

  useEffect(() => {
    setMounted(true)
    // Check if hint was already dismissed
    const dismissed = localStorage.getItem(storageKey)
    if (!dismissed) {
      // Small delay before showing hint
      const timer = setTimeout(() => setIsVisible(true), 500)
      return () => clearTimeout(timer)
    }
  }, [storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(storageKey, 'true')
  }

  if (!mounted) return <>{children}</>

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-stone-900',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-stone-900',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-stone-900',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-stone-900',
  }

  return (
    <div className="relative inline-block">
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: position === 'bottom' ? -10 : position === 'top' ? 10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-50 ${positionClasses[position]}`}
          >
            {/* Arrow */}
            <div className={`absolute w-0 h-0 border-[6px] ${arrowClasses[position]}`} />
            
            {/* Hint Card */}
            <div className="w-64 bg-stone-900 text-white rounded-xl shadow-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <h4 className="font-medium text-sm">{title}</h4>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <p className="text-xs text-white/70 leading-relaxed pl-8">
                {description}
              </p>
              <button
                onClick={handleDismiss}
                className="mt-3 w-full py-2 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * A banner-style hint that appears at the top of a section.
 */
interface FeatureBannerProps {
  id: string
  title: string
  description: string
  icon?: React.ReactNode
}

export function FeatureBanner({ id, title, description, icon }: FeatureBannerProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  const storageKey = `hint_dismissed_${id}`

  useEffect(() => {
    setMounted(true)
    const dismissed = localStorage.getItem(storageKey)
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [storageKey])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(storageKey, 'true')
  }

  if (!mounted || !isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="mb-6 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-xl p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
          {icon || <Lightbulb className="w-5 h-5 text-amber-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-sm mb-1">{title}</h3>
              <p className="text-xs text-white/70 leading-relaxed">{description}</p>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Reset all hints (for testing or user preference)
 */
export function resetAllHints() {
  if (typeof window === 'undefined') return
  
  const keys = Object.keys(localStorage).filter(key => key.startsWith('hint_dismissed_'))
  keys.forEach(key => localStorage.removeItem(key))
}
