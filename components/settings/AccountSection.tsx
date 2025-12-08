'use client'

import { getPlan, getStorageLimitBytes, normalizePlanId, type LegacyPlanId } from '@/lib/config/pricing'
import { ManageBillingButton } from '@/components/billing/ManageBillingButton'

interface StorageUsage {
  totalBytes: number
  imageCount: number
  galleryCount: number
}

interface AccountSectionProps {
  storageUsage: StorageUsage
  userPlan: LegacyPlanId
  hasSubscription?: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(1)} MB`
}

export function AccountSection({ storageUsage, userPlan, hasSubscription }: AccountSectionProps) {
  const normalizedPlan = normalizePlanId(userPlan)
  const plan = getPlan(normalizedPlan)
  const storageLimit = getStorageLimitBytes(normalizedPlan)
  const usagePercent = Math.min((storageUsage.totalBytes / storageLimit) * 100, 100)
  const isPaid = userPlan !== 'free'

  return (
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Account & Usage</h2>
      
      <div className="space-y-6">
        {/* Storage Usage */}
        <div className="bg-stone-50 border border-stone-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-stone-600">Storage</span>
            <span className="text-sm text-stone-500">
              {formatBytes(storageUsage.totalBytes)} / {formatBytes(storageLimit)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-stone-200 h-1 mb-6">
            <div
              className="h-1 bg-stone-900 transition-all"
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          {/* Stats */}
          <div className="flex items-center gap-12">
            <div>
              <p className="text-3xl font-light text-stone-900">{storageUsage.imageCount}</p>
              <p className="text-xs text-stone-400 uppercase tracking-wide mt-1">Images</p>
            </div>
            <div>
              <p className="text-3xl font-light text-stone-900">{storageUsage.galleryCount}</p>
              <p className="text-xs text-stone-400 uppercase tracking-wide mt-1">Galleries</p>
            </div>
          </div>
        </div>

        {/* Plan info */}
        <div className="flex items-center justify-between py-5 px-6 bg-stone-50 border border-stone-100">
          <div>
            <p className="font-medium text-stone-900 flex items-center gap-2">
              {plan?.name || 'Free'} Plan
              {isPaid && (
                <span className="text-[10px] uppercase tracking-wider bg-stone-900 text-white px-2 py-0.5">
                  Active
                </span>
              )}
            </p>
            <p className="text-sm text-stone-500 mt-1">
              {plan?.features?.find(f => f.includes('storage'))?.replace('storage', 'storage included') || '5GB storage included'}
            </p>
          </div>
          
          <div>
            {isPaid && hasSubscription ? (
              <ManageBillingButton 
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              />
            ) : (
              <a
                href="/pricing"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                {isPaid ? 'Change plan' : 'Upgrade'} →
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
