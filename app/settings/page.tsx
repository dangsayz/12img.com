import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserSettings, getUserStorageUsage, getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { AppNav } from '@/components/layout/AppNav'
import { normalizePlanId } from '@/lib/config/pricing'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'
import { getUserProfile } from '@/server/actions/profile.actions'
import { SettingsPageClient } from '@/components/settings/SettingsPageClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const [user, settings, storageUsage, userData, isAdmin, profileData] = await Promise.all([
    currentUser(),
    getUserSettings(userId),
    getUserStorageUsage(userId),
    getUserWithUsage(userId),
    checkIsAdmin(userId),
    getUserProfile(),
  ])

  const userPlan = normalizePlanId(userData?.plan)
  const plan = (userData?.plan || 'free') as PlanTier
  const planConfig = PLAN_TIERS[plan] || PLAN_TIERS.free
  const storageLimit = planConfig.storageGB * 1024 * 1024 * 1024

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppNav 
        userPlan={plan}
        storageUsed={userData?.usage.totalBytes || 0}
        storageLimit={storageLimit}
        isAdmin={isAdmin}
      />
      
      <SettingsPageClient
        user={user ? {
          imageUrl: user.imageUrl,
          firstName: user.firstName,
          lastName: user.lastName,
          emailAddresses: user.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
        } : null}
        profileData={profileData ? {
          visibilityMode: profileData.visibilityMode || 'PRIVATE',
          profileSlug: profileData.profileSlug,
          displayName: profileData.displayName,
          bio: profileData.bio,
          coverImageUrl: profileData.coverImageUrl,
        } : null}
        storageUsage={storageUsage}
        userPlan={userPlan}
        hasSubscription={!!userData?.stripeSubscriptionId}
        brandingSettings={{
          businessName: settings.businessName || '',
          contactEmail: settings.contactEmail || '',
          websiteUrl: settings.websiteUrl || '',
          brandColor: settings.brandColor || '',
        }}
        notificationSettings={{
          notifyGalleryViewed: settings.notifyGalleryViewed,
          notifyImagesDownloaded: settings.notifyImagesDownloaded,
          notifyArchiveReady: settings.notifyArchiveReady,
          emailDigestFrequency: settings.emailDigestFrequency as 'immediate' | 'daily' | 'weekly' | 'never',
        }}
        gallerySettings={{
          defaultPasswordEnabled: settings.defaultPasswordEnabled,
          defaultDownloadEnabled: settings.defaultDownloadEnabled,
          defaultGalleryExpiryDays: settings.defaultGalleryExpiryDays,
          defaultWatermarkEnabled: settings.defaultWatermarkEnabled,
        }}
      />
    </div>
  )
}
