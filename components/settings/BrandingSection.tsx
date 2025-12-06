'use client'

import { useState, useTransition } from 'react'
import { Building2, Mail, Globe, Palette, Loader2, Check } from 'lucide-react'
import { updateBrandingSettings } from '@/server/actions/settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface BrandingSectionProps {
  initialSettings: {
    businessName: string | null
    contactEmail: string | null
    websiteUrl: string | null
    brandColor: string
  }
}

export function BrandingSection({ initialSettings }: BrandingSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    businessName: initialSettings.businessName || '',
    contactEmail: initialSettings.contactEmail || '',
    websiteUrl: initialSettings.websiteUrl || '',
    brandColor: initialSettings.brandColor || '#000000',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    const formData = new FormData()
    formData.set('businessName', settings.businessName)
    formData.set('contactEmail', settings.contactEmail)
    formData.set('websiteUrl', settings.websiteUrl)
    formData.set('brandColor', settings.brandColor)

    startTransition(async () => {
      const result = await updateBrandingSettings(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(result.error || 'Failed to save')
      }
    })
  }

  return (
    <section className="mb-12">
      <h2 className="text-lg font-medium mb-4">Business Branding</h2>
      <p className="text-sm text-gray-500 mb-6">
        Customize how your business appears to clients in galleries and emails.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-6 space-y-5">
          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="businessName" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Business Name
            </Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => setSettings(prev => ({ ...prev, businessName: e.target.value }))}
              placeholder="Your Studio Name"
              className="bg-white"
            />
            <p className="text-xs text-gray-500">
              Shown in gallery headers and client emails
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              Contact Email
            </Label>
            <Input
              id="contactEmail"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="hello@yourstudio.com"
              className="bg-white"
            />
            <p className="text-xs text-gray-500">
              Public email shown to clients (different from your login email)
            </p>
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <Label htmlFor="websiteUrl" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              Website
            </Label>
            <Input
              id="websiteUrl"
              type="url"
              value={settings.websiteUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
              placeholder="https://yourstudio.com"
              className="bg-white"
            />
          </div>

          {/* Brand Color */}
          <div className="space-y-2">
            <Label htmlFor="brandColor" className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-gray-500" />
              Brand Color
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="brandColor"
                value={settings.brandColor}
                onChange={(e) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border border-gray-200"
              />
              <Input
                value={settings.brandColor}
                onChange={(e) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                placeholder="#000000"
                className="bg-white w-32 font-mono text-sm"
                maxLength={7}
              />
              <div 
                className="w-20 h-10 rounded border"
                style={{ backgroundColor: settings.brandColor }}
              />
            </div>
            <p className="text-xs text-gray-500">
              Used for accents in galleries and emails
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button type="submit" disabled={isPending} className="min-w-[120px]">
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>
    </section>
  )
}
