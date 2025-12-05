'use client'

import { useState, useTransition } from 'react'
import { updateUserSettings } from '@/server/actions/settings.actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SettingsFormProps {
  initialSettings: {
    defaultPasswordEnabled: boolean
    defaultDownloadEnabled: boolean
  }
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState(initialSettings)
  const [saved, setSaved] = useState(false)

  const handleToggle = (field: keyof typeof settings) => {
    const newValue = !settings[field]
    setSettings(prev => ({ ...prev, [field]: newValue }))
    setSaved(false)

    // Auto-save on toggle
    const formData = new FormData()
    formData.set(field, String(newValue))

    startTransition(async () => {
      const result = await updateUserSettings(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Password Default Toggle */}
      <div className="flex items-center justify-between py-4 border-b">
        <div>
          <Label htmlFor="defaultPasswordEnabled" className="font-medium">
            Password protect new galleries
          </Label>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, new galleries will require a password by default.
            You can still change this per gallery.
          </p>
        </div>
        <Switch
          id="defaultPasswordEnabled"
          checked={settings.defaultPasswordEnabled}
          onCheckedChange={() => handleToggle('defaultPasswordEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Download Default Toggle */}
      <div className="flex items-center justify-between py-4 border-b">
        <div>
          <Label htmlFor="defaultDownloadEnabled" className="font-medium">
            Allow downloads by default
          </Label>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, clients can download all images from new galleries.
            You can still change this per gallery.
          </p>
        </div>
        <Switch
          id="defaultDownloadEnabled"
          checked={settings.defaultDownloadEnabled}
          onCheckedChange={() => handleToggle('defaultDownloadEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Save indicator */}
      <div className="h-6">
        {isPending && (
          <p className="text-sm text-gray-500">Saving...</p>
        )}
        {saved && !isPending && (
          <p className="text-sm text-green-600">Settings saved</p>
        )}
      </div>
    </div>
  )
}
