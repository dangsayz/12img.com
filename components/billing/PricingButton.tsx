'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Loader2 } from 'lucide-react'

interface PricingButtonProps {
  planId: string
  children: React.ReactNode
  className?: string
}

export function PricingButton({ planId, children, className }: PricingButtonProps) {
  const { isSignedIn, isLoaded } = useUser()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    // If not signed in, redirect to sign-up with plan
    if (!isSignedIn) {
      window.location.href = `/sign-up?plan=${planId}`
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
        body: JSON.stringify({ planId }),
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
      disabled={loading || !isLoaded}
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
