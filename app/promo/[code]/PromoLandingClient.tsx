'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { storePromo } from '@/lib/promo/persistence'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PromoShareButtons } from '@/components/ui/PromoShareButtons'

interface PromoLandingClientProps {
  campaign: {
    code: string
    campaignSlug: string
    plan: string
    discount: number
    discountType: 'percent' | 'fixed' | 'price_override'
    headline: string
    subheadline: string | null
    badgeText: string | null
    spotsRemaining: number | null
  }
  redirectUrl: string
  utmParams: {
    source?: string
    medium?: string
    campaign?: string
  }
}

export function PromoLandingClient({ campaign, redirectUrl, utmParams }: PromoLandingClientProps) {
  const router = useRouter()

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/promo/${campaign.campaignSlug}`
    : `https://12img.com/promo/${campaign.campaignSlug}`

  useEffect(() => {
    // Store the promo in cookie + localStorage immediately
    try {
      storePromo({
        code: campaign.code,
        campaignSlug: campaign.campaignSlug,
        plan: campaign.plan,
        discount: campaign.discount,
        discountType: campaign.discountType,
        source: utmParams.source,
        medium: utmParams.medium,
        campaign: utmParams.campaign,
      })
    } catch (error) {
      console.error('Failed to store promo:', error)
    }
  }, [campaign, utmParams])

  const formatPrice = () => {
    if (campaign.discountType === 'price_override') {
      return `$${(campaign.discount / 100).toFixed(0)}`
    }
    return `${campaign.discount}% off`
  }

  const handleClaim = () => {
    router.push(redirectUrl)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Minimal nav */}
      <nav className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">12</span>
          </div>
          <span className="text-sm font-semibold text-stone-900">img</span>
        </Link>
      </nav>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-sm w-full text-center"
        >
          {/* Badge */}
          {campaign.badgeText && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2 mb-8"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stone-400 opacity-50" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-stone-900" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-stone-400 font-medium">
                {campaign.badgeText}
              </span>
            </motion.div>
          )}

          {/* Price - big and bold */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4"
          >
            <span className="text-6xl sm:text-7xl font-light tracking-tight text-stone-900">
              {formatPrice()}
            </span>
            {campaign.discountType === 'price_override' && (
              <span className="text-2xl text-stone-400 font-light">/year</span>
            )}
          </motion.div>

          {/* Headline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-stone-500 text-sm leading-relaxed mb-8 max-w-xs mx-auto"
          >
            {campaign.subheadline || campaign.headline}
          </motion.p>

          {/* Spots remaining */}
          {campaign.spotsRemaining !== null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xs text-stone-400 mb-8"
            >
              {campaign.spotsRemaining} of 100 spots remaining
            </motion.p>
          )}

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            onClick={handleClaim}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 px-8 text-sm font-medium transition-colors rounded-lg"
          >
            Continue
          </motion.button>

          {/* Fine print */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 text-[11px] text-stone-300"
          >
            Discount auto-applied · No credit card required
          </motion.p>

          {/* Share buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-8"
          >
            <PromoShareButtons shareUrl={shareUrl} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
