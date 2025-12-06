'use client'

import { useState, useTransition } from 'react'
import { Bell, Eye, Download, Archive, Clock } from 'lucide-react'
import { updateNotificationSettings } from '@/server/actions/settings.actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface NotificationSectionProps {
  initialSettings: {
    notifyGalleryViewed: boolean
    notifyImagesDownloaded: boolean
    notifyArchiveReady: boolean
    emailDigestFrequency: 'immediate' | 'daily' | 'weekly' | 'never'
  }
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
    <section className="mb-12">
      <div className="flex items-center gap-2 mb-2">
        <Bell className="w-5 h-5 text-gray-700" />
        <h2 className="text-lg font-medium">Notifications</h2>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Choose what activity you want to be notified about.
      </p>

      <div className="space-y-1">
        {/* Gallery Viewed */}
        <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 rounded-lg mt-0.5">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <Label htmlFor="notifyGalleryViewed" className="font-medium cursor-pointer">
                Gallery viewed
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                Get notified when a client opens your gallery
              </p>
            </div>
          </div>
          <Switch
            id="notifyGalleryViewed"
            checked={settings.notifyGalleryViewed}
            onCheckedChange={(checked) => handleToggle('notifyGalleryViewed', checked)}
            disabled={isPending}
          />
        </div>

        {/* Images Downloaded */}
        <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-50 rounded-lg mt-0.5">
              <Download className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <Label htmlFor="notifyImagesDownloaded" className="font-medium cursor-pointer">
                Images downloaded
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                Get notified when clients download images
              </p>
            </div>
          </div>
          <Switch
            id="notifyImagesDownloaded"
            checked={settings.notifyImagesDownloaded}
            onCheckedChange={(checked) => handleToggle('notifyImagesDownloaded', checked)}
            disabled={isPending}
          />
        </div>

        {/* Archive Ready */}
        <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-50 rounded-lg mt-0.5">
              <Archive className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <Label htmlFor="notifyArchiveReady" className="font-medium cursor-pointer">
                Archive ready
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                Get notified when a gallery ZIP archive is ready
              </p>
            </div>
          </div>
          <Switch
            id="notifyArchiveReady"
            checked={settings.notifyArchiveReady}
            onCheckedChange={(checked) => handleToggle('notifyArchiveReady', checked)}
            disabled={isPending}
          />
        </div>

        {/* Email Digest Frequency */}
        <div className="flex items-center justify-between py-4 px-4 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-50 rounded-lg mt-0.5">
              <Clock className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <Label htmlFor="emailDigestFrequency" className="font-medium cursor-pointer">
                Email frequency
              </Label>
              <p className="text-sm text-gray-500 mt-0.5">
                How often to receive notification emails
              </p>
            </div>
          </div>
          <select
            id="emailDigestFrequency"
            value={settings.emailDigestFrequency}
            onChange={(e) => handleToggle('emailDigestFrequency', e.target.value)}
            disabled={isPending}
            className="w-[140px] h-10 px-3 py-2 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="immediate">Immediate</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
            <option value="never">Never</option>
          </select>
        </div>
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
    </section>
  )
}
