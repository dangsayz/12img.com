/**
 * Admin Billing & Revenue Analytics
 * 
 * Server-only module for revenue metrics from Stripe
 */

import { stripe } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability } from './guards'

export interface RevenueMetrics {
  // MRR & Revenue
  mrr: number // Monthly Recurring Revenue in cents
  arr: number // Annual Recurring Revenue in cents
  
  // Period revenue
  revenueToday: number
  revenueThisWeek: number
  revenueThisMonth: number
  revenueThisYear: number
  
  // Previous period for comparison
  revenuePreviousMonth: number
  
  // Subscriptions
  activeSubscriptions: number
  canceledThisMonth: number
  newSubscriptionsThisMonth: number
  
  // Users
  paidUsers: number // Total users on paid plans
  paidUsersStripe: number // Users with active Stripe subscriptions
  paidUsersManual: number // Users upgraded manually (no Stripe)
  freeUsers: number
  conversionRate: number // paid / total * 100
  
  // Plan breakdown with revenue
  planBreakdown: {
    plan: string
    count: number
    mrr: number
  }[]
}

export interface RecentPayment {
  id: string
  amount: number
  currency: string
  status: string
  customerEmail: string | null
  customerName: string | null
  description: string | null
  created: number
  planName: string | null
}

/**
 * Get comprehensive revenue metrics
 */
export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  await requireCapability('billing.view')
  
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(startOfDay)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  
  // Get all active subscriptions from Stripe
  const subscriptions = await stripe.subscriptions.list({
    status: 'active',
    limit: 100,
    expand: ['data.items.data.price'],
  })
  
  // Calculate MRR from active subscriptions
  let mrr = 0
  const planMrr: Record<string, { count: number; mrr: number }> = {}
  
  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const price = item.price
      let monthlyAmount = 0
      
      if (price.recurring?.interval === 'month') {
        monthlyAmount = price.unit_amount || 0
      } else if (price.recurring?.interval === 'year') {
        monthlyAmount = Math.round((price.unit_amount || 0) / 12)
      }
      
      mrr += monthlyAmount
      
      // Get plan name from metadata or product
      const planName = price.metadata?.plan || price.nickname || 'unknown'
      if (!planMrr[planName]) {
        planMrr[planName] = { count: 0, mrr: 0 }
      }
      planMrr[planName].count++
      planMrr[planName].mrr += monthlyAmount
    }
  }
  
  // Get revenue from charges
  const [
    chargesToday,
    chargesThisWeek,
    chargesThisMonth,
    chargesThisYear,
    chargesPreviousMonth,
  ] = await Promise.all([
    stripe.charges.list({
      created: { gte: Math.floor(startOfDay.getTime() / 1000) },
      limit: 100,
    }),
    stripe.charges.list({
      created: { gte: Math.floor(startOfWeek.getTime() / 1000) },
      limit: 100,
    }),
    stripe.charges.list({
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    }),
    stripe.charges.list({
      created: { gte: Math.floor(startOfYear.getTime() / 1000) },
      limit: 100,
    }),
    stripe.charges.list({
      created: {
        gte: Math.floor(startOfPreviousMonth.getTime() / 1000),
        lte: Math.floor(endOfPreviousMonth.getTime() / 1000),
      },
      limit: 100,
    }),
  ])
  
  const sumSuccessfulCharges = (charges: typeof chargesToday) =>
    charges.data
      .filter(c => c.status === 'succeeded' && !c.refunded)
      .reduce((sum, c) => sum + c.amount, 0)
  
  const revenueToday = sumSuccessfulCharges(chargesToday)
  const revenueThisWeek = sumSuccessfulCharges(chargesThisWeek)
  const revenueThisMonth = sumSuccessfulCharges(chargesThisMonth)
  const revenueThisYear = sumSuccessfulCharges(chargesThisYear)
  const revenuePreviousMonth = sumSuccessfulCharges(chargesPreviousMonth)
  
  // Get subscription stats
  const canceledSubs = await stripe.subscriptions.list({
    status: 'canceled',
    created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
    limit: 100,
  })
  
  const newSubs = await stripe.subscriptions.list({
    created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
    limit: 100,
  })
  
  // Get user counts from database
  const { count: totalUsers } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
  
  const { count: paidUsers } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .neq('plan', 'free')
  
  // Count users with Stripe (subscription OR customer ID = actually paying)
  const { count: paidUsersStripe } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .neq('plan', 'free')
    .or('stripe_subscription_id.not.is.null,stripe_customer_id.not.is.null')
  
  // Manual upgrades = paid plan but no Stripe subscription
  const paidUsersManual = (paidUsers || 0) - (paidUsersStripe || 0)
  
  const freeUsers = (totalUsers || 0) - (paidUsers || 0)
  const conversionRate = totalUsers ? ((paidUsers || 0) / totalUsers) * 100 : 0
  
  return {
    mrr,
    arr: mrr * 12,
    revenueToday,
    revenueThisWeek,
    revenueThisMonth,
    revenueThisYear,
    revenuePreviousMonth,
    activeSubscriptions: subscriptions.data.length,
    canceledThisMonth: canceledSubs.data.length,
    newSubscriptionsThisMonth: newSubs.data.filter(s => s.status === 'active').length,
    paidUsers: paidUsers || 0,
    paidUsersStripe: paidUsersStripe || 0,
    paidUsersManual,
    freeUsers,
    conversionRate: Math.round(conversionRate * 10) / 10,
    planBreakdown: Object.entries(planMrr).map(([plan, data]) => ({
      plan,
      count: data.count,
      mrr: data.mrr,
    })),
  }
}

/**
 * Get recent payments
 */
export async function getRecentPayments(limit = 10): Promise<RecentPayment[]> {
  await requireCapability('billing.view')
  
  const charges = await stripe.charges.list({
    limit,
    expand: ['data.customer'],
  })
  
  return charges.data.map(charge => {
    const customer = charge.customer as any
    
    return {
      id: charge.id,
      amount: charge.amount,
      currency: charge.currency,
      status: charge.status || 'unknown',
      customerEmail: customer?.email || charge.billing_details?.email || null,
      customerName: customer?.name || charge.billing_details?.name || null,
      description: charge.description || null,
      created: charge.created,
      planName: null,
    }
  })
}

/**
 * Get Stripe dashboard link
 */
export async function getStripeDashboardUrl(): Promise<string> {
  // This returns the Stripe dashboard URL
  // In test mode, it's dashboard.stripe.com/test
  const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_')
  return isTestMode 
    ? 'https://dashboard.stripe.com/test' 
    : 'https://dashboard.stripe.com'
}
