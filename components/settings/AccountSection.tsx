'use client'

import { HardDrive, Image, Folder } from 'lucide-react'

interface StorageUsage {
  totalBytes: number
  imageCount: number
  galleryCount: number
}

interface AccountSectionProps {
  storageUsage: StorageUsage
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  const mb = bytes / (1024 * 1024)
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  return `${mb.toFixed(1)} MB`
}

export function AccountSection({ storageUsage }: AccountSectionProps) {
  const storageLimit = 5 * 1024 * 1024 * 1024 // 5GB for free tier
  const usagePercent = Math.min((storageUsage.totalBytes / storageLimit) * 100, 100)

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
        <div className="flex items-center justify-between py-4 px-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
          <div>
            <p className="font-medium">Free Plan</p>
            <p className="text-sm text-gray-500">5GB storage included</p>
          </div>
          <a
            href="/pricing"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Upgrade →
          </a>
        </div>
      </div>
    </section>
  )
}
