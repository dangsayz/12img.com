import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getCampaignBySlug, getPromoLinkByCode, recordPromoClick } from '@/server/actions/promo.actions'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { PromoLandingClient } from './PromoLandingClient'

interface Props {
  params: Promise<{ code: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const campaign = await getCampaignBySlug(code.toLowerCase())
  
  if (!campaign) {
    return {
      title: 'Promo Not Found | 12img',
    }
  }
  
  return {
    title: `${campaign.name} | 12img`,
    description: campaign.banner_subheadline || campaign.description || campaign.banner_headline,
    openGraph: {
      title: campaign.banner_headline,
      description: campaign.banner_subheadline || campaign.description || undefined,
    },
  }
}

export default async function PromoPage({ params, searchParams }: Props) {
  const { code } = await params
  const search = await searchParams
  
  // Try to find campaign by slug first, then by promo link code
  let campaign = await getCampaignBySlug(code.toLowerCase())
  const promoLink = await getPromoLinkByCode(code.toUpperCase())
  
  // If we found a promo link but not a campaign, get the campaign from the link
  if (!campaign && promoLink) {
    campaign = await getCampaignBySlug(code.toLowerCase())
  }
  
  if (!campaign) {
    notFound()
  }
  
  // Record the click server-side
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  const referer = headersList.get('referer') || undefined
  
  const visitorHash = crypto
    .createHash('sha256')
    .update(`${ip}-${userAgent}`)
    .digest('hex')
    .slice(0, 16)
  
  await recordPromoClick(
    code.toUpperCase(),
    visitorHash,
    referer,
    userAgent,
    undefined
  )
  
  // Build redirect URL
  const targetPlan = campaign.target_plans[0] || 'pro'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com'
  
  // Pass data to client component which will store promo and redirect
  return (
    <PromoLandingClient
      campaign={{
        code: campaign.stripe_coupon_id || campaign.slug,
        campaignSlug: campaign.slug,
        plan: targetPlan,
        discount: campaign.discount_value,
        discountType: campaign.discount_type,
        headline: campaign.banner_headline,
        subheadline: campaign.banner_subheadline,
        badgeText: campaign.badge_text,
        spotsRemaining: campaign.max_redemptions 
          ? campaign.max_redemptions - campaign.current_redemptions 
          : null,
      }}
      redirectUrl={`${baseUrl}/sign-up?plan=${targetPlan}&promo=${campaign.stripe_coupon_id || campaign.slug}`}
      utmParams={{
        source: search.utm_source,
        medium: search.utm_medium,
        campaign: search.utm_campaign,
      }}
    />
  )
}
