/**
 * Promotional Deals System Types
 */

export type DiscountType = 'percent' | 'fixed' | 'price_override'
export type DiscountDuration = 'once' | 'forever' | 'repeating'
export type LandingPosition = 'hero' | 'above_pricing' | 'floating' | 'none'

export interface PromotionalCampaign {
  id: string
  slug: string
  name: string
  description: string | null
  
  // Timing
  starts_at: string
  ends_at: string
  
  // Limits
  max_redemptions: number | null
  current_redemptions: number
  
  // Targeting
  target_plans: string[]
  new_users_only: boolean
  
  // Discount
  discount_type: DiscountType
  discount_value: number
  discount_duration: DiscountDuration
  discount_months: number | null
  
  // Stripe
  stripe_coupon_id: string | null
  stripe_price_ids: Record<string, string>
  
  // Display
  badge_text: string | null
  banner_headline: string
  banner_subheadline: string | null
  banner_cta: string
  banner_bg_color: string
  banner_text_color: string
  banner_accent_color: string
  
  // Options
  show_countdown: boolean
  show_spots_remaining: boolean
  show_original_price: boolean
  
  // Landing
  show_on_landing: boolean
  show_on_pricing: boolean
  landing_position: LandingPosition
  
  // Status
  is_active: boolean
  is_featured: boolean
  
  // Audit
  created_at: string
  created_by: string | null
  updated_at: string
}

export interface CampaignRedemption {
  id: string
  campaign_id: string
  user_id: string | null
  email: string | null
  plan: string
  original_price: number
  discounted_price: number
  amount_saved: number
  stripe_subscription_id: string | null
  stripe_invoice_id: string | null
  promo_link_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  redeemed_at: string
}

export interface PromoLink {
  id: string
  campaign_id: string
  code: string
  name: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  clicks: number
  unique_clicks: number
  conversions: number
  revenue_cents: number
  is_active: boolean
  created_at: string
  expires_at: string | null
}

export interface CampaignStats {
  total_redemptions: number
  total_revenue_cents: number
  total_savings_cents: number
  conversion_rate: number
  top_plan: string | null
  avg_order_value: number
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export function getSpotsRemaining(campaign: PromotionalCampaign): number | null {
  if (campaign.max_redemptions === null) return null
  return Math.max(0, campaign.max_redemptions - campaign.current_redemptions)
}

export function getTimeRemaining(campaign: PromotionalCampaign): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
  isUrgent: boolean
} {
  const now = new Date()
  const end = new Date(campaign.ends_at)
  const diff = end.getTime() - now.getTime()
  
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: false }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  // Urgent if less than 24 hours
  const isUrgent = diff < 24 * 60 * 60 * 1000
  
  return { days, hours, minutes, seconds, isExpired: false, isUrgent }
}

export function formatDiscount(campaign: PromotionalCampaign): string {
  switch (campaign.discount_type) {
    case 'percent':
      return `${campaign.discount_value}% OFF`
    case 'fixed':
      return `$${(campaign.discount_value / 100).toFixed(0)} OFF`
    case 'price_override':
      return `$${(campaign.discount_value / 100).toFixed(0)}`
    default:
      return ''
  }
}

export function calculateDiscountedPrice(
  originalPriceCents: number,
  campaign: PromotionalCampaign
): number {
  switch (campaign.discount_type) {
    case 'percent':
      return Math.round(originalPriceCents * (1 - campaign.discount_value / 100))
    case 'fixed':
      return Math.max(0, originalPriceCents - campaign.discount_value)
    case 'price_override':
      return campaign.discount_value
    default:
      return originalPriceCents
  }
}

export function calculateSavings(
  originalPriceCents: number,
  campaign: PromotionalCampaign
): number {
  const discounted = calculateDiscountedPrice(originalPriceCents, campaign)
  return originalPriceCents - discounted
}

export function formatSavingsPercent(
  originalPriceCents: number,
  campaign: PromotionalCampaign
): string {
  const savings = calculateSavings(originalPriceCents, campaign)
  const percent = Math.round((savings / originalPriceCents) * 100)
  return `${percent}%`
}

// ============================================================================
// PROMO LINK HELPERS
// ============================================================================

export function getPromoUrl(code: string, baseUrl = 'https://12img.com'): string {
  return `${baseUrl}/promo/${code}`
}

export function getPromoSignupUrl(
  plan: string,
  code: string,
  baseUrl = 'https://12img.com'
): string {
  return `${baseUrl}/sign-up?plan=${plan}&promo=${code}`
}

export function buildUtmUrl(
  baseUrl: string,
  params: { source?: string; medium?: string; campaign?: string }
): string {
  const url = new URL(baseUrl)
  if (params.source) url.searchParams.set('utm_source', params.source)
  if (params.medium) url.searchParams.set('utm_medium', params.medium)
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign)
  return url.toString()
}

// ============================================================================
// CAMPAIGN TEMPLATES
// ============================================================================

export interface CampaignTemplate {
  id: string
  name: string
  description: string
  discount_type: DiscountType
  discount_value: number
  target_plans: string[]
  badge_text: string
  banner_headline: string
  banner_subheadline: string
  suggested_duration_days: number
  suggested_max_redemptions: number | null
}

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    id: 'founder',
    name: 'Founder\'s Pricing',
    description: 'Limited spots at a special launch price',
    discount_type: 'price_override',
    discount_value: 2500, // $25/month
    target_plans: ['elite'],
    badge_text: 'FOUNDER PRICING',
    banner_headline: 'First 100 get Elite for $25/month',
    banner_subheadline: '2TB storage. Unlimited galleries. Unlimited contracts. Save $29/month.',
    suggested_duration_days: 90,
    suggested_max_redemptions: 100,
  },
  {
    id: 'black_friday',
    name: 'Black Friday',
    description: '50% off all annual plans',
    discount_type: 'percent',
    discount_value: 50,
    target_plans: ['essential', 'pro', 'studio', 'elite'],
    badge_text: '50% OFF',
    banner_headline: 'Black Friday: 50% off all plans',
    banner_subheadline: 'Biggest sale of the year. Ends Monday.',
    suggested_duration_days: 5,
    suggested_max_redemptions: null,
  },
  {
    id: 'new_year',
    name: 'New Year Sale',
    description: '40% off to start the year right',
    discount_type: 'percent',
    discount_value: 40,
    target_plans: ['essential', 'pro', 'studio', 'elite'],
    badge_text: '40% OFF',
    banner_headline: 'New Year, New Workflow',
    banner_subheadline: '40% off all annual plans. Start 2025 organized.',
    suggested_duration_days: 14,
    suggested_max_redemptions: null,
  },
  {
    id: 'wedding_season',
    name: 'Wedding Season',
    description: '30% off for busy season prep',
    discount_type: 'percent',
    discount_value: 30,
    target_plans: ['pro', 'studio', 'elite'],
    badge_text: '30% OFF',
    banner_headline: 'Wedding Season Prep',
    banner_subheadline: '30% off Pro & Studio. Book more, deliver faster.',
    suggested_duration_days: 28,
    suggested_max_redemptions: null,
  },
  {
    id: 'summer',
    name: 'Summer Sale',
    description: '25% off for peak season',
    discount_type: 'percent',
    discount_value: 25,
    target_plans: ['essential', 'pro', 'studio', 'elite'],
    badge_text: '25% OFF',
    banner_headline: 'Summer Sale',
    banner_subheadline: '25% off all plans. Get ready for peak season.',
    suggested_duration_days: 14,
    suggested_max_redemptions: null,
  },
  {
    id: 'flash',
    name: 'Flash Sale',
    description: '24-hour limited offer',
    discount_type: 'percent',
    discount_value: 35,
    target_plans: ['pro', 'studio'],
    badge_text: '24HR FLASH',
    banner_headline: 'Flash Sale: 35% off Pro & Studio',
    banner_subheadline: 'Today only. Don\'t miss out.',
    suggested_duration_days: 1,
    suggested_max_redemptions: null,
  },
]

// ============================================================================
// SOCIAL COPY GENERATORS
// ============================================================================

export function generateInstagramCopy(campaign: PromotionalCampaign, promoCode: string): string {
  const spots = getSpotsRemaining(campaign)
  const spotsText = spots !== null ? `\n\n[${spots} spots left]` : ''
  
  return `${campaign.banner_headline}

${campaign.banner_subheadline || ''}
${spotsText}
→ 12img.com/promo/${promoCode}`
}

export function generateTwitterCopy(campaign: PromotionalCampaign, promoCode: string): string {
  const spots = getSpotsRemaining(campaign)
  const spotsText = spots !== null ? `[${spots} spots left]` : ''
  
  return `${campaign.banner_headline}

${campaign.banner_subheadline || ''}

Claim yours: 12img.com/promo/${promoCode}

${spotsText}`
}

export function generateEmailSubjectLines(campaign: PromotionalCampaign): string[] {
  const spots = getSpotsRemaining(campaign)
  const discount = formatDiscount(campaign)
  
  const subjects = [
    `${discount}: ${campaign.name}`,
    campaign.banner_headline,
  ]
  
  if (spots !== null && spots < 50) {
    subjects.push(`Only ${spots} spots left at this price`)
    subjects.push(`${spots} spots remaining — ${campaign.name}`)
  }
  
  subjects.push(`Last chance: ${campaign.name} ends soon`)
  
  return subjects
}
