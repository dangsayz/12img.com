import { Suspense } from 'react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FeatureRequestsContent } from './FeatureRequestsContent'

export const dynamic = 'force-dynamic'

export interface FeatureRequest {
  id: string
  email: string | null
  request: string
  status: 'new' | 'reviewed' | 'planned' | 'shipped' | 'declined'
  admin_notes: string | null
  created_at: string
}

async function getFeatureRequests(): Promise<FeatureRequest[]> {
  const { data, error } = await supabaseAdmin
    .from('feature_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[Admin] Error fetching feature requests:', error)
    return []
  }

  return data || []
}

export default async function FeatureRequestsPage() {
  const requests = await getFeatureRequests()
  const newCount = requests.filter(r => r.status === 'new').length

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Feature Requests</h1>
          <p className="text-[#525252] text-sm lg:text-base mt-1">
            {newCount} new · {requests.length} total
          </p>
        </div>
      </div>

      <Suspense fallback={<RequestsSkeleton />}>
        <FeatureRequestsContent initialRequests={requests} />
      </Suspense>
    </div>
  )
}

function RequestsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-white border border-[#E5E5E5] p-6 animate-pulse rounded-xl">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="h-5 w-16 bg-stone-200 rounded-full" />
              <div className="h-4 w-full max-w-md bg-stone-100 rounded" />
              <div className="h-4 w-32 bg-stone-100 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
