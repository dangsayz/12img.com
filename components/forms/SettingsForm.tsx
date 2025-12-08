'use client'

import { useState, useTransition } from 'react'
import { updateUserSettings } from '@/server/actions/settings.actions'

interface SettingsFormProps {
  initialSettings: {
    defaultPasswordEnabled: boolean
    defaultDownloadEnabled: boolean
    defaultGalleryExpiryDays: number | null
    defaultWatermarkEnabled: boolean
  }
}

// Simple toggle switch component
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
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

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState(initialSettings)
  const [saved, setSaved] = useState(false)

  const saveSettings = (newSettings: typeof settings) => {
    setSaved(false)
    const formData = new FormData()
    formData.set('defaultPasswordEnabled', String(newSettings.defaultPasswordEnabled))
    formData.set('defaultDownloadEnabled', String(newSettings.defaultDownloadEnabled))
    formData.set('defaultWatermarkEnabled', String(newSettings.defaultWatermarkEnabled))
    if (newSettings.defaultGalleryExpiryDays) {
      formData.set('defaultGalleryExpiryDays', String(newSettings.defaultGalleryExpiryDays))
    }

    startTransition(async () => {
      const result = await updateUserSettings(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  const handleToggle = (field: 'defaultPasswordEnabled' | 'defaultDownloadEnabled' | 'defaultWatermarkEnabled') => {
    const newSettings = { ...settings, [field]: !settings[field] }
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  const handleExpiryChange = (value: string) => {
    const days = value === '' ? null : parseInt(value, 10)
    const newSettings = { ...settings, defaultGalleryExpiryDays: days }
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  return (
    <div className="bg-stone-50 border border-stone-100 divide-y divide-stone-100">
      {/* Password Default Toggle */}
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-stone-900">Password protect new galleries</p>
          <p className="text-sm text-stone-500 mt-0.5">Require a password by default</p>
        </div>
        <Toggle
          checked={settings.defaultPasswordEnabled}
          onChange={() => handleToggle('defaultPasswordEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Download Default Toggle */}
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-stone-900">Allow downloads by default</p>
          <p className="text-sm text-stone-500 mt-0.5">Clients can download images</p>
        </div>
        <Toggle
          checked={settings.defaultDownloadEnabled}
          onChange={() => handleToggle('defaultDownloadEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Gallery Expiry */}
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-stone-900">Default gallery expiration</p>
          <p className="text-sm text-stone-500 mt-0.5">Auto-expire after this many days</p>
        </div>
        <select
          id="defaultGalleryExpiryDays"
          value={settings.defaultGalleryExpiryDays ?? ''}
          onChange={(e) => handleExpiryChange(e.target.value)}
          disabled={isPending}
          className="px-3 py-2 text-sm border border-stone-200 bg-white text-stone-900 focus:outline-none focus:border-stone-400 disabled:opacity-50"
        >
          <option value="">Never</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
          <option value="60">60 days</option>
          <option value="90">90 days</option>
          <option value="180">180 days</option>
          <option value="365">1 year</option>
        </select>
      </div>

      {/* Watermark Toggle */}
      <div className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm font-medium text-stone-900">Watermark images by default</p>
          <p className="text-sm text-stone-500 mt-0.5">Apply watermark to new galleries</p>
        </div>
        <Toggle
          checked={settings.defaultWatermarkEnabled}
          onChange={() => handleToggle('defaultWatermarkEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Save indicator */}
      <div className="h-6 p-3">
        {isPending && <p className="text-sm text-stone-500">Saving...</p>}
        {saved && !isPending && <p className="text-sm text-stone-600">✓ Saved</p>}
      </div>
    </div>
  )
}
