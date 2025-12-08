'use client'

import { useState, useTransition } from 'react'
import { updateNotificationSettings } from '@/server/actions/settings.actions'

interface NotificationSectionProps {
  initialSettings: {
    notifyGalleryViewed: boolean
    notifyImagesDownloaded: boolean
    notifyArchiveReady: boolean
    emailDigestFrequency: 'immediate' | 'daily' | 'weekly' | 'never'
  }
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

export function NotificationSection({ initialSettings }: NotificationSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [settings, setSettings] = useState(initialSettings)

  const handleToggle = (field: keyof typeof settings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
    setSaved(false)

    const formData = new FormData()
    const newSettings = { ...settings, [field]: value }
    formData.set('notifyGalleryViewed', String(newSettings.notifyGalleryViewed))
    formData.set('notifyImagesDownloaded', String(newSettings.notifyImagesDownloaded))
    formData.set('notifyArchiveReady', String(newSettings.notifyArchiveReady))
    formData.set('emailDigestFrequency', newSettings.emailDigestFrequency)

    startTransition(async () => {
      const result = await updateNotificationSettings(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Notifications</h2>

      <div className="bg-stone-50 border border-stone-100 divide-y divide-stone-100">
        {/* Gallery Viewed */}
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-stone-900">Gallery viewed</p>
            <p className="text-sm text-stone-500 mt-0.5">When a client opens your gallery</p>
          </div>
          <Toggle
            checked={settings.notifyGalleryViewed}
            onChange={(checked) => handleToggle('notifyGalleryViewed', checked)}
            disabled={isPending}
          />
        </div>

        {/* Images Downloaded */}
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-stone-900">Images downloaded</p>
            <p className="text-sm text-stone-500 mt-0.5">When clients download images</p>
          </div>
          <Toggle
            checked={settings.notifyImagesDownloaded}
            onChange={(checked) => handleToggle('notifyImagesDownloaded', checked)}
            disabled={isPending}
          />
        </div>

        {/* Archive Ready */}
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-stone-900">Archive ready</p>
            <p className="text-sm text-stone-500 mt-0.5">When a gallery ZIP is ready</p>
          </div>
          <Toggle
            checked={settings.notifyArchiveReady}
            onChange={(checked) => handleToggle('notifyArchiveReady', checked)}
            disabled={isPending}
          />
        </div>

        {/* Email Digest Frequency */}
        <div className="flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium text-stone-900">Email frequency</p>
            <p className="text-sm text-stone-500 mt-0.5">How often to receive emails</p>
          </div>
          <select
            id="emailDigestFrequency"
            value={settings.emailDigestFrequency}
            onChange={(e) => handleToggle('emailDigestFrequency', e.target.value)}
            disabled={isPending}
            className="px-3 py-2 text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-stone-400 disabled:opacity-50"
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="never">Never</option>
          </select>
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
