'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PromotionalCampaign } from '@/lib/promos/types'

const STORAGE_KEY = 'promo_bar_dismissed'

// Export height for other components to use
export const PROMO_BAR_HEIGHT = 36 // px

/**
 * Top announcement bar for promos/flash sales
 * Sticks to the very top of the page, dismissible
 */
export function PromoTopBar() {
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null)
  const [visible, setVisible] = useState(false)
  
  const dismiss = () => {
    setVisible(false)
    sessionStorage.setItem(STORAGE_KEY, 'true')
    // Dispatch event so nav can adjust
    window.dispatchEvent(new CustomEvent('promo-bar-change', { detail: { visible: false } }))
  }
  
  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem(STORAGE_KEY)) return
    
    async function fetchCampaign() {
      try {
        const res = await fetch('/api/promo/active')
        if (!res.ok) return // Silently fail if API errors
        const contentType = res.headers.get('content-type')
        if (!contentType?.includes('application/json')) return
        const data = await res.json()
        if (data.campaign && data.campaign.show_on_landing) {
          setCampaign(data.campaign)
          setVisible(true)
          // Dispatch event so nav can adjust
          window.dispatchEvent(new CustomEvent('promo-bar-change', { detail: { visible: true } }))
        }
      } catch (error) {
        // Silently fail - promo bar is non-essential
      }
    }
    
    fetchCampaign()
  }, [])
  
  if (!campaign) return null
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed top-0 left-0 right-0 z-[60] bg-stone-900 text-white"
        >
          <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-center gap-2 sm:gap-4 relative">
            {/* Content */}
            <Link 
              href={`/promo/${campaign.slug}`}
              className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm hover:opacity-80 transition-opacity min-w-0"
            >
              {/* Pulsing dot */}
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-white" />
              </span>
              
              {/* Text - benefit-focused, grandpa-friendly */}
              <span className="truncate">
                <span className="font-medium">Save 44% today</span>
                <span className="hidden sm:inline text-white/70 mx-2">—</span>
                <span className="hidden sm:inline text-white/70">Elite plan just $30/year</span>
              </span>
              
              {/* Arrow */}
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                dismiss()
              }}
              className="absolute right-2 sm:right-4 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
