'use client'

import { ProfileVisibilitySettings } from '@/components/profile/ProfileVisibilitySettings'
import type { ProfileVisibilityMode } from '@/types/database'

interface ProfileVisibilitySectionProps {
  currentMode: ProfileVisibilityMode | string
  profileSlug: string | null
  displayName: string | null
  bio: string | null
}

export function ProfileVisibilitySection({
  currentMode,
  profileSlug,
  displayName,
  bio,
}: ProfileVisibilitySectionProps) {
  return (
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">
        Public Profile
      </h2>
      <p className="text-sm text-stone-500 mb-6">
        Control who can see your profile and galleries. Make your work discoverable or keep it private.
      </p>
      <ProfileVisibilitySettings
        currentMode={currentMode as ProfileVisibilityMode}
        profileSlug={profileSlug}
        displayName={displayName}
        bio={bio}
      />
    </section>
  )
}
