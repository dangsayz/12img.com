'use client'

import { useState, useTransition } from 'react'
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react'
import { updateGalleryLock } from '@/server/actions/profile.actions'

interface GalleryLockSettingsProps {
  galleryId: string
  galleryTitle: string
  isLocked: boolean
  onUpdate?: () => void
}

export function GalleryLockSettings({
  galleryId,
  galleryTitle,
  isLocked: initialLocked,
  onUpdate,
}: GalleryLockSettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [isLocked, setIsLocked] = useState(initialLocked)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleToggleLock = () => {
    setError(null)
    setSuccess(null)

    if (!isLocked) {
      // Turning on lock - need PIN
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
      const result = await updateGalleryLock(
        galleryId,
        !isLocked,
        !isLocked ? pin : undefined
      )

      if (result.error) {
        setError(result.error)
      } else {
        setIsLocked(!isLocked)
        setSuccess(isLocked ? 'Gallery unlocked' : 'Gallery locked with PIN')
        setPin('')
        setConfirmPin('')
        onUpdate?.()
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isLocked ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-500'
          }`}>
            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-medium text-stone-900">{galleryTitle}</h4>
            <p className="text-sm text-stone-500">
              {isLocked ? 'PIN required to view' : 'Publicly accessible'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            if (isLocked) {
              // Unlocking - just toggle
              handleToggleLock()
            }
          }}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isLocked
              ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
          } disabled:opacity-50`}
        >
          {isLocked ? 'Unlock' : 'Lock'}
        </button>
      </div>

      {/* PIN Input when locking */}
      {!isLocked && (
        <div className="mt-4 pt-4 border-t border-stone-100">
          <p className="text-sm text-stone-600 mb-3">
            Set a PIN to lock this gallery:
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="PIN (4-6 digits)"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <input
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirm PIN"
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
            />
          </div>
          <button
            onClick={handleToggleLock}
            disabled={isPending || !pin || !confirmPin}
            className="mt-3 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Locking...' : 'Lock Gallery'}
          </button>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          {success}
        </div>
      )}
    </div>
  )
}
