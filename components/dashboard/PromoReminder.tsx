'use client'

import { useState, useEffect } from 'react'
import { X, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PromotionalCampaign, getSpotsRemaining, calculateSavings } from '@/lib/promos/types'
import { PRICING } from '@/lib/config/pricing'

const STORAGE_KEY = 'promo_reminder_dismissed_at'
const REMINDER_INTERVAL_MS = 4 * 60 * 60 * 1000 // 4 hours between reminders

interface PromoReminderProps {
  userPlan?: string
}

/**
 * Soft promo reminder for free users
 * Shows periodically, dismissible with X or Escape
 * Only appears when there's an active campaign
 */
export function PromoReminder({ userPlan = 'free' }: PromoReminderProps) {
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null)
  const [visible, setVisible] = useState(false)
  
  // Only show to free users
  const isPaidUser = userPlan !== 'free'
  
  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, Date.now().toString())
  }
  
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && visible) {
        dismiss()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [visible])
  
  useEffect(() => {
    // Don't show to paid users
    if (isPaidUser) return
    
    // Check if dismissed recently
    const lastDismissed = localStorage.getItem(STORAGE_KEY)
    if (lastDismissed) {
      const timeSinceDismiss = Date.now() - parseInt(lastDismissed, 10)
      if (timeSinceDismiss < REMINDER_INTERVAL_MS) {
        return // Too soon, don't show
      }
    }
    
    async function fetchCampaign() {
      try {
        const res = await fetch('/api/promo/active')
        if (!res.ok) return
        const contentType = res.headers.get('content-type')
        if (!contentType?.includes('application/json')) return
        const data = await res.json()
        if (data.campaign) {
          setCampaign(data.campaign)
          // Delay showing by 3 seconds so it doesn't feel aggressive
          setTimeout(() => setVisible(true), 3000)
        }
      } catch {
        // Silently fail - promo reminder is non-essential
      }
    }
    
    fetchCampaign()
  }, [isPaidUser])
  
  if (!campaign || isPaidUser) return null
  
  const spotsRemaining = getSpotsRemaining(campaign)
  
  // Calculate savings for positive framing
  const targetPlan = campaign.target_plans[0] || 'elite'
  const originalPriceCents = (PRICING[targetPlan as keyof typeof PRICING]?.yearly || PRICING.elite.yearly) * 100
  const savingsAmount = Math.round(calculateSavings(originalPriceCents, campaign) / 100)
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <div className="relative bg-stone-900 text-white rounded-xl p-4 sm:p-5 overflow-hidden">
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 opacity-50" />
            
            <div className="relative flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* Pulsing indicator */}
                <div className="hidden sm:flex items-center justify-center">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
                  </span>
                </div>
                
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-medium truncate">
                    Save ${savingsAmount} this year
                    {spotsRemaining !== null && (
                      <span className="text-white/60 ml-2 font-normal">
                        — {spotsRemaining} spots left
                      </span>
                    )}
                  </p>
                  <p className="text-xs sm:text-sm text-white/60 mt-0.5 truncate">
                    {campaign.badge_text || campaign.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/promo/${campaign.slug}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-white text-stone-900 text-xs sm:text-sm font-medium rounded-full hover:bg-stone-100 transition-colors"
                >
                  View
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                
                <button
                  onClick={dismiss}
                  className="p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
