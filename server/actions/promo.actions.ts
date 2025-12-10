'use server'

/**
 * Promotional Deals Server Actions
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { 
  PromotionalCampaign, 
  PromoLink, 
  CampaignRedemption,
  CampaignStats 
} from '@/lib/promos/types'
import { revalidatePath } from 'next/cache'

// ============================================================================
// PUBLIC ACTIONS (for landing page)
// ============================================================================

/**
 * Get the currently active campaign for display
 */
export async function getActiveCampaign(): Promise<PromotionalCampaign | null> {
  const { data, error } = await supabaseAdmin
    .rpc('get_active_campaign')
  
  if (error || !data) {
    return null
  }
  
  return data as PromotionalCampaign
}

/**
 * Get campaign by slug (for /promo/[code] pages)
 */
export async function getCampaignBySlug(slug: string): Promise<PromotionalCampaign | null> {
  const { data, error } = await supabaseAdmin
    .rpc('get_campaign_by_slug', { campaign_slug: slug })
  
  if (error || !data) {
    return null
  }
  
  return data as PromotionalCampaign
}

/**
 * Get promo link by code
 */
export async function getPromoLinkByCode(code: string): Promise<PromoLink | null> {
  const { data, error } = await supabaseAdmin
    .from('promo_links')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data as PromoLink
}

/**
 * Record a click on a promo link
 */
export async function recordPromoClick(
  code: string,
  visitorHash: string,
  referrer?: string,
  userAgent?: string,
  country?: string
): Promise<void> {
  await supabaseAdmin.rpc('record_promo_click', {
    link_code: code.toUpperCase(),
    p_visitor_hash: visitorHash,
    p_referrer: referrer || null,
    p_user_agent: userAgent || null,
    p_country: country || null,
  })
}

/**
 * Record a redemption when user subscribes with promo
 */
export async function recordRedemption(params: {
  campaignSlug: string
  userId: string
  email: string
  plan: string
  originalPriceCents: number
  discountedPriceCents: number
  stripeSubscriptionId?: string
  stripeInvoiceId?: string
  promoLinkCode?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}): Promise<void> {
  // Get campaign
  const campaign = await getCampaignBySlug(params.campaignSlug)
  if (!campaign) return
  
  // Get promo link if provided
  let promoLinkId: string | null = null
  if (params.promoLinkCode) {
    const link = await getPromoLinkByCode(params.promoLinkCode)
    promoLinkId = link?.id || null
  }
  
  // Insert redemption
  await supabaseAdmin.from('campaign_redemptions').insert({
    campaign_id: campaign.id,
    user_id: params.userId,
    email: params.email,
    plan: params.plan,
    original_price: params.originalPriceCents,
    discounted_price: params.discountedPriceCents,
    amount_saved: params.originalPriceCents - params.discountedPriceCents,
    stripe_subscription_id: params.stripeSubscriptionId || null,
    stripe_invoice_id: params.stripeInvoiceId || null,
    promo_link_id: promoLinkId,
    utm_source: params.utmSource || null,
    utm_medium: params.utmMedium || null,
    utm_campaign: params.utmCampaign || null,
  })
  
  // Increment campaign counter
  await supabaseAdmin.rpc('increment_campaign_redemption', {
    campaign_slug: params.campaignSlug,
  })
  
  // Update promo link stats if applicable
  if (promoLinkId) {
    await supabaseAdmin
      .from('promo_links')
      .update({
        conversions: supabaseAdmin.rpc('increment', { x: 1 }) as any,
        revenue_cents: supabaseAdmin.rpc('increment', { x: params.discountedPriceCents }) as any,
      })
      .eq('id', promoLinkId)
  }
  
  revalidatePath('/admin/promos')
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

/**
 * Get all campaigns (admin)
 */
export async function getAllCampaigns(): Promise<PromotionalCampaign[]> {
  const { data, error } = await supabaseAdmin
    .from('promotional_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
  
  return data as PromotionalCampaign[]
}

/**
 * Get campaign by ID (admin)
 */
export async function getCampaignById(id: string): Promise<PromotionalCampaign | null> {
  const { data, error } = await supabaseAdmin
    .from('promotional_campaigns')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    return null
  }
  
  return data as PromotionalCampaign
}

/**
 * Create a new campaign
 */
export async function createCampaign(
  campaign: Omit<PromotionalCampaign, 'id' | 'created_at' | 'updated_at' | 'current_redemptions'>
): Promise<{ success: boolean; campaign?: PromotionalCampaign; error?: string }> {
  // If this is featured, unfeatured others
  if (campaign.is_featured) {
    await supabaseAdmin
      .from('promotional_campaigns')
      .update({ is_featured: false })
      .eq('is_featured', true)
  }
  
  const { data, error } = await supabaseAdmin
    .from('promotional_campaigns')
    .insert({
      ...campaign,
      current_redemptions: 0,
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  // Create default promo link
  await supabaseAdmin.from('promo_links').insert({
    campaign_id: data.id,
    code: campaign.slug.toUpperCase(),
    name: 'Main Link',
    utm_source: 'direct',
    utm_medium: 'link',
    utm_campaign: campaign.slug,
  })
  
  revalidatePath('/admin/promos')
  revalidatePath('/')
  
  return { success: true, campaign: data as PromotionalCampaign }
}

/**
 * Update a campaign
 */
export async function updateCampaign(
  id: string,
  updates: Partial<PromotionalCampaign>
): Promise<{ success: boolean; error?: string }> {
  // If setting as featured, unfeatured others
  if (updates.is_featured) {
    await supabaseAdmin
      .from('promotional_campaigns')
      .update({ is_featured: false })
      .neq('id', id)
  }
  
  const { error } = await supabaseAdmin
    .from('promotional_campaigns')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/promos')
  revalidatePath('/')
  
  return { success: true }
}

/**
 * Toggle campaign active status
 */
export async function toggleCampaignActive(id: string): Promise<{ success: boolean }> {
  const campaign = await getCampaignById(id)
  if (!campaign) return { success: false }
  
  await updateCampaign(id, { is_active: !campaign.is_active })
  return { success: true }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(id: string): Promise<{ success: boolean }> {
  const { error } = await supabaseAdmin
    .from('promotional_campaigns')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { success: false }
  }
  
  revalidatePath('/admin/promos')
  revalidatePath('/')
  
  return { success: true }
}

// ============================================================================
// PROMO LINKS ADMIN
// ============================================================================

/**
 * Get all links for a campaign
 */
export async function getCampaignLinks(campaignId: string): Promise<PromoLink[]> {
  const { data, error } = await supabaseAdmin
    .from('promo_links')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })
  
  if (error) {
    return []
  }
  
  return data as PromoLink[]
}

/**
 * Create a promo link
 */
export async function createPromoLink(params: {
  campaignId: string
  code: string
  name?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}): Promise<{ success: boolean; link?: PromoLink; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('promo_links')
    .insert({
      campaign_id: params.campaignId,
      code: params.code.toUpperCase(),
      name: params.name || null,
      utm_source: params.utmSource || null,
      utm_medium: params.utmMedium || null,
      utm_campaign: params.utmCampaign || null,
    })
    .select()
    .single()
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  revalidatePath('/admin/promos')
  
  return { success: true, link: data as PromoLink }
}

/**
 * Delete a promo link
 */
export async function deletePromoLink(id: string): Promise<{ success: boolean }> {
  const { error } = await supabaseAdmin
    .from('promo_links')
    .delete()
    .eq('id', id)
  
  if (error) {
    return { success: false }
  }
  
  revalidatePath('/admin/promos')
  
  return { success: true }
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

/**
 * Get campaign stats
 */
export async function getCampaignStats(campaignId: string): Promise<CampaignStats | null> {
  const { data, error } = await supabaseAdmin
    .rpc('get_campaign_stats', { campaign_id_param: campaignId })
  
  if (error || !data || data.length === 0) {
    return null
  }
  
  return data[0] as CampaignStats
}

/**
 * Get recent redemptions for a campaign
 */
export async function getCampaignRedemptions(
  campaignId: string,
  limit = 20
): Promise<CampaignRedemption[]> {
  const { data, error } = await supabaseAdmin
    .from('campaign_redemptions')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('redeemed_at', { ascending: false })
    .limit(limit)
  
  if (error) {
    return []
  }
  
  return data as CampaignRedemption[]
}

/**
 * Get overall promo stats
 */
export async function getPromoOverviewStats(): Promise<{
  activeCampaigns: number
  totalRedemptions: number
  totalRevenue: number
  totalSavings: number
}> {
  const [campaignsResult, redemptionsResult] = await Promise.all([
    supabaseAdmin
      .from('promotional_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('ends_at', new Date().toISOString())
      .lte('starts_at', new Date().toISOString()),
    supabaseAdmin
      .from('campaign_redemptions')
      .select('discounted_price, amount_saved'),
  ])
  
  const redemptions = redemptionsResult.data || []
  const totalRevenue = redemptions.reduce((sum, r) => sum + (r.discounted_price || 0), 0)
  const totalSavings = redemptions.reduce((sum, r) => sum + (r.amount_saved || 0), 0)
  
  return {
    activeCampaigns: campaignsResult.count || 0,
    totalRedemptions: redemptions.length,
    totalRevenue,
    totalSavings,
  }
}

/**
 * Get enhanced campaign stats with per-campaign breakdown
 */
export async function getEnhancedCampaignStats(campaignId: string): Promise<{
  totalRevenue: number
  totalSavings: number
  redemptionCount: number
  conversionRate: number
  avgOrderValue: number
  topPlan: string | null
  recentRedemptions: CampaignRedemption[]
  dailyRedemptions: { date: string; count: number; revenue: number }[]
}> {
  const [statsResult, redemptionsResult, linksResult] = await Promise.all([
    supabaseAdmin
      .from('campaign_redemptions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('redeemed_at', { ascending: false }),
    supabaseAdmin
      .from('campaign_redemptions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('redeemed_at', { ascending: false })
      .limit(5),
    supabaseAdmin
      .from('promo_links')
      .select('unique_clicks')
      .eq('campaign_id', campaignId),
  ])
  
  const allRedemptions = statsResult.data || []
  const recentRedemptions = redemptionsResult.data || []
  const links = linksResult.data || []
  
  const totalRevenue = allRedemptions.reduce((sum, r) => sum + (r.discounted_price || 0), 0)
  const totalSavings = allRedemptions.reduce((sum, r) => sum + (r.amount_saved || 0), 0)
  const totalClicks = links.reduce((sum, l) => sum + (l.unique_clicks || 0), 0)
  const conversionRate = totalClicks > 0 ? (allRedemptions.length / totalClicks) * 100 : 0
  const avgOrderValue = allRedemptions.length > 0 ? Math.round(totalRevenue / allRedemptions.length) : 0
  
  // Find top plan
  const planCounts: Record<string, number> = {}
  allRedemptions.forEach(r => {
    planCounts[r.plan] = (planCounts[r.plan] || 0) + 1
  })
  const topPlan = Object.entries(planCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  
  // Group by day for chart
  const dailyMap: Record<string, { count: number; revenue: number }> = {}
  allRedemptions.forEach(r => {
    const date = new Date(r.redeemed_at).toISOString().split('T')[0]
    if (!dailyMap[date]) {
      dailyMap[date] = { count: 0, revenue: 0 }
    }
    dailyMap[date].count++
    dailyMap[date].revenue += r.discounted_price || 0
  })
  
  const dailyRedemptions = Object.entries(dailyMap)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))
  
  return {
    totalRevenue,
    totalSavings,
    redemptionCount: allRedemptions.length,
    conversionRate,
    avgOrderValue,
    topPlan,
    recentRedemptions: recentRedemptions as CampaignRedemption[],
    dailyRedemptions,
  }
}

/**
 * Get revenue milestones data
 */
export async function getRevenueMilestones(): Promise<{
  currentRevenue: number
  milestones: { amount: number; label: string; reached: boolean; reachedAt: string | null }[]
  revenueByDay: { date: string; revenue: number; cumulative: number }[]
  signUpsByDay: { date: string; count: number; cumulative: number }[]
}> {
  const { data: redemptions } = await supabaseAdmin
    .from('campaign_redemptions')
    .select('discounted_price, redeemed_at')
    .order('redeemed_at', { ascending: true })
  
  const allRedemptions = redemptions || []
  const currentRevenue = allRedemptions.reduce((sum, r) => sum + (r.discounted_price || 0), 0)
  
  // Define milestones
  const milestoneAmounts = [
    { amount: 10000, label: '$100' },      // $100
    { amount: 50000, label: '$500' },      // $500
    { amount: 100000, label: '$1K' },      // $1,000
    { amount: 250000, label: '$2.5K' },    // $2,500
    { amount: 500000, label: '$5K' },      // $5,000
    { amount: 1000000, label: '$10K' },    // $10,000
    { amount: 2500000, label: '$25K' },    // $25,000
    { amount: 5000000, label: '$50K' },    // $50,000
    { amount: 10000000, label: '$100K' },  // $100,000
  ]
  
  // Calculate when each milestone was reached
  let runningTotal = 0
  const milestoneReachedAt: Record<number, string | null> = {}
  
  for (const r of allRedemptions) {
    runningTotal += r.discounted_price || 0
    for (const m of milestoneAmounts) {
      if (runningTotal >= m.amount && !milestoneReachedAt[m.amount]) {
        milestoneReachedAt[m.amount] = r.redeemed_at
      }
    }
  }
  
  const milestones = milestoneAmounts.map(m => ({
    amount: m.amount,
    label: m.label,
    reached: currentRevenue >= m.amount,
    reachedAt: milestoneReachedAt[m.amount] || null,
  }))
  
  // Group by day for charts
  const dailyMap: Record<string, { revenue: number; count: number }> = {}
  allRedemptions.forEach(r => {
    const date = new Date(r.redeemed_at).toISOString().split('T')[0]
    if (!dailyMap[date]) {
      dailyMap[date] = { revenue: 0, count: 0 }
    }
    dailyMap[date].revenue += r.discounted_price || 0
    dailyMap[date].count++
  })
  
  // Build cumulative arrays
  const sortedDays = Object.keys(dailyMap).sort()
  let cumulativeRevenue = 0
  let cumulativeCount = 0
  
  const revenueByDay = sortedDays.map(date => {
    cumulativeRevenue += dailyMap[date].revenue
    return { date, revenue: dailyMap[date].revenue, cumulative: cumulativeRevenue }
  })
  
  const signUpsByDay = sortedDays.map(date => {
    cumulativeCount += dailyMap[date].count
    return { date, count: dailyMap[date].count, cumulative: cumulativeCount }
  })
  
  return {
    currentRevenue,
    milestones,
    revenueByDay,
    signUpsByDay,
  }
}
