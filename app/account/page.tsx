import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserProfile } from '@clerk/nextjs'
import { AppNav } from '@/components/layout/AppNav'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

export default async function AccountPage() {
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
      <main className="container mx-auto px-4 pt-8 pb-16">
        <UserProfile 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none',
            }
          }}
        />
      </main>
    </div>
  )
}
