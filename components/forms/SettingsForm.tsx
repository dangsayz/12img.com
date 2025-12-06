'use client'

import { useState, useTransition } from 'react'
import { Lock, Download, Clock, Droplets } from 'lucide-react'
import { updateUserSettings } from '@/server/actions/settings.actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SettingsFormProps {
  initialSettings: {
    defaultPasswordEnabled: boolean
    defaultDownloadEnabled: boolean
    defaultGalleryExpiryDays: number | null
    defaultWatermarkEnabled: boolean
  }
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
    <div className="space-y-1">
      {/* Password Default Toggle */}
      <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-50 rounded-lg mt-0.5">
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <Label htmlFor="defaultPasswordEnabled" className="font-medium cursor-pointer">
              Password protect new galleries
            </Label>
            <p className="text-sm text-gray-500 mt-0.5">
              New galleries will require a password by default
            </p>
          </div>
        </div>
        <Switch
          id="defaultPasswordEnabled"
          checked={settings.defaultPasswordEnabled}
          onCheckedChange={() => handleToggle('defaultPasswordEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Download Default Toggle */}
      <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-50 rounded-lg mt-0.5">
            <Download className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <Label htmlFor="defaultDownloadEnabled" className="font-medium cursor-pointer">
              Allow downloads by default
            </Label>
            <p className="text-sm text-gray-500 mt-0.5">
              Clients can download images from new galleries
            </p>
          </div>
        </div>
        <Switch
          id="defaultDownloadEnabled"
          checked={settings.defaultDownloadEnabled}
          onCheckedChange={() => handleToggle('defaultDownloadEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Gallery Expiry */}
      <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <Label htmlFor="defaultGalleryExpiryDays" className="font-medium cursor-pointer">
              Default gallery expiration
            </Label>
            <p className="text-sm text-gray-500 mt-0.5">
              Auto-expire galleries after this many days
            </p>
          </div>
        </div>
        <select
          id="defaultGalleryExpiryDays"
          value={settings.defaultGalleryExpiryDays ?? ''}
          onChange={(e) => handleExpiryChange(e.target.value)}
          disabled={isPending}
          className="w-[140px] h-10 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
      <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
            <Droplets className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <Label htmlFor="defaultWatermarkEnabled" className="font-medium cursor-pointer">
              Watermark images by default
            </Label>
            <p className="text-sm text-gray-500 mt-0.5">
              Apply watermark to images in new galleries
            </p>
          </div>
        </div>
        <Switch
          id="defaultWatermarkEnabled"
          checked={settings.defaultWatermarkEnabled}
          onCheckedChange={() => handleToggle('defaultWatermarkEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Save indicator */}
      <div className="h-6 mt-2 px-4">
        {isPending && (
          <p className="text-sm text-gray-500">Saving...</p>
        )}
        {saved && !isPending && (
          <p className="text-sm text-green-600">✓ Saved</p>
        )}
      </div>
    </div>
  )
}
