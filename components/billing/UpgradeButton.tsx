'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { getStoredPromo } from '@/lib/promo/persistence'

interface UpgradeButtonProps {
  planId: string
  children: React.ReactNode
  className?: string
}

export function UpgradeButton({ planId, children, className }: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  
  // Check for stored promo on mount
  useEffect(() => {
    const promo = getStoredPromo()
    if (promo?.code) {
      setPromoCode(promo.code)
    }
  }, [])

  const handleUpgrade = async () => {
    if (planId === 'free') return
    
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
        console.error('No checkout URL returned')
        alert('Failed to start checkout. Please try again.')
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading || planId === 'free'}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  )
}
