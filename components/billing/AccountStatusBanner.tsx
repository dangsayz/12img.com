'use client'

import { AlertTriangle, CreditCard, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface AccountStatusBannerProps {
  subscriptionStatus?: string | null
  gracePeriodEndsAt?: string | null
  paymentFailureCount?: number
}

export function AccountStatusBanner({ 
  subscriptionStatus, 
  gracePeriodEndsAt,
  paymentFailureCount = 0,
}: AccountStatusBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Don't show if dismissed or status is normal
  if (dismissed) return null
  if (!subscriptionStatus || subscriptionStatus === 'active') return null

  const isGracePeriod = subscriptionStatus === 'grace_period' || subscriptionStatus === 'past_due'
  const isCanceled = subscriptionStatus === 'canceled'

  if (!isGracePeriod && !isCanceled) return null

  // Calculate days remaining in grace period
  let daysRemaining = 0
  if (gracePeriodEndsAt) {
    const endDate = new Date(gracePeriodEndsAt)
    const now = new Date()
    daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
  }

  // Grace period warning
  if (isGracePeriod) {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Payment failed{paymentFailureCount > 1 ? ` (${paymentFailureCount} attempts)` : ''}
                </p>
                <p className="text-sm text-amber-700">
                  {daysRemaining > 0 
                    ? `Update your payment method within ${daysRemaining} days to keep your account active.`
                    : 'Your grace period has ended. Update payment to restore your account.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
              >
                <CreditCard className="h-4 w-4" />
                Update Payment
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-amber-500 hover:text-amber-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Canceled/downgraded notification (non-dismissable)
  if (isCanceled) {
    return (
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-stone-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-stone-800">
                  Your subscription has ended
                </p>
                <p className="text-sm text-stone-600">
                  Some galleries may be archived. Upgrade to restore full access.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
