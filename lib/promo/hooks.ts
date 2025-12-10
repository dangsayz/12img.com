'use client'

import { useState, useEffect } from 'react'
import { getStoredPromo, initPromoFromUrl, StoredPromo } from './persistence'

/**
 * Hook to access stored promo in client components
 */
export function usePromo() {
  const [promo, setPromo] = useState<StoredPromo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check URL first, then storage
    const storedPromo = initPromoFromUrl()
    setPromo(storedPromo)
    setIsLoading(false)
  }, [])

  return {
    promo,
    isLoading,
    hasPromo: !!promo,
    promoCode: promo?.code || null,
  }
}

/**
 * Calculate discounted price based on promo
 */
export function calculateDiscountedPrice(
  originalPriceCents: number,
  promo: StoredPromo | null
): number {
  if (!promo) return originalPriceCents

  switch (promo.discountType) {
    case 'percent':
      return Math.round(originalPriceCents * (1 - (promo.discount || 0) / 100))
    case 'fixed':
      return Math.max(0, originalPriceCents - (promo.discount || 0))
    case 'price_override':
      return promo.discount || originalPriceCents
    default:
      return originalPriceCents
  }
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

/**
 * Get savings percentage
 */
export function getSavingsPercent(original: number, discounted: number): number {
  if (original <= 0) return 0
  return Math.round(((original - discounted) / original) * 100)
}
