import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { clerkClient } from '@clerk/nextjs/server'
import { createAdminNotification } from '@/server/admin/notifications'
import { recordRedemption } from '@/server/actions/promo.actions'
import { createVaultFromPayment } from '@/server/actions/vault.actions'
import { sendNewSubscriptionNotification, sendCancellationNotification, sendPaymentFailedNotification } from '@/server/services/admin-email.service'
import { handlePaymentFailure, handlePaymentRecovered, downgradeUser, restoreUserGalleries, logSubscriptionEvent } from '@/server/services/subscription.service'
import type { VaultPlanId } from '@/lib/config/vault-pricing'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Map Stripe price IDs back to plan IDs
function getPlanIdFromPriceId(priceId: string): string {
  const priceMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY!]: 'essential',
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
    [process.env.STRIPE_PRICE_STUDIO_MONTHLY!]: 'studio',
    [process.env.STRIPE_PRICE_ELITE_MONTHLY!]: 'elite',
  }
  return priceMap[priceId] || 'free'
}

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentFailed(invoice, event.id)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaymentSucceeded(invoice, event.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Check if this is a vault subscription
  if (session.metadata?.type === 'vault_subscription') {
    await handleVaultCheckoutCompleted(session)
    return
  }

  const clerkUserId = session.metadata?.clerk_user_id
  const dbUserId = session.metadata?.db_user_id
  const planId = session.metadata?.plan_id
  const promoCode = session.metadata?.promo_code

  if (!clerkUserId || !dbUserId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Update user in Supabase - also clear any grace period state and restore galleries
  await supabaseAdmin
    .from('users')
    .update({
      plan: planId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      subscription_status: 'active',
      payment_failed_at: null,
      payment_failure_count: 0,
      grace_period_ends_at: null,
    })
    .eq('id', dbUserId)

  // Restore any archived galleries from previous downgrade
  const restoredCount = await restoreUserGalleries(dbUserId)
  if (restoredCount > 0) {
    console.log(`✅ Restored ${restoredCount} archived galleries for user ${clerkUserId}`)
  }

  // Update Clerk user metadata
  const clerk = await clerkClient()
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      plan: planId,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
    },
  })

  console.log(`✅ User ${clerkUserId} upgraded to ${planId}`)

  // Record promo redemption if a promo code was used
  if (promoCode) {
    try {
      // Get user email for redemption record
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email')
        .eq('id', dbUserId)
        .single()
      
      await recordRedemption({
        campaignSlug: promoCode.toLowerCase(),
        userId: dbUserId,
        email: userData?.email || '',
        plan: planId,
        originalPriceCents: session.amount_total || 0, // This is already discounted
        discountedPriceCents: session.amount_total || 0,
        stripeSubscriptionId: session.subscription as string,
      })
      console.log(`✅ Promo redemption recorded: ${promoCode} for user ${dbUserId}`)
    } catch (error) {
      console.error('Failed to record promo redemption:', error)
      // Don't fail the webhook for this
    }
  }

  // Get user email for notifications
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('email, display_name')
    .eq('id', dbUserId)
    .single()

  // Create admin notification
  await createAdminNotification(
    'new_subscription',
    `New payment: ${userData?.email || 'Unknown'}`,
    `Subscribed to ${planId.charAt(0).toUpperCase() + planId.slice(1)} plan${promoCode ? ` (promo: ${promoCode})` : ''}`,
    { user_id: dbUserId, plan: planId, customer_id: session.customer, promo_code: promoCode }
  )

  // Send admin email notification
  await sendNewSubscriptionNotification({
    email: userData?.email || 'Unknown',
    name: userData?.display_name || undefined,
    plan: planId.charAt(0).toUpperCase() + planId.slice(1),
    amount: session.amount_total || 0,
    currency: session.currency || 'usd',
    interval: (session.metadata?.billing_interval as 'month' | 'year') || 'month',
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerk_user_id
  const dbUserId = subscription.metadata?.db_user_id

  if (!clerkUserId || !dbUserId) {
    // Try to find user by customer ID
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id')
      .eq('stripe_customer_id', subscription.customer)
      .single()

    if (!user) {
      console.error('Could not find user for subscription update')
      return
    }
  }

  // Get the new plan from the subscription
  const priceId = subscription.items.data[0]?.price.id
  const newPlanId = priceId ? getPlanIdFromPriceId(priceId) : 'free'

  // Determine status
  const isActive = subscription.status === 'active' || subscription.status === 'trialing'
  const finalPlan = isActive ? newPlanId : 'free'

  // Update Supabase
  const { data: user } = await supabaseAdmin
    .from('users')
    .update({
      plan: finalPlan,
      stripe_subscription_id: subscription.id,
    })
    .eq('stripe_customer_id', subscription.customer)
    .select('clerk_id')
    .single()

  // Update Clerk
  if (user?.clerk_id) {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(user.clerk_id, {
      publicMetadata: {
        plan: finalPlan,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      },
    })
  }

  console.log(`✅ Subscription updated: ${subscription.id} -> ${finalPlan}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Get user details first
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('id, clerk_id, email, display_name, plan')
    .eq('stripe_customer_id', subscription.customer)
    .single()

  if (!userData) {
    console.error('Could not find user for subscription deletion')
    return
  }

  const previousPlan = userData.plan

  // Use the subscription service to handle downgrade with gallery archiving
  const { success, archivedCount } = await downgradeUser(userData.id, 'subscription_canceled')

  if (!success) {
    console.error('Failed to downgrade user')
    return
  }

  // Clear Stripe subscription ID
  await supabaseAdmin
    .from('users')
    .update({ stripe_subscription_id: null })
    .eq('id', userData.id)

  // Update Clerk
  if (userData.clerk_id) {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(userData.clerk_id, {
      publicMetadata: {
        plan: 'free',
        stripeSubscriptionId: null,
        subscriptionStatus: 'canceled',
        previousPlan,
      },
    })
  }

  console.log(`✅ Subscription canceled, user downgraded to free, ${archivedCount} galleries archived`)

  // Create admin notification
  await createAdminNotification(
    'subscription_cancelled',
    `Cancellation: ${userData.email || 'Unknown'}`,
    `User cancelled their subscription${archivedCount > 0 ? ` (${archivedCount} galleries archived)` : ''}`,
    { customer_id: subscription.customer, email: userData.email, archived_galleries: archivedCount }
  )

  // Send admin email notification
  await sendCancellationNotification({
    email: userData.email || 'Unknown',
    name: userData.display_name || undefined,
    plan: previousPlan || 'Unknown',
  })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, stripeEventId: string) {
  const customerId = invoice.customer as string
  
  // Use the subscription service to track payment failure
  const result = await handlePaymentFailure(customerId, stripeEventId)
  
  if (!result) {
    console.error('⚠️ Payment failed but could not find user:', customerId)
    return
  }

  // Get user details for notification
  const { data: userData } = await supabaseAdmin
    .from('users')
    .select('email, display_name, plan, grace_period_ends_at')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!userData) return

  // Create admin notification
  await createAdminNotification(
    'payment_failed',
    `Payment failed: ${userData.email}`,
    `Attempt ${result.failureCount}${result.inGracePeriod ? ` - Grace period ends ${new Date(userData.grace_period_ends_at!).toLocaleDateString()}` : ''}`,
    { 
      customer_id: customerId, 
      email: userData.email,
      failure_count: result.failureCount,
      grace_period_ends_at: userData.grace_period_ends_at,
    }
  )

  // Send payment failed email notification to admin
  if (typeof sendPaymentFailedNotification === 'function') {
    await sendPaymentFailedNotification({
      email: userData.email,
      name: userData.display_name || undefined,
      plan: userData.plan,
      failureCount: result.failureCount,
      gracePeriodEndsAt: userData.grace_period_ends_at || undefined,
    })
  }

  console.log(`⚠️ Payment failed for ${userData.email} (attempt ${result.failureCount})`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, stripeEventId: string) {
  const customerId = invoice.customer as string
  
  // Check if this was a recovery from a failed payment
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, payment_failure_count')
    .eq('stripe_customer_id', customerId)
    .single()

  if (user && user.payment_failure_count > 0) {
    // This payment recovered from a previous failure
    await handlePaymentRecovered(customerId, stripeEventId)
    console.log(`✅ Payment recovered for customer ${customerId}`)
  }
}

// ============================================
// VAULT SUBSCRIPTION HANDLERS
// ============================================

async function handleVaultCheckoutCompleted(session: Stripe.Checkout.Session) {
  const invitationToken = session.metadata?.invitation_token
  const vaultPlanId = session.metadata?.vault_plan_id as VaultPlanId
  const billingPeriod = session.metadata?.billing_period as 'monthly' | 'annual'

  if (!invitationToken || !vaultPlanId || !billingPeriod) {
    console.error('[Vault Webhook] Missing metadata in checkout session')
    return
  }

  const result = await createVaultFromPayment({
    invitationToken,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    vaultPlanId,
    billingPeriod,
  })

  if (result.error) {
    console.error('[Vault Webhook] Failed to create vault:', result.error)
    return
  }

  console.log(`✅ Vault created for ${session.customer_email}: ${result.vault?.id}`)

  // Create admin notification
  await createAdminNotification(
    'new_subscription',
    `New Vault: ${session.customer_email}`,
    `Client purchased ${vaultPlanId} vault (${billingPeriod})`,
    { 
      vault_id: result.vault?.id,
      customer_email: session.customer_email,
      plan: vaultPlanId,
      billing_period: billingPeriod,
    }
  )

  // TODO: Send confirmation email to client with access link
}
