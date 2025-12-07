/**
 * Centralized Pricing Configuration
 * 
 * SIMPLE STORAGE-ONLY PRICING
 * No video bloat, no hidden fees
 * Just storage for photographers who need it
 * 
 * Beats Pixieset by ~25% at every tier
 */

export type PlanId = 'free' | 'essential' | 'pro' | 'studio' | 'elite'

// Legacy plan mapping (basic -> essential)
export type LegacyPlanId = PlanId | 'basic'

export function normalizePlanId(plan: string | undefined | null): PlanId {
  if (!plan) return 'free'
  if (plan === 'basic') return 'essential' // Map legacy basic to essential
  if (['free', 'essential', 'pro', 'studio', 'elite'].includes(plan)) {
    return plan as PlanId
  }
  return 'free'
}

export interface PlanLimits {
  storage_gb: number | 'unlimited'
  image_limit: number | 'unlimited'
  gallery_limit: number | 'unlimited'
  expiry_days: number | 'unlimited'
}

export interface PricingPlan {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  limits: PlanLimits
  features: string[]
  cta: string
  popular?: boolean
}

// Core pricing values
export const PRICING = {
  free: { monthly: 0, yearly: 0 },
  essential: { monthly: 9, yearly: 90 },
  pro: { monthly: 19, yearly: 190 },
  studio: { monthly: 39, yearly: 390 },
  elite: { monthly: 59, yearly: 590 },
} as const

// Plan limits for enforcement
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    storage_gb: 2,
    image_limit: 1300,
    gallery_limit: 3,
    expiry_days: 7,
  },
  essential: {
    storage_gb: 10,
    image_limit: 4000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
  pro: {
    storage_gb: 100,
    image_limit: 31000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
  studio: {
    storage_gb: 500,
    image_limit: 151000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
  elite: {
    storage_gb: 2000, // 2TB cap - sustainable "unlimited"
    image_limit: 600000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
}

// Full plan definitions for UI
export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Test drive',
    monthlyPrice: PRICING.free.monthly,
    yearlyPrice: PRICING.free.yearly,
    limits: PLAN_LIMITS.free,
    features: [
      '2GB storage',
      'Up to 1,300 images',
      '3 galleries',
      'JPG uploads',
      '7-day gallery expiry',
    ],
    cta: 'Start free',
  },
  {
    id: 'essential',
    name: 'Essential',
    description: 'For part-time photographers',
    monthlyPrice: PRICING.essential.monthly,
    yearlyPrice: PRICING.essential.yearly,
    limits: PLAN_LIMITS.essential,
    features: [
      '10GB storage',
      'Up to 4,000 images',
      'Unlimited galleries',
      'Galleries never expire',
    ],
    cta: 'Get Essential',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Most popular',
    monthlyPrice: PRICING.pro.monthly,
    yearlyPrice: PRICING.pro.yearly,
    limits: PLAN_LIMITS.pro,
    features: [
      '100GB storage',
      'Up to 31,000 images',
      'Unlimited galleries',
      'Galleries never expire',
    ],
    cta: 'Get Pro',
    popular: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For busy studios',
    monthlyPrice: PRICING.studio.monthly,
    yearlyPrice: PRICING.studio.yearly,
    limits: PLAN_LIMITS.studio,
    features: [
      '500GB storage',
      'Up to 151,000 images',
      'Unlimited galleries',
      'Galleries never expire',
    ],
    cta: 'Get Studio',
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'For power users',
    monthlyPrice: PRICING.elite.monthly,
    yearlyPrice: PRICING.elite.yearly,
    limits: PLAN_LIMITS.elite,
    features: [
      '2TB storage',
      'Up to 600,000 images',
      'Unlimited galleries',
      'Priority support',
    ],
    cta: 'Get Elite',
  },
]

// Helper functions
export function getPlan(id: PlanId): PricingPlan | undefined {
  return PLANS.find(plan => plan.id === id)
}

export function getPlanLimits(id: PlanId): PlanLimits {
  return PLAN_LIMITS[id] || PLAN_LIMITS.free
}

export function getPopularPlan(): PricingPlan | undefined {
  return PLANS.find(plan => plan.popular)
}

export function formatPrice(amount: number, period?: 'month' | 'year'): string {
  if (amount === 0) return 'Free'
  const formatted = `$${amount}`
  if (period) return `${formatted}/${period === 'month' ? 'mo' : 'yr'}`
  return formatted
}

export function formatStorage(gb: number | 'unlimited'): string {
  if (gb === 'unlimited') return 'Unlimited'
  if (gb >= 1000) return `${gb / 1000}TB`
  return `${gb}GB`
}

export function formatImageLimit(limit: number | 'unlimited'): string {
  if (limit === 'unlimited') return 'Unlimited'
  return limit.toLocaleString()
}

// Storage in bytes for calculations
export function getStorageLimitBytes(planId: PlanId): number {
  const limit = PLAN_LIMITS[planId]?.storage_gb
  if (limit === 'unlimited') return Infinity
  return (limit as number) * 1024 * 1024 * 1024 // Convert GB to bytes
}

export function getImageLimit(planId: PlanId): number {
  const limit = PLAN_LIMITS[planId]?.image_limit
  if (limit === 'unlimited') return Infinity
  return limit as number
}

export function getGalleryLimit(planId: PlanId): number {
  const limit = PLAN_LIMITS[planId]?.gallery_limit
  if (limit === 'unlimited') return Infinity
  return limit as number
}

// Compare competitor pricing
export const COMPETITOR_YEARLY_PRICE = 300
export const OUR_YEARLY_PRICE = PRICING.pro.yearly
