import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getStripePriceId } from '@/lib/stripe/client'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { getPromoFromCookies } from '@/lib/promo/persistence'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, promoCode } = await request.json()
    
    if (!planId || planId === 'free') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceId = getStripePriceId(planId)
    if (!priceId) {
      return NextResponse.json({ error: 'Price not found for plan' }, { status: 400 })
    }

    // Get promo code from request body, or from cookies
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie')
    const storedPromo = getPromoFromCookies(cookieHeader)
    const couponCode = promoCode || storedPromo?.code

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

    // Build checkout session config
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=true&plan=${planId}${couponCode ? `&promo=${couponCode}` : ''}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          clerk_user_id: userId,
          db_user_id: dbUser.id,
          plan_id: planId,
          promo_code: couponCode || '',
        },
      },
      metadata: {
        clerk_user_id: userId,
        db_user_id: dbUser.id,
        plan_id: planId,
        promo_code: couponCode || '',
      },
    }

    // Apply coupon if we have one
    if (couponCode) {
      // Validate the coupon exists in Stripe
      try {
        const coupon = await stripe.coupons.retrieve(couponCode)
        if (coupon && coupon.valid) {
          sessionConfig.discounts = [{ coupon: couponCode }]
          console.log(`[Checkout] Applying coupon: ${couponCode}`)
        } else {
          console.log(`[Checkout] Coupon invalid or expired: ${couponCode}`)
        }
      } catch (couponError) {
        // Coupon doesn't exist, continue without it
        console.log(`[Checkout] Coupon not found: ${couponCode}`, couponError)
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ 
      url: session.url,
      couponApplied: !!sessionConfig.discounts,
      couponCode: couponCode || null,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
