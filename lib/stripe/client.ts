import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
})

// Map plan IDs to Stripe price IDs
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY,
  pro: process.env.STRIPE_PRICE_PRO_MONTHLY,
  studio: process.env.STRIPE_PRICE_STUDIO_MONTHLY,
  elite: process.env.STRIPE_PRICE_ELITE_MONTHLY,
}

export function getStripePriceId(planId: string): string | undefined {
  return STRIPE_PRICE_IDS[planId]
}
