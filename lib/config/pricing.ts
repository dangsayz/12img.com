/**
 * Centralized Pricing Configuration v3
 * 
 * COMPETITIVE PRICING WITH VALUE FOCUS
 * - Free: 5GB (matches CloudSpot)
 * - Starter: $7/mo, 20GB (beats Pic-Time)
 * - Pro: $19/mo, 100GB (undercuts everyone)
 * - Studio: $34/mo, 500GB (feature-rich)
 * - Elite: $54/mo, 2TB (unlimited everything)
 * 
 * Psychology: Charm pricing, anchoring, value framing
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

// Core pricing values (charm pricing: $7, $19, $34, $54)
export const PRICING = {
  free: { monthly: 0, yearly: 0 },
  essential: { monthly: 7, yearly: 59 },      // "Starter" in UI
  pro: { monthly: 19, yearly: 159 },          // Most popular
  studio: { monthly: 34, yearly: 289 },       // For teams
  elite: { monthly: 54, yearly: 449 },        // Unlimited
} as const

// Plan limits for enforcement
export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    storage_gb: 5,           // Matches CloudSpot, beats Pixieset
    image_limit: 3000,
    gallery_limit: 5,
    expiry_days: 30,         // 30 days creates upgrade urgency
  },
  essential: {
    storage_gb: 20,          // Beats Pic-Time Beginner
    image_limit: 8000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
  pro: {
    storage_gb: 100,         // Industry standard at this tier
    image_limit: 40000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
  studio: {
    storage_gb: 500,         // Matches CloudSpot Pro
    image_limit: 200000,
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
  elite: {
    storage_gb: 2000,        // 2TB - sustainable "unlimited"
    image_limit: 'unlimited',
    gallery_limit: 'unlimited',
    expiry_days: 'unlimited',
  },
}

// Full plan definitions for UI
export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Try everything free',
    monthlyPrice: PRICING.free.monthly,
    yearlyPrice: PRICING.free.yearly,
    limits: PLAN_LIMITS.free,
    features: [
      '5GB storage',
      '5 galleries',
      'Client portal',
      '30-day gallery expiry',
    ],
    cta: 'Start free',
  },
  {
    id: 'essential',
    name: 'Starter',  // Display name changed, ID stays for compatibility
    description: 'Everything you need',
    monthlyPrice: PRICING.essential.monthly,
    yearlyPrice: PRICING.essential.yearly,
    limits: PLAN_LIMITS.essential,
    features: [
      '20GB storage',
      'Unlimited galleries',
      '3 contracts/month',
      'Email tracking',
    ],
    cta: 'Get Starter',
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
      '15 contracts/month',
      'Automated workflows',
      'Vendor network',
    ],
    cta: 'Get Pro',
    popular: true,
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For busy teams',
    monthlyPrice: PRICING.studio.monthly,
    yearlyPrice: PRICING.studio.yearly,
    limits: PLAN_LIMITS.studio,
    features: [
      '500GB storage',
      '50 contracts/month',
      'Priority support',
      'Advanced analytics',
    ],
    cta: 'Get Studio',
  },
  {
    id: 'elite',
    name: 'Elite',
    description: 'Unlimited everything',
    monthlyPrice: PRICING.elite.monthly,
    yearlyPrice: PRICING.elite.yearly,
    limits: PLAN_LIMITS.elite,
    features: [
      '2TB storage',
      'Unlimited contracts',
      'White-glove support',
      'Custom integrations',
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
