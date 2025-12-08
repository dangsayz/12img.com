import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserSettings, getUserStorageUsage, getUserWithUsage, checkIsAdmin } from '@/server/queries/user.queries'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { AccountSection } from '@/components/settings/AccountSection'
import { BrandingSection } from '@/components/settings/BrandingSection'
import { NotificationSection } from '@/components/settings/NotificationSection'
import { DangerZone } from '@/components/settings/DangerZone'
import { ProfileVisibilitySection } from '@/components/settings/ProfileVisibilitySection'
import { PortfolioManager } from '@/components/settings/PortfolioManager'
import { AppNav } from '@/components/layout/AppNav'
import { normalizePlanId } from '@/lib/config/pricing'
import { PLAN_TIERS, type PlanTier } from '@/lib/config/pricing-v2'
import { getUserProfile } from '@/server/actions/profile.actions'

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
    <div className="min-h-screen bg-white">
      <AppNav 
        userPlan={plan}
        storageUsed={userData?.usage.totalBytes || 0}
        storageLimit={storageLimit}
        isAdmin={isAdmin}
      />
      
      <main className="pt-8">
        {/* Hero Header - Apple inspired */}
        <header className="pb-16 px-6 text-center">
          <h1 className="font-sans text-[clamp(2rem,6vw,3.5rem)] font-medium tracking-[-0.02em] text-stone-900 leading-[1.1]">
            Settings
          </h1>
          <p className="text-base text-stone-400 mt-4">
            Manage your account and preferences
          </p>
        </header>

        <div className="max-w-2xl mx-auto px-6 pb-24">
          {/* Profile Section (Clerk-managed) */}
          <section className="mb-16">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Profile</h2>
            <div className="bg-stone-50 border border-stone-100 p-6">
              <div className="flex items-center gap-4">
                {user?.imageUrl && (
                  <img
                    src={user.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-stone-900">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-stone-500 text-sm">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>
              <a
                href="/account"
                className="mt-5 inline-block text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Manage account →
              </a>
            </div>
          </section>

          {/* Profile Visibility Section */}
          <ProfileVisibilitySection
            currentMode={profileData?.visibilityMode || 'PRIVATE'}
            profileSlug={profileData?.profileSlug || null}
            displayName={profileData?.displayName || null}
            bio={profileData?.bio || null}
            coverImageUrl={profileData?.coverImageUrl || null}
          />

          {/* Portfolio Wall Section */}
          <section className="mb-16">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Portfolio</h2>
            <PortfolioManager />
          </section>

          {/* Account & Usage Section */}
          <AccountSection 
            storageUsage={storageUsage} 
            userPlan={userPlan}
            hasSubscription={!!userData?.stripeSubscriptionId}
          />

          {/* Business Branding Section */}
          <BrandingSection 
            initialSettings={{
              businessName: settings.businessName,
              contactEmail: settings.contactEmail,
              websiteUrl: settings.websiteUrl,
              brandColor: settings.brandColor,
            }}
          />

          {/* Notification Preferences */}
          <NotificationSection
            initialSettings={{
              notifyGalleryViewed: settings.notifyGalleryViewed,
              notifyImagesDownloaded: settings.notifyImagesDownloaded,
              notifyArchiveReady: settings.notifyArchiveReady,
              emailDigestFrequency: settings.emailDigestFrequency,
            }}
          />

          {/* Gallery Defaults Section */}
          <section className="mb-16">
            <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Gallery Defaults</h2>
            <p className="text-sm text-stone-500 mb-6">
              Default settings applied to new galleries. You can override these per gallery.
            </p>
            <SettingsForm 
              initialSettings={{
                defaultPasswordEnabled: settings.defaultPasswordEnabled,
                defaultDownloadEnabled: settings.defaultDownloadEnabled,
                defaultGalleryExpiryDays: settings.defaultGalleryExpiryDays,
                defaultWatermarkEnabled: settings.defaultWatermarkEnabled,
              }}
            />
          </section>

          {/* Danger Zone */}
          <DangerZone />
        </div>
      </main>
    </div>
  )
}
