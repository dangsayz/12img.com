/**
 * Centralized Pricing Configuration
 * 
 * All pricing information for 12img is defined here.
 * Update this file to change pricing across the entire application.
 */

export type PlanId = 'free' | 'basic' | 'pro' | 'studio'

export interface PricingPlan {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  yearlyDiscount: string // e.g., "Save 2 months"
  features: string[]
  limits: {
    galleries: number | 'unlimited'
    imagesPerGallery: number | 'unlimited'
    storage?: string
    linkExpiry: string
  }
  cta: string
  ctaHref: string
  popular?: boolean
  badge?: string
}

// Core pricing values - change these to update prices everywhere
export const PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
  },
  basic: {
    monthly: 10,
    yearly: 100, // Save $20/year
  },
  pro: {
    monthly: 15,
    yearly: 150, // Save $30/year (2 months free)
  },
  studio: {
    monthly: 20,
    yearly: 200, // Save $40/year (2 months free)
  },
} as const

// Full plan definitions
export const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect to try it out',
    monthlyPrice: PRICING.free.monthly,
    yearlyPrice: PRICING.free.yearly,
    yearlyDiscount: 'Free forever',
    features: [
      '3 galleries',
      '50 images per gallery',
      'Password protection',
      '7-day link expiry',
    ],
    limits: {
      galleries: 3,
      imagesPerGallery: 50,
      linkExpiry: '7 days',
    },
    cta: 'Get started',
    ctaHref: '/sign-up',
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'For hobbyists',
    monthlyPrice: PRICING.basic.monthly,
    yearlyPrice: PRICING.basic.yearly,
    yearlyDiscount: 'Save $20/year',
    features: [
      '10 galleries',
      '200 images per gallery',
      'High quality exports',
      'Password protection',
      '30-day link expiry',
    ],
    limits: {
      galleries: 10,
      imagesPerGallery: 200,
      linkExpiry: '30 days',
    },
    cta: 'Get Basic',
    ctaHref: '/sign-up?plan=basic',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Most popular for pros',
    monthlyPrice: PRICING.pro.monthly,
    yearlyPrice: PRICING.pro.yearly,
    yearlyDiscount: 'Save 2 months',
    features: [
      '50 galleries',
      '500 images per gallery',
      'Auto ZIP backup',
      'Custom branding',
      'Analytics dashboard',
      'No link expiry',
    ],
    limits: {
      galleries: 50,
      imagesPerGallery: 500,
      linkExpiry: 'Never expires',
    },
    cta: 'Get Pro',
    ctaHref: '/sign-up?plan=pro',
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'studio',
    name: 'Studio',
    description: 'For high-volume professionals',
    monthlyPrice: PRICING.studio.monthly,
    yearlyPrice: PRICING.studio.yearly,
    yearlyDiscount: 'Save 2 months',
    features: [
      'Unlimited galleries',
      'Unlimited images',
      'Everything in Pro',
      'Priority support',
      'Team access (coming)',
      'Custom domain',
      'White-label',
    ],
    limits: {
      galleries: 'unlimited',
      imagesPerGallery: 'unlimited',
      linkExpiry: 'Never expires',
    },
    cta: 'Get Studio',
    ctaHref: '/sign-up?plan=studio',
  },
]

// Helper functions
export function getPlan(id: PlanId): PricingPlan | undefined {
  return PLANS.find(plan => plan.id === id)
}

export function getPopularPlan(): PricingPlan | undefined {
  return PLANS.find(plan => plan.popular)
}

export function formatPrice(amount: number, period?: 'month' | 'year'): string {
  if (amount === 0) return 'Free'
  const formatted = `$${amount}`
  if (period) return `${formatted}/${period}`
  return formatted
}

export function getYearlySavings(planId: PlanId): number {
  const plan = PRICING[planId]
  return (plan.monthly * 12) - plan.yearly
}

// Compare competitor pricing
export const COMPETITOR_YEARLY_PRICE = 300 // What competitors charge per year
export const OUR_YEARLY_PRICE = PRICING.pro.yearly // Our Pro plan yearly

