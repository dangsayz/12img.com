'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'
import { getStoredPromo } from '@/lib/promo/persistence'

interface PricingButtonProps {
  planId: string
  children: React.ReactNode
  className?: string
}

export function PricingButton({ planId, children, className }: PricingButtonProps) {
  const { isSignedIn, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  
  // Check for stored promo on mount
  useEffect(() => {
    const promo = getStoredPromo()
    if (promo?.code) {
      setPromoCode(promo.code)
    }
  }, [])
  
  // Determine disabled state - use undefined instead of false to avoid hydration mismatch
  const isDisabled = loading || !isLoaded ? true : undefined

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

  return (
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
  )
}
