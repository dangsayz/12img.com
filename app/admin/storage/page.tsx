import { Suspense } from 'react'
import { 
  getStorageSummary, 
  getTopStorageUsers, 
  getStorageGrowth,
  getStorageConversionTargets,
  getBucketStats,
} from '@/server/admin/storage'
import { StorageContent } from './StorageContent'

export default async function AdminStoragePage() {
  const [summary, topUsers, growth, conversionTargets, buckets] = await Promise.all([
    getStorageSummary(),
    getTopStorageUsers(50, 0),
    getStorageGrowth(30),
    getStorageConversionTargets(),
    getBucketStats(),
  ])
  
  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Storage Analytics</h1>
        <p className="text-[#525252] text-sm lg:text-base mt-1 lg:mt-2">
          Platform-wide storage metrics, user leaderboards, and conversion intelligence
        </p>
      </div>
      
      <Suspense fallback={<div className="animate-pulse bg-stone-100 h-96" />}>
        <StorageContent 
          summary={summary}
          topUsers={topUsers}
          growth={growth}
          conversionTargets={conversionTargets}
          buckets={buckets}
        />
      </Suspense>
    </div>
  )
}
