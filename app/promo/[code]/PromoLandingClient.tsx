'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { storePromo } from '@/lib/promo/persistence'
import { Check, Loader2, Users } from 'lucide-react'

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
  const [status, setStatus] = useState<'storing' | 'redirecting' | 'error'>('storing')

  useEffect(() => {
    // Store the promo in cookie + localStorage
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
      
      setStatus('redirecting')
      
      // Small delay to show the UI, then redirect
      setTimeout(() => {
        router.push(redirectUrl)
      }, 1500)
    } catch (error) {
      console.error('Failed to store promo:', error)
      setStatus('error')
      // Redirect anyway after error
      setTimeout(() => {
        router.push(redirectUrl)
      }, 2000)
    }
  }, [campaign, redirectUrl, utmParams, router])

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

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <div className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">12</span>
          </div>
          <span className="text-xl font-semibold text-stone-900">img</span>
        </div>

        {/* Badge */}
        {campaign.badgeText && (
          <div className="inline-block px-4 py-1.5 bg-stone-900 text-white text-xs font-bold uppercase tracking-wider mb-6">
            {campaign.badgeText}
          </div>
        )}

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
        <div className="bg-white border border-stone-200 p-6 mb-8">
          <p className="text-sm text-stone-500 uppercase tracking-wider mb-2">Your Discount</p>
          <p className="text-4xl font-serif text-stone-900">{formatDiscount()}</p>
          {campaign.spotsRemaining !== null && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-stone-600">
              <Users className="w-4 h-4" />
              <span>{campaign.spotsRemaining} spots remaining</span>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center justify-center gap-3 text-stone-600">
          {status === 'storing' && (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving your discount...</span>
            </>
          )}
          {status === 'redirecting' && (
            <>
              <Check className="w-5 h-5 text-emerald-600" />
              <span>Discount saved! Redirecting...</span>
            </>
          )}
          {status === 'error' && (
            <>
              <span className="text-amber-600">Redirecting to sign up...</span>
            </>
          )}
        </div>

        {/* Fine print */}
        <p className="mt-12 text-xs text-stone-400">
          Your discount will be automatically applied at checkout.
        </p>
      </div>
    </div>
  )
}
