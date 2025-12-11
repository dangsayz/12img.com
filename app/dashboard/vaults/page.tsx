import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { getPhotographerVaults } from '@/server/actions/vault.actions'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'
import { VaultsDashboardContent } from '@/components/vault/VaultsDashboardContent'

export const metadata = {
  title: 'Client Vaults | 12IMG',
  description: 'Manage your client photo vaults',
}

async function VaultsData() {
  const result = await getPhotographerVaults()
  
  if (result.error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{result.error}</p>
        </div>
      </div>
    )
  }

  return <VaultsDashboardContent vaults={result.vaults || []} />
}

export default async function VaultsPage() {
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
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-pulse text-stone-400">Loading vaults...</div>
          </div>
        }
      >
        <VaultsData />
      </Suspense>
    </div>
  )
}
