import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { stripe, getStripePriceId } from '@/lib/stripe/client'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await request.json()
    
    if (!planId || planId === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = getStripePriceId(planId)
    if (!priceId) {
      return NextResponse.json({ error: 'Price not found for plan' }, { status: 400 })
    }

    // Get user info
    const clerkUser = await currentUser()
    const dbUser = await getOrCreateUserByClerkId(userId)
    
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user already has a Stripe customer ID
    let customerId = dbUser.stripe_customer_id

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: clerkUser?.emailAddresses[0]?.emailAddress,
        name: clerkUser?.fullName || undefined,
        metadata: {
          clerk_user_id: userId,
          db_user_id: dbUser.id,
        },
      })
      customerId = customer.id
      
      // TODO: Save customer ID to database
      // await updateUserStripeCustomerId(dbUser.id, customerId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=true&plan=${planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          db_user_id: dbUser.id,
          plan_id: planId,
        },
      },
      metadata: {
        clerk_user_id: userId,
        db_user_id: dbUser.id,
        plan_id: planId,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
