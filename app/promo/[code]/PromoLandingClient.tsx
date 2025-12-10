'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { storePromo } from '@/lib/promo/persistence'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PromoShareButtons } from '@/components/ui/PromoShareButtons'
import { Check, Shield, Lock, Infinity } from 'lucide-react'

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
            className="mb-2"
          >
            <span className="text-6xl sm:text-7xl font-light tracking-tight text-stone-900">
              {formatPrice()}
            </span>
            {campaign.discountType === 'price_override' && (
              <span className="text-2xl text-stone-400 font-light">/year</span>
            )}
          </motion.div>

          {/* Price comparison - shows the real value */}
          {campaign.discountType === 'price_override' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mb-6"
            >
              <span className="text-sm text-stone-400 line-through">$449/year</span>
              <span className="text-sm text-stone-500 ml-2">→ Save $419</span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-stone-500 text-sm leading-relaxed mb-6 max-w-xs mx-auto"
          >
            {campaign.subheadline || campaign.headline}
          </motion.p>

          {/* What you get - clear value breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="bg-white border border-stone-200 rounded-xl p-4 mb-6 text-left"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-3">What you get</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-stone-600" />
                </div>
                <span className="text-sm text-stone-700"><strong>2TB storage</strong> — ~800,000 photos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-stone-600" />
                </div>
                <span className="text-sm text-stone-700"><strong>Unlimited galleries</strong> — no expiry</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-stone-600" />
                </div>
                <span className="text-sm text-stone-700"><strong>Smart contracts</strong> — e-sign, client portal</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-stone-600" />
                </div>
                <span className="text-sm text-stone-700"><strong>Client delivery</strong> — beautiful galleries</span>
              </div>
            </div>
          </motion.div>

          {/* Trust badge - price lock guarantee */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center justify-center gap-2 mb-6 py-2 px-4 bg-stone-50 rounded-lg"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span className="text-xs text-stone-600">
              <strong>Price locked forever</strong> — renews at $30/year
            </span>
          </motion.div>

          {/* Spots remaining */}
          {campaign.spotsRemaining !== null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-xs text-stone-400 mb-6"
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
            className="mt-6 text-[11px] text-stone-400"
          >
            No credit card required · Cancel anytime · Price locked forever
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

      {/* FAQ Section - addresses objections */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="w-full max-w-lg mx-auto px-6 pb-16"
      >
        <p className="text-[10px] uppercase tracking-[0.25em] text-stone-400 text-center mb-6">
          Common questions
        </p>
        <div className="space-y-4">
          <FaqItem 
            question="Will the price increase next year?"
            answer="No. Founder pricing is locked forever. You'll renew at $30/year for as long as you're a member. We put this in writing."
          />
          <FaqItem 
            question="Why not just use a hard drive?"
            answer="A hard drive stores files. 12img delivers experiences. Your clients get beautiful, branded galleries they can view on any device, download, and share. Plus contracts, messaging, and a client portal."
          />
          <FaqItem 
            question="What happens after the 100 spots?"
            answer="The Founder's price ends. New users will pay $449/year for Elite. If you claim a spot now, you keep the $30/year price forever."
          />
          <FaqItem 
            question="Can I cancel anytime?"
            answer="Yes. No contracts, no cancellation fees. If you cancel, you keep access until your billing period ends."
          />
        </div>
      </motion.div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="text-left">
      <p className="text-sm font-medium text-stone-800 mb-1">{question}</p>
      <p className="text-sm text-stone-500 leading-relaxed">{answer}</p>
    </div>
  )
}
