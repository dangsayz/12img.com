'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Shield, Image, Clock, Download, Check, Loader2, AlertCircle } from 'lucide-react'
import { validateVaultInvitation } from '@/server/actions/vault.actions'
import { VAULT_PLANS, VAULT_PLAN_ORDER, type VaultPlanId } from '@/lib/config/vault-pricing'

interface InvitationData {
  id: string
  clientEmail: string
  clientName: string | null
  gallery: { id: string; title: string; slug: string } | null
  photographer: {
    id: string
    display_name: string | null
    user_settings: { business_name: string | null; logo_url: string | null } | null
  } | null
  imageCount: number
}

export default function VaultPurchasePage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const canceled = searchParams.get('canceled')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<VaultPlanId>('vault')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Missing invitation token')
      setLoading(false)
      return
    }

    validateVaultInvitation(token).then((result) => {
      if (result.error) {
        setError(result.error)
      } else if (result.invitation) {
        setInvitation(result.invitation)
      }
      setLoading(false)
    })
  }, [token])

  const handlePurchase = async () => {
    if (!token) return

    setPurchasing(true)
    try {
      const response = await fetch('/api/stripe/vault-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationToken: token,
          planId: selectedPlan,
          billingPeriod,
        }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start checkout')
      }
    } catch (e) {
      setError('Something went wrong. Please try again.')
    } finally {
      setPurchasing(false)
    }
  }

  const photographerName = invitation?.photographer?.user_settings?.business_name ||
    invitation?.photographer?.display_name ||
    'Your photographer'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Unable to Access</h1>
          <p className="text-stone-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-stone-900">Keep Your Photos Safe</h1>
            <p className="text-stone-600 mt-1">
              {photographerName} wants to help you preserve your memories
            </p>
          </div>
        </div>
      </div>

      {/* Canceled notice */}
      {canceled && (
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-800 text-sm">
              Your checkout was canceled. You can try again when you&apos;re ready.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Gallery info */}
        {invitation?.gallery && (
          <div className="bg-white rounded-xl border border-stone-200 p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center">
                <Image className="w-6 h-6 text-stone-600" />
              </div>
              <div>
                <h2 className="font-semibold text-stone-900">{invitation.gallery.title}</h2>
                <p className="text-sm text-stone-500">{invitation.imageCount} photos</p>
              </div>
            </div>
          </div>
        )}

        {/* Billing toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-stone-100 rounded-full p-1 flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                billingPeriod === 'annual'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Annual
              <span className="ml-2 text-xs text-emerald-600 font-semibold">Save 18%</span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {VAULT_PLAN_ORDER.map((planId) => {
            const plan = VAULT_PLANS[planId]
            const isSelected = selectedPlan === planId
            const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualPrice
            const priceLabel = billingPeriod === 'monthly' ? '/mo' : '/yr'

            return (
              <button
                key={planId}
                onClick={() => setSelectedPlan(planId)}
                className={`relative text-left p-6 rounded-2xl border-2 transition-all ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-stone-900 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">{plan.name}</h3>
                    <p className="text-sm text-stone-500">{plan.description}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-stone-900">${price}</span>
                  <span className="text-stone-500">{priceLabel}</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                      <Check className="w-4 h-4 text-emerald-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </button>
            )
          })}
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <h4 className="font-medium text-stone-900">Secure Storage</h4>
            <p className="text-sm text-stone-500 mt-1">Your photos are encrypted and protected</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-stone-900">Access Anytime</h4>
            <p className="text-sm text-stone-500 mt-1">View your photos whenever you want</p>
          </div>
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-stone-900">Easy Downloads</h4>
            <p className="text-sm text-stone-500 mt-1">Download your photos anytime</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {purchasing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Keep My Photos – ${billingPeriod === 'monthly' 
                  ? VAULT_PLANS[selectedPlan].monthlyPrice + '/mo'
                  : VAULT_PLANS[selectedPlan].annualPrice + '/yr'}
              </>
            )}
          </button>
          <p className="text-sm text-stone-500 mt-3">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}
