/**
 * ============================================================================
 * SPOTLIGHT BANNER - Dashboard Notification
 * ============================================================================
 * 
 * Shows a subtle, dismissible banner when a contest is active.
 * Follows the same pattern as the Client Portal feature hint.
 * 
 * Design Decisions:
 * - Only shows when contest is in 'submissions_open' or 'voting' state
 * - Only shows for PAID users (Essential, Pro, Studio, Elite)
 * - Dismissible per-contest (stores contest ID in localStorage)
 * - Minimal, Apple-inspired pill design
 * - Contextual CTA based on contest phase
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_IMPLEMENTATION.md
 * ============================================================================
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, X } from 'lucide-react'

// Paid plans that can participate in contests
const PAID_PLANS = ['essential', 'pro', 'studio', 'elite']

interface SpotlightBannerProps {
  /** Pre-fetched contest data from server */
  contest: {
    id: string
    name: string
    theme: string | null
    status: 'submissions_open' | 'voting'
  } | null
  /** User's current plan - only paid users see the banner */
  userPlan?: string
}

export function SpotlightBanner({ contest, userPlan = 'free' }: SpotlightBannerProps) {
  // Only show for paid users
  const isPaidUser = PAID_PLANS.includes(userPlan.toLowerCase())
  const [dismissed, setDismissed] = useState(true) // Start hidden to prevent flash
  
  // Check if this specific contest was dismissed
  useEffect(() => {
    if (!contest) return
    
    const dismissedContests = localStorage.getItem('12img_spotlight_dismissed')
    const dismissedIds = dismissedContests ? JSON.parse(dismissedContests) : []
    
    // Show if this contest hasn't been dismissed
    setDismissed(dismissedIds.includes(contest.id))
  }, [contest])
  
  // Don't show for free users or if no contest or if dismissed
  if (!isPaidUser || !contest || dismissed) return null
  
  const handleDismiss = () => {
    setDismissed(true)
    
    // Store dismissed contest ID
    const dismissedContests = localStorage.getItem('12img_spotlight_dismissed')
    const dismissedIds = dismissedContests ? JSON.parse(dismissedContests) : []
    dismissedIds.push(contest.id)
    localStorage.setItem('12img_spotlight_dismissed', JSON.stringify(dismissedIds))
  }
  
  const isSubmissions = contest.status === 'submissions_open'
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="max-w-7xl mx-auto px-6 pt-6"
      >
        <div className="flex items-center justify-between py-3 px-4 bg-stone-50 rounded-full border border-stone-200">
          <div className="flex items-center gap-3">
            {/* Icon - Minimal, monochrome */}
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            
            {/* Text */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-stone-900">
                {isSubmissions ? 'Spotlight' : 'Voting Open'}
              </span>
              <span className="text-[10px] font-medium text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {isSubmissions ? 'Open' : 'Live'}
              </span>
            </div>
            
            {/* Theme/Description */}
            <span className="hidden sm:inline text-sm text-stone-400">·</span>
            <span className="hidden sm:inline text-sm text-stone-500">
              {contest.theme || (isSubmissions ? 'Submit your best shot' : 'Pick this month\'s winner')}
            </span>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={isSubmissions ? '/contest/submit' : '/contest'}
              className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors"
            >
              {isSubmissions ? 'Enter →' : 'Vote →'}
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-full hover:bg-stone-200 transition-colors ml-2"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
