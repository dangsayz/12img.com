import { Suspense } from 'react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getClientsWithStats } from '@/server/actions/client.actions'
import { ClientsPageContent } from '@/components/clients/ClientsPageContent'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier, hasClientManagement } from '@/lib/config/pricing-v2'
import { Users, ArrowRight } from 'lucide-react'

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

function UpgradePrompt() {
  return (
    <div className="max-w-2xl mx-auto mt-16">
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
        <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-stone-600" />
        </div>
        
        <h2 className="text-2xl font-serif text-stone-900 mb-3">
          Client Management
        </h2>
        
        <p className="text-stone-500 mb-6 max-w-md mx-auto">
          Manage your photography clients, send contracts, track milestones, and communicate—all in one place.
        </p>
        
        <div className="bg-stone-50 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-medium text-stone-700 mb-4">What you get with a paid plan:</h3>
          <ul className="text-sm text-stone-600 space-y-2 text-left max-w-xs mx-auto">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
              Client profiles & contact management
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
              Smart contracts with e-signatures
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
              Client portal for each project
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
              Built-in messaging & notifications
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-stone-400 rounded-full" />
              Milestone tracking & delivery countdown
            </li>
          </ul>
        </div>
        
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors"
        >
          Upgrade to Essential
          <ArrowRight className="w-4 h-4" />
        </Link>
        
        <p className="text-xs text-stone-400 mt-4">
          Starting at $6/month • Cancel anytime
        </p>
      </div>
    </div>
  )
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
  const canAccessClients = hasClientManagement(plan)

  return (
    <div className="min-h-screen bg-stone-50">
      <AppNav 
        userPlan={plan}
        storageUsed={userData?.usage.totalBytes || 0}
        storageLimit={storageLimit}
        isAdmin={isAdmin}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {canAccessClients ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse text-stone-400">Loading clients...</div>
              </div>
            }
          >
            <ClientsData />
          </Suspense>
        ) : (
          <UpgradePrompt />
        )}
      </div>
    </div>
  )
}
