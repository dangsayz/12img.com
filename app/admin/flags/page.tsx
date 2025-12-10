import { Suspense } from 'react'
import { getAllFeatureFlags, getFlagStats } from '@/server/admin/flags'
import { FlagsContent } from './FlagsContent'

export default async function AdminFlagsPage() {
  const [flags, stats] = await Promise.all([
    getAllFeatureFlags(),
    getFlagStats(),
  ])
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Feature Flags</h1>
        <p className="text-[#525252] text-sm lg:text-base mt-1 lg:mt-2">
          Toggle features, manage rollouts, and control platform capabilities
        </p>
      </div>
      
      <Suspense fallback={<div className="animate-pulse bg-stone-100 h-96" />}>
        <FlagsContent flags={flags} stats={stats} />
      </Suspense>
    </div>
  )
}
