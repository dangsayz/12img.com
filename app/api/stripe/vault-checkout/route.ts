import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { stripe } from '@/lib/stripe/client'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { VAULT_PLANS, type VaultPlanId } from '@/lib/config/vault-pricing'

/**
 * Create a Stripe checkout session for vault purchase.
 * No auth required - uses invitation token.
 */
export async function POST(request: Request) {
  try {
    const { invitationToken, planId, billingPeriod } = await request.json()

    if (!invitationToken) {
      return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 })
    }

    if (!planId || !VAULT_PLANS[planId as VaultPlanId]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    if (!billingPeriod || !['monthly', 'annual'].includes(billingPeriod)) {
      return NextResponse.json({ error: 'Invalid billing period' }, { status: 400 })
    }

    // Validate invitation
    const tokenHash = crypto.createHash('sha256').update(invitationToken).digest('hex')

    const { data: invitation, error: invError } = await supabaseAdmin
      .from('vault_invitations')
      .select(`
        *,
        galleries(id, title),
        users!vault_invitations_photographer_id_fkey(
          display_name,
          user_settings(business_name)
        )
      `)
      .eq('token_hash', tokenHash)
      .single()

    if (invError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 400 })
    }

    if (invitation.status === 'purchased') {
      return NextResponse.json({ error: 'Already purchased' }, { status: 400 })
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
    }

    const plan = VAULT_PLANS[planId as VaultPlanId]
    const photographerName = invitation.users?.user_settings?.business_name || 
                            invitation.users?.display_name || 
                            'Your photographer'
    const galleryTitle = invitation.galleries?.title || 'Your photos'

    // Get or create Stripe price IDs from vault_plans table
    const { data: vaultPlan } = await supabaseAdmin
      .from('vault_plans')
      .select('stripe_monthly_price_id, stripe_annual_price_id')
      .eq('id', planId)
      .single()

    // Use existing price or create inline price
    let priceId = billingPeriod === 'monthly' 
      ? vaultPlan?.stripe_monthly_price_id 
      : vaultPlan?.stripe_annual_price_id

    // Build checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: invitation.client_email,
      line_items: priceId ? [
        {
          price: priceId,
          quantity: 1,
        }
      ] : [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} - Photo Vault`,
              description: `${plan.storageGB}GB secure photo storage`,
              metadata: {
                vault_plan_id: planId,
              },
            },
            unit_amount: billingPeriod === 'monthly' 
              ? plan.monthlyPrice * 100 
              : plan.annualPrice * 100,
            recurring: {
              interval: billingPeriod === 'monthly' ? 'month' : 'year',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/vault/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/vault/purchase?token=${invitationToken}&canceled=true`,
      subscription_data: {
        metadata: {
          invitation_token: invitationToken,
          vault_plan_id: planId,
          billing_period: billingPeriod,
          gallery_id: invitation.gallery_id,
          photographer_id: invitation.photographer_id,
        },
      },
      metadata: {
        type: 'vault_subscription',
        invitation_token: invitationToken,
        vault_plan_id: planId,
        billing_period: billingPeriod,
      },
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[vault-checkout] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
