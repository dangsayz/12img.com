'use client'

import { HardDrive, Image, Folder, Sparkles } from 'lucide-react'
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
    <section className="mb-12">
      <h2 className="text-lg font-medium mb-4">Account & Usage</h2>
      
      <div className="space-y-6">
        {/* Storage Usage */}
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Storage</span>
            </div>
            <span className="text-sm text-gray-500">
              {formatBytes(storageUsage.totalBytes)} / {formatBytes(storageLimit)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${usagePercent}%` }}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Image className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{storageUsage.imageCount}</p>
                <p className="text-xs text-gray-500">Images</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Folder className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{storageUsage.galleryCount}</p>
                <p className="text-xs text-gray-500">Galleries</p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan info */}
        <div className={`flex items-center justify-between py-4 px-6 rounded-lg border ${
          isPaid 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100'
        }`}>
          <div className="flex items-center gap-3">
            {isPaid && (
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-4 h-4 text-blue-600" />
              </div>
            )}
            <div>
              <p className="font-medium flex items-center gap-2">
                {plan?.name || 'Free'} Plan
                {isPaid && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {plan?.features?.find(f => f.includes('storage'))?.replace('storage', 'storage included') || '5GB storage included'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isPaid && hasSubscription ? (
              <ManageBillingButton 
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              />
            ) : (
              <a
                href="/pricing"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
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
