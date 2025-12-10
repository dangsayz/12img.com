'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, Users } from 'lucide-react'
import Link from 'next/link'
import { PromotionalCampaign, getSpotsRemaining, getTimeRemaining, calculateSavings } from '@/lib/promos/types'
import { PRICING } from '@/lib/config/pricing'

interface PromoBannerProps {
  campaign: PromotionalCampaign
  position?: 'top' | 'floating'
  onDismiss?: () => void
}

function CountdownTimer({ campaign }: { campaign: PromotionalCampaign }) {
  const [time, setTime] = useState(getTimeRemaining(campaign))
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(campaign))
    }, 1000)
    return () => clearInterval(interval)
  }, [campaign])
  
  if (time.isExpired) return null
  
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <Clock className="w-3.5 h-3.5" />
      <span>
        {time.days > 0 && `${time.days}d `}
        {time.hours}h {time.minutes}m
      </span>
    </div>
  )
}

function SpotsRemaining({ campaign }: { campaign: PromotionalCampaign }) {
  const spots = getSpotsRemaining(campaign)
  if (spots === null) return null
  
  const isUrgent = spots < 20
  
  return (
    <div className={`flex items-center gap-1.5 text-sm ${isUrgent ? 'text-red-300' : ''}`}>
      <Users className="w-3.5 h-3.5" />
      <span>{spots} spots left</span>
    </div>
  )
}

export function PromoBanner({ campaign, position = 'floating', onDismiss }: PromoBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  
  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedKey = `promo_dismissed_${campaign.slug}`
    const wasDismissed = localStorage.getItem(dismissedKey)
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [campaign.slug])
  
  const handleDismiss = () => {
    const dismissedKey = `promo_dismissed_${campaign.slug}`
    localStorage.setItem(dismissedKey, 'true')
    setDismissed(true)
    onDismiss?.()
  }
  
  if (dismissed) return null
  
  const signupUrl = `/sign-up?plan=${campaign.target_plans[0] || 'pro'}&promo=${campaign.stripe_coupon_id || campaign.slug}`
  
  // Calculate savings for positive framing
  const targetPlan = campaign.target_plans[0] || 'elite'
  const originalPriceCents = (PRICING[targetPlan as keyof typeof PRICING]?.yearly || PRICING.elite.yearly) * 100
  const savingsAmount = Math.round(calculateSavings(originalPriceCents, campaign) / 100)
  const savingsHeadline = savingsAmount > 0 ? `Save $${savingsAmount} this year` : campaign.banner_headline
  
  if (position === 'top') {
    return (
      <div
        className="w-full py-3 px-4"
        style={{ backgroundColor: campaign.banner_bg_color, color: campaign.banner_text_color }}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {campaign.badge_text && (
              <span className="px-2 py-1 text-xs font-bold uppercase tracking-wider bg-white/20 shrink-0">
                {campaign.badge_text}
              </span>
            )}
            <p className="font-medium">{savingsHeadline}</p>
            {campaign.show_countdown && <CountdownTimer campaign={campaign} />}
            {campaign.show_spots_remaining && <SpotsRemaining campaign={campaign} />}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={signupUrl}
              className="px-4 py-2 text-sm font-medium bg-white hover:bg-white/90 transition-colors"
              style={{ color: campaign.banner_bg_color }}
            >
              {campaign.banner_cta}
            </Link>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Floating banner
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
      >
        <div
          className="p-4 shadow-2xl"
          style={{ backgroundColor: campaign.banner_bg_color, color: campaign.banner_text_color }}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="pr-6">
            {campaign.badge_text && (
              <span className="inline-block px-2 py-1 text-xs font-bold uppercase tracking-wider bg-white/20 mb-2">
                {campaign.badge_text}
              </span>
            )}
            <p className="font-medium text-lg">{savingsHeadline}</p>
            {campaign.banner_subheadline && (
              <p className="text-sm opacity-80 mt-1">{campaign.banner_subheadline}</p>
            )}
            
            <div className="flex items-center gap-4 mt-3">
              {campaign.show_countdown && <CountdownTimer campaign={campaign} />}
              {campaign.show_spots_remaining && <SpotsRemaining campaign={campaign} />}
            </div>
            
            <Link
              href={signupUrl}
              className="mt-4 block w-full py-2.5 text-center text-sm font-medium bg-white hover:bg-white/90 transition-colors"
              style={{ color: campaign.banner_bg_color }}
            >
              {campaign.banner_cta}
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Server component wrapper to fetch active campaign
export async function PromoBannerServer() {
  // This would be called from a server component
  // For now, we'll use client-side fetching
  return null
}
