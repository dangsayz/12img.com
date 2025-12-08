import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getClientProfile } from '@/server/actions/client.actions'
import { getClientContracts } from '@/server/actions/contract.actions'
import { getMessages } from '@/server/actions/message.actions'
import { getClientPortalTokens } from '@/server/actions/portal.actions'
import { ClientDetailContent } from '@/components/clients/ClientDetailContent'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

export const metadata = {
  title: 'Client Details | 12IMG',
}

interface PageProps {
  params: Promise<{ clientId: string }>
}

async function ClientData({ clientId }: { clientId: string }) {
  const [clientResult, contractsResult, messagesResult, tokensResult] = await Promise.all([
    getClientProfile(clientId),
    getClientContracts(clientId),
    getMessages(clientId, { limit: 50 }),
    getClientPortalTokens(clientId),
  ])

  if (!clientResult.success || !clientResult.data) {
    notFound()
  }

  return (
    <ClientDetailContent
      client={clientResult.data}
      contracts={contractsResult.data || []}
      messages={messagesResult.data || []}
      portalTokens={tokensResult.data || []}
    />
  )
}

export default async function ClientDetailPage({ params }: PageProps) {
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
            <div className="animate-pulse text-stone-400">Loading client...</div>
          </div>
        }
      >
        <ClientData clientId={clientId} />
      </Suspense>
    </div>
  )
}
