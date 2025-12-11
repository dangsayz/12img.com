'use client'

import { useState } from 'react'
import { Clock, Shield, X, ArrowRight } from 'lucide-react'
import { VAULT_PLANS } from '@/lib/config/vault-pricing'

interface VaultExpiryBannerProps {
  galleryTitle: string
  expiresAt: Date | null
  imageCount: number
  vaultPurchaseUrl?: string
  onDismiss?: () => void
}

/**
 * Banner shown to clients when a gallery is approaching expiration.
 * Promotes vault storage as a way to keep their photos.
 */
export function VaultExpiryBanner({
  galleryTitle,
  expiresAt,
  imageCount,
  vaultPurchaseUrl,
  onDismiss,
}: VaultExpiryBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || !expiresAt) return null

  const now = new Date()
  const daysLeft = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  // Only show banner if expiring within 14 days
  if (daysLeft > 14 || daysLeft < 0) return null

  const isUrgent = daysLeft <= 3
  const vaultPlan = VAULT_PLANS.vault

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${
        isUrgent
          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200'
          : 'bg-gradient-to-r from-stone-50 to-stone-100 border-stone-200'
      }`}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              isUrgent ? 'bg-amber-100' : 'bg-stone-200'
            }`}
          >
            <Clock className={`w-6 h-6 ${isUrgent ? 'text-amber-600' : 'text-stone-600'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className={`font-semibold ${isUrgent ? 'text-amber-900' : 'text-stone-900'}`}>
                  {isUrgent
                    ? `Only ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left!`
                    : `Gallery expires in ${daysLeft} days`}
                </h3>
                <p className={`text-sm mt-1 ${isUrgent ? 'text-amber-700' : 'text-stone-600'}`}>
                  Your {imageCount} photos from &quot;{galleryTitle}&quot; will be removed after expiry.
                </p>
              </div>

              {onDismiss && (
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              )}
            </div>

            {/* Vault promo */}
            <div className="mt-4 p-4 bg-white rounded-lg border border-stone-200 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-stone-900">Keep your photos forever</p>
                  <p className="text-sm text-stone-500">
                    Starting at ${vaultPlan.annualPrice}/year
                  </p>
                </div>
              </div>

              <ul className="text-sm text-stone-600 space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  Secure cloud storage for all your photos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  Access and download anytime
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-emerald-500 rounded-full" />
                  Never lose your precious memories
                </li>
              </ul>

              {vaultPurchaseUrl ? (
                <a
                  href={vaultPurchaseUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Keep My Photos
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <p className="text-sm text-stone-500">
                  Ask your photographer about Photo Vault storage.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Urgency stripe */}
      {isUrgent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400" />
      )}
    </div>
  )
}
