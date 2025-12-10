'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { storePromo } from '@/lib/promo/persistence'
import { Check, Users, ArrowRight, Clock, Shield, Zap } from 'lucide-react'

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
  const [saved, setSaved] = useState(false)

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
      setSaved(true)
    } catch (error) {
      console.error('Failed to store promo:', error)
    }
  }, [campaign, utmParams])

  const formatDiscount = () => {
    switch (campaign.discountType) {
      case 'percent':
        return `${campaign.discount}% OFF`
      case 'fixed':
        return `$${(campaign.discount / 100).toFixed(0)} OFF`
      case 'price_override':
        return `$${(campaign.discount / 100).toFixed(0)}/year`
      default:
        return ''
    }
  }

  const handleClaim = () => {
    router.push(redirectUrl)
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">12</span>
          </div>
          <span className="text-xl font-semibold text-stone-900">img</span>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-stone-200 overflow-hidden">
          {/* Badge Header */}
          {campaign.badgeText && (
            <div className="bg-stone-900 text-white text-center py-3 px-4">
              <span className="text-xs font-bold uppercase tracking-wider">
                {campaign.badgeText}
              </span>
            </div>
          )}

          <div className="p-8 text-center">
            {/* Headline */}
            <h1 className="text-3xl font-serif text-stone-900 mb-3">
              {campaign.headline}
            </h1>

            {/* Subheadline */}
            {campaign.subheadline && (
              <p className="text-stone-500 mb-8">
                {campaign.subheadline}
              </p>
            )}

            {/* Discount Display */}
            <div className="bg-stone-50 border border-stone-100 p-6 mb-6">
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Your Exclusive Discount</p>
              <p className="text-5xl font-serif text-stone-900 mb-2">{formatDiscount()}</p>
              {campaign.spotsRemaining !== null && (
                <div className="flex items-center justify-center gap-2 text-sm text-amber-700 font-medium">
                  <Users className="w-4 h-4" />
                  <span>Only {campaign.spotsRemaining} spots left</span>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-center">
              <div className="p-3">
                <Zap className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                <p className="text-xs text-stone-500">2TB Storage</p>
              </div>
              <div className="p-3">
                <Shield className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                <p className="text-xs text-stone-500">Unlimited Galleries</p>
              </div>
              <div className="p-3">
                <Clock className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                <p className="text-xs text-stone-500">Locked Forever</p>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleClaim}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white py-4 px-6 text-sm font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              Claim Your Spot
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Saved indicator */}
            {saved && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-emerald-600">
                <Check className="w-4 h-4" />
                <span>Discount saved to your session</span>
              </div>
            )}
          </div>
        </div>

        {/* Fine print */}
        <p className="mt-6 text-center text-xs text-stone-400">
          Your discount will be automatically applied at checkout.<br />
          No credit card required to sign up.
        </p>
      </div>
    </div>
  )
}
