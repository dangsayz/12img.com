import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getCampaignBySlug, getPromoLinkByCode, recordPromoClick } from '@/server/actions/promo.actions'
import { headers } from 'next/headers'
import crypto from 'crypto'

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
  let promoLink = await getPromoLinkByCode(code.toUpperCase())
  
  // If we found a promo link but not a campaign, get the campaign from the link
  if (!campaign && promoLink) {
    // The promo link has a campaign_id, but we need to fetch by slug
    // For now, just check if the code matches a campaign slug
    campaign = await getCampaignBySlug(code.toLowerCase())
  }
  
  if (!campaign) {
    notFound()
  }
  
  // Record the click
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  const referer = headersList.get('referer') || undefined
  
  // Create a hash for unique visitor tracking (privacy-preserving)
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
    undefined // country - could add geo lookup later
  )
  
  // Build the redirect URL with promo code
  const targetPlan = campaign.target_plans[0] || 'pro'
  const redirectUrl = new URL('/sign-up', process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com')
  redirectUrl.searchParams.set('plan', targetPlan)
  redirectUrl.searchParams.set('promo', campaign.stripe_coupon_id || campaign.slug)
  
  // Pass through UTM params
  if (search.utm_source) redirectUrl.searchParams.set('utm_source', search.utm_source)
  if (search.utm_medium) redirectUrl.searchParams.set('utm_medium', search.utm_medium)
  if (search.utm_campaign) redirectUrl.searchParams.set('utm_campaign', search.utm_campaign)
  
  // Redirect to sign-up with promo applied
  redirect(redirectUrl.toString())
}
