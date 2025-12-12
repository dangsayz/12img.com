'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { PromotionalCampaign, getSpotsRemaining } from '@/lib/promos/types'

// Storage keys
const FIRST_VISIT_KEY = 'promo_first_visit_shown'
const LAST_SHOWN_KEY = 'promo_last_shown'
const COOLDOWN_HOURS = 24 // Don't show again for 24 hours after dismissal

/**
 * Check if we should show the promo modal
 * - First visit: Show after 2s delay
 * - After that: Only show when triggered by upgrade events (via showPromoModal())
 */
function shouldShowOnLoad(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check if first visit modal was already shown
  const firstVisitShown = localStorage.getItem(FIRST_VISIT_KEY)
  if (!firstVisitShown) {
    return true // First visit - show it
  }
  
  return false // Not first visit - wait for upgrade trigger
}

/**
 * Check if enough time has passed since last dismissal
 */
function isOnCooldown(): boolean {
  if (typeof window === 'undefined') return false
  
  const lastShown = localStorage.getItem(LAST_SHOWN_KEY)
  if (!lastShown) return false
  
  const lastShownTime = parseInt(lastShown, 10)
  const hoursSince = (Date.now() - lastShownTime) / (1000 * 60 * 60)
  
  return hoursSince < COOLDOWN_HOURS
}

/**
 * Global function to trigger promo modal from anywhere (e.g., upgrade prompts)
 * Call this when user hits a plan limit
 */
export function showPromoModal() {
  if (typeof window === 'undefined') return
  if (isOnCooldown()) return // Respect cooldown
  
  window.dispatchEvent(new CustomEvent('show-promo-modal'))
}

export function PromoModal() {
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null)
  const [visible, setVisible] = useState(false)
  
  const dismiss = useCallback(() => {
    setVisible(false)
    // Mark first visit as shown
    localStorage.setItem(FIRST_VISIT_KEY, 'true')
    // Record dismissal time for cooldown
    localStorage.setItem(LAST_SHOWN_KEY, Date.now().toString())
  }, [])
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss()
    }
    
    if (visible) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [visible, dismiss])
  
  // Listen for manual trigger (from upgrade prompts)
  useEffect(() => {
    const handleShowPromo = () => {
      if (campaign && !isOnCooldown()) {
        setVisible(true)
      }
    }
    
    window.addEventListener('show-promo-modal', handleShowPromo)
    return () => window.removeEventListener('show-promo-modal', handleShowPromo)
  }, [campaign])
  
  // Fetch campaign and maybe show on first visit
  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch('/api/promo/active')
        if (!res.ok) return
        const contentType = res.headers.get('content-type')
        if (!contentType?.includes('application/json')) return
        const data = await res.json()
        if (data.campaign) {
          setCampaign(data.campaign)
          
          // Only auto-show on first visit
          if (shouldShowOnLoad()) {
            setTimeout(() => setVisible(true), 2500)
          }
        }
      } catch {
        // Silently fail - promo modal is non-essential
      }
    }
    
    fetchCampaign()
  }, [])
  
  if (!campaign) return null
  
  const spotsRemaining = getSpotsRemaining(campaign)
  
  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop - very subtle */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/5 backdrop-blur-[2px] z-50"
            onClick={dismiss}
          />
          
          {/* Modal - bottom center, minimal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-50 sm:w-[90vw] sm:max-w-md max-h-[80vh] flex"
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))' }}
          >
            <div className="bg-white rounded-2xl shadow-2xl shadow-stone-900/10 border border-stone-100 overflow-hidden flex flex-col w-full max-h-[80vh]">
              {/* Close button - top right, minimal */}
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full text-stone-300 hover:text-stone-500 hover:bg-stone-50 transition-all z-10"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Content - scrollable on very small screens */}
              <div className="p-6 pt-5 overflow-y-auto">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-50" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-stone-900" />
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">
                    {campaign.badge_text || 'Limited offer'}
                  </span>
                </div>
                
                {/* Headline */}
                <h3 className="text-base sm:text-lg font-medium text-stone-900 leading-snug mb-1.5">
                  {campaign.banner_headline}
                </h3>
                
                {/* Subheadline */}
                {campaign.banner_subheadline && (
                  <p className="text-sm text-stone-500 leading-relaxed mb-4">
                    {campaign.banner_subheadline}
                  </p>
                )}
                
                {/* Footer: Spots + CTA */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                  {spotsRemaining !== null && (
                    <span className="text-xs text-stone-400 text-center sm:text-left">
                      {spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining
                    </span>
                  )}
                  
                  <Link
                    href={`/promo/${campaign.slug}`}
                    onClick={dismiss}
                    className="sm:ml-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {campaign.banner_cta || 'Learn more'}
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
              
              {/* Subtle bottom accent line */}
              <div className="h-0.5 bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
