import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { clerkClient } from '@clerk/nextjs/server'
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
        await handlePaymentFailed(invoice)
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
  const clerkUserId = session.metadata?.clerk_user_id
  const dbUserId = session.metadata?.db_user_id
  const planId = session.metadata?.plan_id

  if (!clerkUserId || !dbUserId || !planId) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Update user in Supabase
  await supabaseAdmin
    .from('users')
    .update({
      plan: planId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', dbUserId)

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
  // Downgrade user to free plan
  const { data: user } = await supabaseAdmin
    .from('users')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('stripe_customer_id', subscription.customer)
    .select('clerk_id')
    .single()

  if (user?.clerk_id) {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(user.clerk_id, {
      publicMetadata: {
        plan: 'free',
        stripeSubscriptionId: null,
        subscriptionStatus: 'canceled',
      },
    })
  }

  console.log(`✅ Subscription canceled, user downgraded to free`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Log payment failure - could send email notification here
  console.log(`⚠️ Payment failed for customer: ${invoice.customer}`)
  
  // Optionally: Send email to user about failed payment
  // await sendPaymentFailedEmail(invoice.customer_email)
}
