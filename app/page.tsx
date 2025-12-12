import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserGalleries } from '@/server/queries/gallery.queries'
import { getUserWithUsage, getUserSettings, checkIsAdmin } from '@/server/queries/user.queries'
import { CleanDashboard } from '@/components/dashboard/CleanDashboard'
import { AppNav } from '@/components/layout/AppNav'
import { LandingPage } from '@/components/landing/LandingPage'
import { checkOnboardingStatus, checkWelcomeSeen } from '@/server/actions/onboarding.actions'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'
import { getUserProfile } from '@/server/actions/profile.actions'
import { getActiveContest } from '@/server/actions/contest.actions'
import { getUnreadNotificationCount, getAdminNotifications } from '@/server/admin/notifications'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const { userId } = await auth()

  // If logged in, show Dashboard
  if (userId) {
    // Check if onboarding is completed
    const onboardingCompleted = await checkOnboardingStatus()
    if (!onboardingCompleted) {
      redirect('/onboarding')
    }

    // Check if welcome screen has been seen
    const welcomeSeen = await checkWelcomeSeen()
    if (!welcomeSeen) {
      redirect('/welcome')
    }

    const [galleries, userData, userSettings, isAdmin, profileData, activeContest] = await Promise.all([
      getUserGalleries(userId),
      getUserWithUsage(userId),
      getUserSettings(userId),
      checkIsAdmin(userId),
      getUserProfile(),
      getActiveContest(),
    ])
    
    // Fetch admin notifications if user is admin
    const [adminUnreadCount, adminNotifications] = isAdmin 
      ? await Promise.all([getUnreadNotificationCount(), getAdminNotifications(20)])
      : [0, []]
    
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
          adminNotifications={adminNotifications}
          adminUnreadCount={adminUnreadCount}
        />
        <CleanDashboard 
          galleries={galleries} 
          photographerName={userSettings?.businessName || undefined}
          country={userSettings?.country}
          visibilityMode={profileData?.visibilityMode || 'PRIVATE'}
          profileSlug={profileData?.profileSlug}
          activeContest={activeContest ? {
            id: activeContest.id,
            name: activeContest.name,
            theme: activeContest.theme,
            status: activeContest.status as 'submissions_open' | 'voting',
          } : null}
          userPlan={plan}
        />
      </div>
    )
  }

  // If not logged in, show minimal Landing Page
  return <LandingPage />
}
