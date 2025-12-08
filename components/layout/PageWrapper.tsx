import { auth } from '@clerk/nextjs/server'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { AppNav } from './AppNav'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

interface PageWrapperProps {
  children: React.ReactNode
  className?: string
}

export async function PageWrapper({ children, className = '' }: PageWrapperProps) {
  const { userId } = await auth()
  
  if (!userId) {
    // Not authenticated - just render children (landing page handles its own nav)
    return <>{children}</>
  }
  
  const [userData, isAdmin] = await Promise.all([
    getUserWithUsage(userId),
    checkIsAdmin(userId),
  ])
  
  const plan = (userData?.plan || 'free') as PlanTier
  const planConfig = PLAN_TIERS[plan] || PLAN_TIERS.free
  const storageLimit = planConfig.storageGB * 1024 * 1024 * 1024
  
  return (
    <div className={`min-h-screen bg-stone-50 ${className}`}>
      <AppNav 
        userPlan={plan}
        storageUsed={userData?.usage.totalBytes || 0}
        storageLimit={storageLimit}
        isAdmin={isAdmin}
      />
      {children}
    </div>
  )
}
