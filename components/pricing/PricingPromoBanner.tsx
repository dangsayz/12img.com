'use client'

/**
 * PricingPromoBanner - Soft promotional hints on the pricing/checkout page
 * 
 * This is where we catch users who are already considering upgrading.
 * Uses subtle urgency cues without being aggressive.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PromotionalCampaign, 
  getSpotsRemaining, 
  getTimeRemaining,
  formatDiscount,
  calculateDiscountedPrice,
  calculateSavings,
} from '@/lib/promos/types'
import { PRICING } from '@/lib/config/pricing'

interface PricingPromoBannerProps {
  campaign: PromotionalCampaign
  className?: string
}

// Countdown timer component
function CountdownTimer({ campaign }: { campaign: PromotionalCampaign }) {
  const [time, setTime] = useState(getTimeRemaining(campaign))
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(campaign))
    }, 1000)
    return () => clearInterval(interval)
  }, [campaign])
  
  if (time.isExpired) return null
  
  // Only show countdown if less than 7 days
  if (time.days > 7) return null
  
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-stone-500">Ends in</span>
      <div className="flex items-center gap-1 font-mono text-stone-900">
        {time.days > 0 && (
          <>
            <span className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">{time.days}d</span>
          </>
        )}
        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">{String(time.hours).padStart(2, '0')}h</span>
        <span className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">{String(time.minutes).padStart(2, '0')}m</span>
        {time.days === 0 && (
          <span className="bg-stone-100 px-1.5 py-0.5 rounded text-xs">{String(time.seconds).padStart(2, '0')}s</span>
        )}
      </div>
    </div>
  )
}

// Spots remaining indicator
function SpotsIndicator({ campaign }: { campaign: PromotionalCampaign }) {
  const spots = getSpotsRemaining(campaign)
  if (spots === null) return null
  
  const isUrgent = spots <= 10
  const isVeryUrgent = spots <= 5
  
  return (
    <div className={`flex items-center gap-2 text-sm ${isVeryUrgent ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-stone-600'}`}>
      <div className="flex items-center gap-1">
        {/* Animated dot for urgency */}
        {isUrgent && (
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVeryUrgent ? 'bg-red-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isVeryUrgent ? 'bg-red-500' : 'bg-amber-500'}`} />
          </span>
        )}
        <span className="font-medium">{spots}</span>
        <span>spots left</span>
      </div>
    </div>
  )
}

export function PricingPromoBanner({ campaign, className = '' }: PricingPromoBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  
  // Check localStorage for dismissal
  useEffect(() => {
    const dismissedKey = `pricing_promo_dismissed_${campaign.slug}`
    const wasDismissed = sessionStorage.getItem(dismissedKey) // Use session storage so it shows again next visit
    if (wasDismissed) {
      setDismissed(true)
    }
  }, [campaign.slug])
  
  const handleDismiss = () => {
    const dismissedKey = `pricing_promo_dismissed_${campaign.slug}`
    sessionStorage.setItem(dismissedKey, 'true')
    setDismissed(true)
  }
  
  if (dismissed) return null
  
  // Calculate savings
  const targetPlan = campaign.target_plans[0] || 'elite'
  const originalPriceCents = (PRICING[targetPlan as keyof typeof PRICING]?.monthly || PRICING.elite.monthly) * 100
  const discountedPrice = calculateDiscountedPrice(originalPriceCents, campaign)
  const savings = calculateSavings(originalPriceCents, campaign)
  const savingsPerMonth = Math.round(savings / 100)
  
  const spots = getSpotsRemaining(campaign)
  const time = getTimeRemaining(campaign)
  const hasUrgency = (spots !== null && spots <= 20) || (time.days <= 3 && !time.isExpired)
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative ${className}`}
      >
        {/* Main banner - subtle and editorial */}
        <div className="bg-gradient-to-r from-stone-50 to-stone-100/50 border border-stone-200 rounded-xl p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Promo info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {campaign.badge_text && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-stone-900 text-white">
                    {campaign.badge_text}
                  </span>
                )}
                {hasUrgency && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-amber-100 text-amber-700">
                    Limited Time
                  </span>
                )}
              </div>
              
              <h3 className="font-serif text-lg md:text-xl text-stone-900 mb-1">
                {campaign.banner_headline}
              </h3>
              
              {campaign.banner_subheadline && (
                <p className="text-sm text-stone-600 mb-3">
                  {campaign.banner_subheadline}
                </p>
              )}
              
              {/* Urgency indicators */}
              <div className="flex flex-wrap items-center gap-4">
                {campaign.show_spots_remaining && <SpotsIndicator campaign={campaign} />}
                {campaign.show_countdown && <CountdownTimer campaign={campaign} />}
              </div>
            </div>
            
            {/* Right: Savings highlight + CTA */}
            <div className="flex flex-col items-start md:items-end gap-3">
              {savingsPerMonth > 0 && (
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-stone-500 mb-0.5">You save</div>
                  <div className="font-serif text-2xl text-stone-900">${savingsPerMonth}<span className="text-sm text-stone-500">/mo</span></div>
                </div>
              )}
              
              <Link
                href={`/sign-up?plan=${targetPlan}&promo=${campaign.stripe_coupon_id || campaign.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-black transition-colors"
              >
                {campaign.banner_cta}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-stone-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Soft hint below - social proof style */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs text-stone-500">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Price locked forever when you sign up today</span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Compact inline version for showing next to upgrade buttons
export function PromoHint({ campaign }: { campaign: PromotionalCampaign }) {
  const spots = getSpotsRemaining(campaign)
  const discount = formatDiscount(campaign)
  
  return (
    <div className="flex items-center gap-1.5 text-xs text-stone-500">
      <span className="font-medium text-stone-700">{discount}</span>
      {spots !== null && spots <= 50 && (
        <>
          <span>·</span>
          <span className={spots <= 10 ? 'text-amber-600 font-medium' : ''}>
            {spots} left
          </span>
        </>
      )}
    </div>
  )
}

// Wrapper that fetches active campaign
export function ActivePricingPromoBanner({ className = '' }: { className?: string }) {
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch('/api/promo/active')
        if (!res.ok) return
        const contentType = res.headers.get('content-type')
        if (!contentType?.includes('application/json')) return
        const data = await res.json()
        setCampaign(data.campaign)
      } catch {
        // Silently fail - promo banner is non-essential
      } finally {
        setLoading(false)
      }
    }
    
    fetchCampaign()
  }, [])
  
  if (loading || !campaign) return null
  
  // Only show if campaign is configured to show on pricing
  if (!campaign.show_on_pricing) return null
  
  return <PricingPromoBanner campaign={campaign} className={className} />
}
