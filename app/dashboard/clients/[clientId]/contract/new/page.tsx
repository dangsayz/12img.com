import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getClientProfile } from '@/server/actions/client.actions'
import { CreateContractForm } from '@/components/contracts/CreateContractForm'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

export const metadata = {
  title: 'Create Contract | 12IMG',
}

interface PageProps {
  params: Promise<{ clientId: string }>
}

async function ContractFormData({ clientId }: { clientId: string }) {
  const clientResult = await getClientProfile(clientId)

  if (!clientResult.success || !clientResult.data) {
    notFound()
  }

  return <CreateContractForm client={clientResult.data} />
}

export default async function CreateContractPage({ params }: PageProps) {
  const { clientId } = await params
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
            <div className="animate-pulse text-stone-400">Loading...</div>
          </div>
        }
      >
        <ContractFormData clientId={clientId} />
      </Suspense>
    </div>
  )
}
