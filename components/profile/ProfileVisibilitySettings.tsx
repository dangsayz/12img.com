'use client'

import { useState, useTransition } from 'react'
import { Globe, Lock, Eye, EyeOff, ExternalLink, Copy, Check } from 'lucide-react'
import { updateProfileVisibility, updateProfileDetails } from '@/server/actions/profile.actions'
import type { ProfileVisibilityMode } from '@/types/database'

interface ProfileVisibilitySettingsProps {
  currentMode: ProfileVisibilityMode
  profileSlug: string | null
  displayName: string | null
  bio: string | null
}

const visibilityOptions: {
  mode: ProfileVisibilityMode
  label: string
  description: string
  icon: typeof Globe
}[] = [
  {
    mode: 'PRIVATE',
    label: 'Private',
    description: 'Only you can see your profile and galleries',
    icon: EyeOff,
  },
  {
    mode: 'PUBLIC',
    label: 'Public',
    description: 'Anyone can view your profile and galleries',
    icon: Globe,
  },
  {
    mode: 'PUBLIC_LOCKED',
    label: 'Public with PIN',
    description: 'Profile is public, but galleries can be PIN-protected',
    icon: Lock,
  },
]

export function ProfileVisibilitySettings({
  currentMode,
  profileSlug,
  displayName,
  bio,
}: ProfileVisibilitySettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [selectedMode, setSelectedMode] = useState<ProfileVisibilityMode>(currentMode)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [editDisplayName, setEditDisplayName] = useState(displayName || '')
  const [editBio, setEditBio] = useState(bio || '')
  const [editSlug, setEditSlug] = useState(profileSlug || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const profileUrl = profileSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profileSlug}`
    : null

  const handleCopyUrl = async () => {
    if (profileUrl) {
      await navigator.clipboard.writeText(profileUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSaveVisibility = () => {
    setError(null)
    setSuccess(null)

    // Validate PIN for PUBLIC_LOCKED
    if (selectedMode === 'PUBLIC_LOCKED') {
      if (!pin || pin.length < 4 || pin.length > 6) {
        setError('PIN must be 4-6 digits')
        return
      }
      if (!/^\d+$/.test(pin)) {
        setError('PIN must contain only numbers')
        return
      }
      if (pin !== confirmPin) {
        setError('PINs do not match')
        return
      }
    }

    startTransition(async () => {
      const result = await updateProfileVisibility({
        mode: selectedMode,
        pin: selectedMode === 'PUBLIC_LOCKED' ? pin : undefined,
        displayName: editDisplayName || undefined,
        bio: editBio || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Profile visibility updated successfully')
        setPin('')
        setConfirmPin('')
      }
    })
  }

  const handleSaveDetails = () => {
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await updateProfileDetails({
        displayName: editDisplayName || undefined,
        bio: editBio || undefined,
        profileSlug: editSlug || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Profile details updated successfully')
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Profile Details Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Profile Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={editDisplayName}
              onChange={(e) => setEditDisplayName(e.target.value)}
              placeholder="Your name or business name"
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Bio
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Tell visitors about yourself..."
              rows={3}
              className="w-full px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">
              Profile URL
            </label>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl">
                <span className="text-stone-400 text-sm">/profile/</span>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="your-name"
                  className="flex-1 bg-transparent border-0 focus:outline-none text-sm"
                />
              </div>
              {profileUrl && (
                <button
                  onClick={handleCopyUrl}
                  className="px-4 py-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-stone-500" />
                  )}
                </button>
              )}
            </div>
          </div>

          <button
            onClick={handleSaveDetails}
            disabled={isPending}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </div>

      {/* Visibility Section */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">
          Profile Visibility
        </h3>

        <div className="space-y-3">
          {visibilityOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedMode === option.mode

            return (
              <button
                key={option.mode}
                onClick={() => setSelectedMode(option.mode)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  isSelected
                    ? 'border-stone-900 bg-stone-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isSelected ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-stone-900">{option.label}</div>
                  <div className="text-sm text-stone-500 mt-0.5">{option.description}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-stone-900 bg-stone-900' : 'border-stone-300'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* PIN Input for PUBLIC_LOCKED */}
        {selectedMode === 'PUBLIC_LOCKED' && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <h4 className="font-medium text-amber-900 mb-3">Set Profile PIN</h4>
            <p className="text-sm text-amber-700 mb-4">
              This PIN will be required to access locked galleries. You can set different PINs for individual galleries later.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1.5">
                  PIN (4-6 digits)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-900 mb-1.5">
                  Confirm PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-4 py-2.5 border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-all bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
            {success}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleSaveVisibility}
            disabled={isPending}
            className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Saving...' : 'Save Visibility'}
          </button>

          {profileUrl && selectedMode !== 'PRIVATE' && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Profile
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
