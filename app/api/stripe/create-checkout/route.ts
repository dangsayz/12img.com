import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, getStripePriceId } from '@/lib/stripe/client'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { getPromoFromCookies } from '@/lib/promo/persistence'
import { headers } from 'next/headers'

// Founder's deal: $25/month for Elite (normally $54/month)
const FOUNDERS_PRICE_ID = 'price_1ScyI88bvfxoPxbAY7zquBRA'
const FOUNDERS_PROMO_CODES = ['founders-100', 'FOUNDERS100', 'founders100', 'founder100', 'FOUNDER100']

// Helper to check if a promo code is a Founder's code
function isFoundersPromoCode(code: string | null | undefined): boolean {
  if (!code) return false
  return FOUNDERS_PROMO_CODES.some(c => c.toLowerCase() === code.toLowerCase())
}

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

    // Get promo code from request body, or from cookies
    const headersList = await headers()
    const cookieHeader = headersList.get('cookie')
    const storedPromo = getPromoFromCookies(cookieHeader)
    const couponCode = promoCode || storedPromo?.code

    // Check if this is a Founder's deal - use special $30/year price
    const isFoundersDeal = couponCode && FOUNDERS_PROMO_CODES.some(
      code => code.toLowerCase() === couponCode.toLowerCase()
    ) && planId === 'elite'

    // Use Founder's price if applicable, otherwise regular price
    const priceId = isFoundersDeal ? FOUNDERS_PRICE_ID : getStripePriceId(planId)
    if (!priceId) {
      return NextResponse.json({ error: 'Price not found for plan' }, { status: 400 })
    }

    console.log(`[Checkout] Plan: ${planId}, Promo: ${couponCode}, Founders Deal: ${isFoundersDeal}, Price: ${priceId}`)

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
      allow_promotion_codes: true, // Let customers enter promo codes at checkout
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
    // BUT: Founder's codes should ONLY work for Elite (price is already $30/year)
    // Don't apply Founder's coupon to other plans - it would give 44% off everything!
    const shouldApplyCoupon = couponCode && !isFoundersDeal && !isFoundersPromoCode(couponCode)
    
    if (shouldApplyCoupon) {
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
    } else if (isFoundersPromoCode(couponCode) && planId !== 'elite') {
      // User has Founder's code but is buying a different plan - don't apply it
      console.log(`[Checkout] Founder's code ${couponCode} only valid for Elite, not ${planId}`)
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
