'use client'

import { ProfileVisibilitySettings } from '@/components/profile/ProfileVisibilitySettings'
import { ProfileCoverUpload } from '@/components/settings/ProfileCoverUpload'
import type { ProfileVisibilityMode } from '@/types/database'

interface ProfileVisibilitySectionProps {
  currentMode: ProfileVisibilityMode | string
  profileSlug: string | null
  displayName: string | null
  bio: string | null
  coverImageUrl?: string | null
}

export function ProfileVisibilitySection({
  currentMode,
  profileSlug,
  displayName,
  bio,
  coverImageUrl,
}: ProfileVisibilitySectionProps) {
  return (
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">
        Public Profile
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        Control who can see your profile and galleries. Make your work discoverable or keep it private.
      </p>
      
      <div className="space-y-8">
        <ProfileVisibilitySettings
          currentMode={currentMode as ProfileVisibilityMode}
          profileSlug={profileSlug}
          displayName={displayName}
          bio={bio}
        />
        
        {/* Profile Cover Upload - only show if profile is public */}
        {currentMode !== 'PRIVATE' && (
          <div className="pt-6 border-t border-stone-100">
            <ProfileCoverUpload 
              currentCoverUrl={coverImageUrl || null}
              displayName={displayName}
            />
          </div>
        )}
      </div>
    </section>
  )
}
