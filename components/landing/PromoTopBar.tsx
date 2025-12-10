'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { PromotionalCampaign, getSpotsRemaining } from '@/lib/promos/types'

const STORAGE_KEY = 'promo_bar_dismissed'

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
  }
  
  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem(STORAGE_KEY)) return
    
    async function fetchCampaign() {
      try {
        const res = await fetch('/api/promo/active')
        const data = await res.json()
        if (data.campaign && data.campaign.show_on_landing) {
          setCampaign(data.campaign)
          setVisible(true)
        }
      } catch (error) {
        console.error('Error fetching active campaign:', error)
      }
    }
    
    fetchCampaign()
  }, [])
  
  if (!campaign) return null
  
  const spotsRemaining = getSpotsRemaining(campaign)
  
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-stone-900 text-white overflow-hidden"
        >
          <div className="max-w-screen-xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 relative">
            {/* Content */}
            <Link 
              href={`/promo/${campaign.slug}`}
              className="flex items-center gap-3 text-sm hover:opacity-80 transition-opacity"
            >
              {/* Pulsing dot */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              
              {/* Text */}
              <span>
                <span className="font-medium">{campaign.badge_text || campaign.name}</span>
                <span className="hidden sm:inline text-white/70 mx-2">—</span>
                <span className="hidden sm:inline text-white/70">{campaign.banner_headline}</span>
                {spotsRemaining !== null && (
                  <span className="ml-2 text-white/50">
                    ({spotsRemaining} left)
                  </span>
                )}
              </span>
              
              {/* Arrow */}
              <svg className="w-4 h-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                dismiss()
              }}
              className="absolute right-4 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
