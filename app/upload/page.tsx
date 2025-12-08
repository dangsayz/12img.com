import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { getPlan } from '@/lib/config/pricing'
import { AppNav } from '@/components/layout/AppNav'
import { CreateGalleryForm } from './CreateGalleryForm'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'

export const dynamic = 'force-dynamic'

export default async function CreateGalleryPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const [userData, isAdmin] = await Promise.all([
    getUserWithUsage(userId),
    checkIsAdmin(userId),
  ])
  
  // Map 'basic' to 'essential' for legacy support
  const planId = userData?.plan === 'basic' ? 'essential' : (userData?.plan || 'free')
  const plan = getPlan(planId as any)
  
  const galleryLimit = plan?.limits.gallery_limit === 'unlimited' 
    ? Infinity 
    : (plan?.limits.gallery_limit || 3)
  
  const currentCount = userData?.usage.galleryCount || 0
  const isAtLimit = currentCount >= galleryLimit
  
  const userPlan = (userData?.plan || 'free') as PlanTier
  const planConfig = PLAN_TIERS[userPlan] || PLAN_TIERS.free
  const storageLimit = planConfig.storageGB * 1024 * 1024 * 1024

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppNav 
        userPlan={userPlan}
        storageUsed={userData?.usage.totalBytes || 0}
        storageLimit={storageLimit}
        isAdmin={isAdmin}
      />
      
      <CreateGalleryForm 
        isAtLimit={isAtLimit}
        currentCount={currentCount}
        galleryLimit={galleryLimit === Infinity ? 'unlimited' : galleryLimit}
        planName={plan?.name || 'Free'}
      />
    </div>
  )
}
