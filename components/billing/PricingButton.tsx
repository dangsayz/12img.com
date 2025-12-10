'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { getStoredPromo, StoredPromo } from '@/lib/promo/persistence'

interface PricingButtonProps {
  planId: string
  children: React.ReactNode
  className?: string
  showPromoHint?: boolean // Show subtle promo indicator
}

export function PricingButton({ planId, children, className, showPromoHint = false }: PricingButtonProps) {
  const { isSignedIn, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [storedPromo, setStoredPromo] = useState<StoredPromo | null>(null)
  
  // Check for stored promo on mount
  useEffect(() => {
    const promo = getStoredPromo()
    if (promo?.code) {
      setPromoCode(promo.code)
      setStoredPromo(promo)
    }
  }, [])
  
  // Only disable while actively loading a checkout - don't disable during initial load
  // to avoid hydration mismatch (server has isLoaded=false, client has isLoaded=true)
  const isDisabled = loading || undefined

  const handleClick = async () => {
    // If not signed in, redirect to sign-up with plan and promo
    if (!isSignedIn) {
      const url = promoCode 
        ? `/sign-up?plan=${planId}&promo=${promoCode}`
        : `/sign-up?plan=${planId}`
      window.location.href = url
      return
    }

    // Free plan - just go to dashboard
    if (planId === 'free') {
      window.location.href = '/'
      return
    }

    // Paid plan - open Stripe checkout
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, promoCode }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('No checkout URL:', data.error)
        alert(data.error || 'Failed to start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Format discount for display
  const getDiscountText = () => {
    if (!storedPromo?.discount || !storedPromo?.discountType) return null
    switch (storedPromo.discountType) {
      case 'percent':
        return `${storedPromo.discount}% off`
      case 'fixed':
        return `$${storedPromo.discount / 100} off`
      case 'price_override':
        return `Special price`
      default:
        return null
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
      
      {/* Subtle promo hint below button */}
      {showPromoHint && storedPromo && planId !== 'free' && (
        <div className="absolute -bottom-5 left-0 right-0 text-center">
          <span className="text-[10px] text-emerald-600 font-medium tracking-wide">
            {getDiscountText() || 'Promo applied'}
          </span>
        </div>
      )}
    </div>
  )
}
