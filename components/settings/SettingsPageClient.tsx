'use client'

import { SettingsLayout, type SettingsSectionId } from './SettingsLayout'
import { ProfileVisibilitySection } from './ProfileVisibilitySection'
import { PortfolioManager } from './PortfolioManager'
import { VendorSection } from '@/components/vendors/VendorSection'
import { AccountSection } from './AccountSection'
import { BrandingSection } from './BrandingSection'
import { NotificationSection } from './NotificationSection'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { DangerZone } from './DangerZone'
import type { LegacyPlanId } from '@/lib/config/pricing'

// ═══════════════════════════════════════════════════════════════
// SECTION WRAPPERS - Consistent padding and styling
// ═══════════════════════════════════════════════════════════════

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return <div className="p-6 lg:p-8">{children}</div>
}

// ═══════════════════════════════════════════════════════════════
// PROFILE SECTION
// ═══════════════════════════════════════════════════════════════

interface ProfileSectionProps {
  user: {
    imageUrl?: string
    firstName?: string | null
    lastName?: string | null
    emailAddresses: { emailAddress: string }[]
  } | null
  profileData: {
    visibilityMode: string
    profileSlug: string | null
    displayName: string | null
    bio: string | null
    coverImageUrl: string | null
  } | null
}

function ProfileSectionContent({ user, profileData }: ProfileSectionProps) {
  return (
    <SectionWrapper>
      {/* User Info Card */}
      <div className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl mb-8">
        {user?.imageUrl && (
          <img
            src={user.imageUrl}
            alt=""
            className="w-14 h-14 rounded-full ring-2 ring-white shadow-sm"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-stone-900 truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-stone-500 text-sm truncate">
            {user?.emailAddresses[0]?.emailAddress}
          </p>
        </div>
        <a
          href="/account"
          className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
        >
          Manage →
        </a>
      </div>

      {/* Profile Visibility */}
      <ProfileVisibilitySection
        currentMode={profileData?.visibilityMode || 'PRIVATE'}
        profileSlug={profileData?.profileSlug || null}
        displayName={profileData?.displayName || null}
        bio={profileData?.bio || null}
        coverImageUrl={profileData?.coverImageUrl || null}
      />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO SECTION
// ═══════════════════════════════════════════════════════════════

function PortfolioSectionContent() {
  return (
    <SectionWrapper>
      <PortfolioManager />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// VENDORS SECTION
// ═══════════════════════════════════════════════════════════════

function VendorsSectionContent() {
  return (
    <SectionWrapper>
      <VendorSection />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT SECTION
// ═══════════════════════════════════════════════════════════════

interface StorageUsage {
  totalBytes: number
  imageCount: number
  galleryCount: number
}

interface AccountSectionContentProps {
  storageUsage: StorageUsage
  userPlan: LegacyPlanId
  hasSubscription: boolean
}

function AccountSectionContent({ storageUsage, userPlan, hasSubscription }: AccountSectionContentProps) {
  return (
    <SectionWrapper>
      <AccountSection 
        storageUsage={storageUsage}
        userPlan={userPlan}
        hasSubscription={hasSubscription}
      />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// BRANDING SECTION
// ═══════════════════════════════════════════════════════════════

interface BrandingSectionProps {
  initialSettings: {
    businessName: string
    contactEmail: string
    websiteUrl: string
    brandColor: string
  }
}

function BrandingSectionContent({ initialSettings }: BrandingSectionProps) {
  return (
    <SectionWrapper>
      <BrandingSection initialSettings={initialSettings} />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS SECTION
// ═══════════════════════════════════════════════════════════════

type EmailDigestFrequency = 'immediate' | 'daily' | 'weekly' | 'never'

interface NotificationSectionContentProps {
  initialSettings: {
    notifyGalleryViewed: boolean
    notifyImagesDownloaded: boolean
    notifyArchiveReady: boolean
    emailDigestFrequency: EmailDigestFrequency
  }
}

function NotificationsSectionContent({ initialSettings }: NotificationSectionContentProps) {
  return (
    <SectionWrapper>
      <NotificationSection initialSettings={initialSettings} />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// GALLERY DEFAULTS SECTION
// ═══════════════════════════════════════════════════════════════

interface GalleryDefaultsProps {
  initialSettings: {
    defaultPasswordEnabled: boolean
    defaultDownloadEnabled: boolean
    defaultGalleryExpiryDays: number | null
    defaultWatermarkEnabled: boolean
  }
}

function GalleryDefaultsSectionContent({ initialSettings }: GalleryDefaultsProps) {
  return (
    <SectionWrapper>
      <div className="mb-6">
        <p className="text-sm text-stone-500">
          Default settings applied to new galleries. You can override these per gallery.
        </p>
      </div>
      <SettingsForm initialSettings={initialSettings} />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// DANGER ZONE SECTION
// ═══════════════════════════════════════════════════════════════

function DangerZoneSectionContent() {
  return (
    <SectionWrapper>
      <DangerZone />
    </SectionWrapper>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN SETTINGS PAGE CLIENT
// ═══════════════════════════════════════════════════════════════

interface SettingsPageClientProps {
  user: ProfileSectionProps['user']
  profileData: ProfileSectionProps['profileData']
  storageUsage: StorageUsage
  userPlan: LegacyPlanId
  hasSubscription: boolean
  brandingSettings: BrandingSectionProps['initialSettings']
  notificationSettings: NotificationSectionContentProps['initialSettings']
  gallerySettings: GalleryDefaultsProps['initialSettings']
}

export function SettingsPageClient({
  user,
  profileData,
  storageUsage,
  userPlan,
  hasSubscription,
  brandingSettings,
  notificationSettings,
  gallerySettings,
}: SettingsPageClientProps) {
  const sections: { id: SettingsSectionId; content: React.ReactNode }[] = [
    {
      id: 'profile',
      content: <ProfileSectionContent user={user} profileData={profileData} />,
    },
    {
      id: 'portfolio',
      content: <PortfolioSectionContent />,
    },
    {
      id: 'vendors',
      content: <VendorsSectionContent />,
    },
    {
      id: 'account',
      content: (
        <AccountSectionContent
          storageUsage={storageUsage}
          userPlan={userPlan}
          hasSubscription={hasSubscription}
        />
      ),
    },
    {
      id: 'branding',
      content: <BrandingSectionContent initialSettings={brandingSettings} />,
    },
    {
      id: 'notifications',
      content: <NotificationsSectionContent initialSettings={notificationSettings} />,
    },
    {
      id: 'gallery',
      content: <GalleryDefaultsSectionContent initialSettings={gallerySettings} />,
    },
    {
      id: 'danger',
      content: <DangerZoneSectionContent />,
    },
  ]

  return <SettingsLayout sections={sections}>{null}</SettingsLayout>
}
