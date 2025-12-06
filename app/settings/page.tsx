import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { Settings, User } from 'lucide-react'
import { getUserSettings, getUserStorageUsage, getUserWithUsage } from '@/server/queries/user.queries'
import { Header } from '@/components/layout/Header'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { AccountSection } from '@/components/settings/AccountSection'
import { BrandingSection } from '@/components/settings/BrandingSection'
import { NotificationSection } from '@/components/settings/NotificationSection'
import { DangerZone } from '@/components/settings/DangerZone'
import { normalizePlanId } from '@/lib/config/pricing'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const [user, settings, storageUsage, userData] = await Promise.all([
    currentUser(),
    getUserSettings(userId),
    getUserStorageUsage(userId),
    getUserWithUsage(userId),
  ])

  const userPlan = normalizePlanId(userData?.plan)

  return (
    <>
      <Header 
        userPlan={userPlan}
        galleryCount={userData?.usage.galleryCount || 0}
        imageCount={userData?.usage.imageCount || 0}
        storageUsed={userData?.usage.totalBytes || 0}
      />
      <main className="container mx-auto px-4 pt-28 pb-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-6 h-6 text-gray-700" />
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Profile Section (Clerk-managed) */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-medium">Profile</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <a
              href="/account"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Manage account →
            </a>
          </div>
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
        <section className="mb-12">
          <h2 className="text-lg font-medium mb-2">Gallery Defaults</h2>
          <p className="text-sm text-gray-500 mb-6">
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
      </main>
    </>
  )
}
