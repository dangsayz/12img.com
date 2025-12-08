import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getClientsWithStats } from '@/server/actions/client.actions'
import { ClientsPageContent } from '@/components/clients/ClientsPageContent'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

export const metadata = {
  title: 'Clients | 12IMG',
  description: 'Manage your photography clients',
}

async function ClientsData() {
  const result = await getClientsWithStats()
  
  if (!result.success || !result.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-stone-500">Failed to load clients</p>
      </div>
    )
  }

  return <ClientsPageContent clients={result.data} />
}

export default async function ClientsPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const [userData, isAdmin] = await Promise.all([
    getUserWithUsage(userId),
    checkIsAdmin(userId),
  ])
  
  const plan = (userData?.plan || 'free') as PlanTier
  const planConfig = PLAN_TIERS[plan] || PLAN_TIERS.free
  const storageLimit = planConfig.storageGB * 1024 * 1024 * 1024

  return (
    <div className="min-h-screen bg-stone-50">
      <AppNav 
        userPlan={plan}
        storageUsed={userData?.usage.totalBytes || 0}
        storageLimit={storageLimit}
        isAdmin={isAdmin}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-pulse text-stone-400">Loading clients...</div>
            </div>
          }
        >
          <ClientsData />
        </Suspense>
      </div>
    </div>
  )
}
