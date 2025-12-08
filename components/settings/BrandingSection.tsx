'use client'

import { useState, useTransition, useEffect } from 'react'
import { Loader2, Check, AlertCircle, Pencil, X, Info } from 'lucide-react'
import { updateBrandingSettings, changeCompanyName, getNameChangeInfo } from '@/server/actions/settings.actions'

interface BrandingSectionProps {
  initialSettings: {
    businessName: string | null
    contactEmail: string | null
    websiteUrl: string | null
    brandColor: string
  }
}

interface NameChangeInfo {
  usedChanges: number
  remainingChanges: number
  maxChanges: number
  history: Array<{
    id: string
    old_name: string | null
    new_name: string
    changed_at: string
  }>
}

// Normalize URL - auto-add https:// if missing
function normalizeUrl(input: string): string {
  if (!input.trim()) return ''
  let url = input.trim()
  // Remove any leading/trailing whitespace
  url = url.replace(/\s+/g, '')
  // If it doesn't start with a protocol, add https://
  if (url && !url.match(/^https?:\/\//i)) {
    // Remove www. prefix for cleaner URLs, then add https://
    url = url.replace(/^www\./i, '')
    url = `https://${url}`
  }
  return url
}

export function BrandingSection({ initialSettings }: BrandingSectionProps) {
  const [isPending, startTransition] = useTransition()
  const [isChangingName, startNameTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  const [settings, setSettings] = useState({
    businessName: initialSettings.businessName || '',
    contactEmail: initialSettings.contactEmail || '',
    websiteUrl: initialSettings.websiteUrl || '',
    brandColor: initialSettings.brandColor || '#000000',
  })
  
  // Name change state
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState(initialSettings.businessName || '')
  const [nameChangeInfo, setNameChangeInfo] = useState<NameChangeInfo | null>(null)
  const [nameChangeSuccess, setNameChangeSuccess] = useState(false)

  // Fetch name change info on mount
  useEffect(() => {
    getNameChangeInfo().then(result => {
      if (result.success && 'remainingChanges' in result) {
        setNameChangeInfo({
          usedChanges: result.usedChanges!,
          remainingChanges: result.remainingChanges!,
          maxChanges: result.maxChanges!,
          history: result.history || [],
        })
      }
    })
  }, [])

  const handleNameChange = () => {
    if (!newName.trim()) {
      setNameError('Company name cannot be empty')
      return
    }
    
    setNameError(null)
    startNameTransition(async () => {
      const result = await changeCompanyName(newName)
      if (result.success) {
        setSettings(prev => ({ ...prev, businessName: result.newName! }))
        setIsEditingName(false)
        setNameChangeSuccess(true)
        setTimeout(() => setNameChangeSuccess(false), 3000)
        // Update remaining changes
        if (nameChangeInfo) {
          setNameChangeInfo({
            ...nameChangeInfo,
            usedChanges: nameChangeInfo.usedChanges + 1,
            remainingChanges: result.remainingChanges!,
          })
        }
      } else {
        setNameError(result.error || 'Failed to change name')
      }
    })
  }

  const cancelNameEdit = () => {
    setIsEditingName(false)
    setNewName(settings.businessName)
    setNameError(null)
  }
  
  // Auto-normalize URL on blur
  const handleWebsiteBlur = () => {
    const normalized = normalizeUrl(settings.websiteUrl)
    if (normalized !== settings.websiteUrl) {
      setSettings(prev => ({ ...prev, websiteUrl: normalized }))
    }
  }

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
    <section className="mb-16">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Business Branding</h2>

      {/* Company Name Section - Separate from other branding */}
      <div className="bg-stone-50 border border-stone-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <label className="block text-sm text-stone-600 mb-2">
              Company Name
            </label>
            
            {isEditingName ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Your Studio Name"
                  className="w-full px-4 py-3 bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleNameChange}
                    disabled={isChangingName || !newName.trim()}
                    className="px-4 py-2 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
                  >
                    {isChangingName ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      'Save Name'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelNameEdit}
                    className="px-4 py-2 text-stone-600 text-sm hover:text-stone-900 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {nameError && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {nameError}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium text-stone-900">
                  {settings.businessName || 'Not set'}
                </span>
                {nameChangeSuccess && (
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="w-4 h-4" />
                    Updated
                  </span>
                )}
                {nameChangeInfo && nameChangeInfo.remainingChanges > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewName(settings.businessName)
                      setIsEditingName(true)
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded transition-colors"
                    title="Change company name"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Name change limit info */}
        {nameChangeInfo && (
          <div className="mt-4 pt-4 border-t border-stone-200">
            <div className="flex items-start gap-2 text-sm">
              <Info className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
              <div className="text-stone-500">
                {nameChangeInfo.remainingChanges > 0 ? (
                  <>
                    You have <span className="font-medium text-stone-700">{nameChangeInfo.remainingChanges}</span> name change{nameChangeInfo.remainingChanges !== 1 ? 's' : ''} remaining this year.
                    {' '}Changing your name will update it everywhere instantly.
                  </>
                ) : (
                  <>
                    You&apos;ve used all {nameChangeInfo.maxChanges} name changes for {new Date().getFullYear()}.
                    {' '}You can change your name again starting January 1, {new Date().getFullYear() + 1}.
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-stone-50 border border-stone-100 p-6 space-y-6">

          {/* Contact Email */}
          <div>
            <label htmlFor="contactEmail" className="block text-sm text-stone-600 mb-2">
              Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              value={settings.contactEmail}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              placeholder="hello@yourstudio.com"
              className="w-full px-4 py-3 bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          {/* Website URL */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm text-stone-600 mb-2">
              Website
            </label>
            <input
              id="websiteUrl"
              type="text"
              value={settings.websiteUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, websiteUrl: e.target.value }))}
              onBlur={handleWebsiteBlur}
              placeholder="yourstudio.com"
              className="w-full px-4 py-3 bg-white border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            />
          </div>

          {/* Brand Color */}
          <div>
            <label htmlFor="brandColor" className="block text-sm text-stone-600 mb-2">
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                id="brandColor"
                value={settings.brandColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                className="w-12 h-12 cursor-pointer border border-stone-200 bg-white"
              />
              <input
                type="text"
                value={settings.brandColor}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSettings(prev => ({ ...prev, brandColor: e.target.value }))}
                placeholder="#000000"
                className="w-28 px-3 py-2 bg-white border border-stone-200 text-stone-900 font-mono text-sm focus:outline-none focus:border-stone-400 transition-colors"
                maxLength={7}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button 
            type="submit" 
            disabled={isPending}
            className="px-6 py-3 bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : saved ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Saved
              </span>
            ) : (
              'Save Changes'
            )}
          </button>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>
    </section>
  )
}
