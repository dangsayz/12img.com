'use client'

import { useState, useTransition } from 'react'
import { updateSocialSharingEnabled } from '@/server/actions/settings.actions'

interface SocialSharingSectionProps {
  initialEnabled: boolean
}

// Simple toggle switch component
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-stone-900' : 'bg-stone-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

export function SocialSharingSection({ initialEnabled }: SocialSharingSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [enabled, setEnabled] = useState(initialEnabled)

  const handleToggle = (value: boolean) => {
    setEnabled(value)
    setSaved(false)

    startTransition(async () => {
      const result = await updateSocialSharingEnabled(value)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Social Sharing</h2>

      <div className="bg-stone-50 border border-stone-100">
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-stone-900">Enable social sharing</p>
            <p className="text-sm text-stone-500 mt-0.5">
              Show Pinterest, Facebook, and X share buttons on your portfolio images
            </p>
          </div>
          <Toggle
            checked={enabled}
            onChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Save indicator */}
      <div className="h-6 mt-3">
        {isPending && <p className="text-sm text-stone-500">Saving...</p>}
        {saved && !isPending && <p className="text-sm text-stone-600">✓ Saved</p>}
      </div>
    </section>
  )
}
