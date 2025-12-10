'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { getStoredPromo, clearPromo, type StoredPromo } from '@/lib/promo/persistence'
import { PRICING, type PlanId } from '@/lib/config/pricing'

interface PromoBannerProps {
  userPlan?: string
}

export function PromoBanner({ userPlan = 'free' }: PromoBannerProps) {
  const [promo, setPromo] = useState<StoredPromo | null>(null)
  const [loading, setLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (userPlan !== 'free') {
      clearPromo()
      return
    }

    // Check if dismissed this session
    const wasDismissed = sessionStorage.getItem('promo_dismissed')
    if (wasDismissed) {
      setDismissed(true)
      return
    }

    const storedPromo = getStoredPromo()
    if (storedPromo) {
      setPromo(storedPromo)
    }
  }, [userPlan])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissed(true)
    sessionStorage.setItem('promo_dismissed', 'true')
  }

  const handleClaim = async () => {
    if (!promo || loading) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId: promo.plan || 'elite',
          promoCode: promo.code 
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        window.location.href = `/pricing?plan=${promo.plan || 'elite'}&promo=${promo.code}`
      }
    } catch {
      window.location.href = `/pricing?plan=${promo.plan || 'elite'}&promo=${promo.code}`
    }
  }

  // Calculate savings for positive framing
  const getSavings = () => {
    if (!promo) return null
    
    const targetPlan = (promo.plan || 'elite') as PlanId
    const originalPrice = PRICING[targetPlan]?.yearly || PRICING.elite.yearly
    
    if (promo.discountType === 'price_override' && promo.discount) {
      const promoPrice = promo.discount / 100
      const savings = originalPrice - promoPrice
      return { savings: Math.round(savings), promoPrice: Math.round(promoPrice) }
    }
    if (promo.discountType === 'percent' && promo.discount) {
      const savings = Math.round(originalPrice * (promo.discount / 100))
      return { savings, promoPrice: originalPrice - savings }
    }
    if (promo.discountType === 'fixed' && promo.discount) {
      const savings = promo.discount / 100
      return { savings: Math.round(savings), promoPrice: originalPrice - savings }
    }
    return null
  }

  const savingsInfo = getSavings()

  if (!promo || userPlan !== 'free' || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12 flex items-center justify-center gap-3"
      >
        <button
          onClick={handleClaim}
          disabled={loading}
          className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin inline" />
          ) : savingsInfo ? (
            <span>
              Save <span className="text-stone-600 font-medium">${savingsInfo.savings}</span> this year →
            </span>
          ) : (
            <span>
              Claim your promo →
            </span>
          )}
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-stone-300 hover:text-stone-400 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
