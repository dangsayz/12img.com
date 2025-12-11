'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Globe, 
  Users, 
  EyeOff, 
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
  Link2,
  Shield,
  Loader2
} from 'lucide-react'
import { 
  updateGalleryVisibilitySettings, 
  type GalleryVisibilityMode,
  type GalleryVisibilitySettings 
} from '@/server/actions/gallery.actions'

interface GalleryVisibilitySettingsProps {
  galleryId: string
  initialSettings: GalleryVisibilitySettings
  onUpdate?: () => void
}

const visibilityModes: {
  mode: GalleryVisibilityMode
  label: string
  description: string
  icon: typeof Globe
  color: string
  bgColor: string
}[] = [
  {
    mode: 'public',
    label: 'Public',
    description: 'Anyone with the link can view',
    icon: Globe,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    mode: 'client_only',
    label: 'Client Only',
    description: 'Only linked clients via portal',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    mode: 'private',
    label: 'Private',
    description: 'Only you can see this gallery',
    icon: EyeOff,
    color: 'text-stone-600',
    bgColor: 'bg-stone-200',
  },
]

export function GalleryVisibilitySettings({
  galleryId,
  initialSettings,
  onUpdate,
}: GalleryVisibilitySettingsProps) {
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState<GalleryVisibilitySettings>(initialSettings)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showModeSelector, setShowModeSelector] = useState(false)

  const currentMode = visibilityModes.find(m => m.mode === settings.visibilityMode) || visibilityModes[0]
  const CurrentIcon = currentMode.icon

  const handleModeChange = (mode: GalleryVisibilityMode) => {
    const newSettings = { ...settings, visibilityMode: mode }
    setSettings(newSettings)
    setShowModeSelector(false)
    
    startTransition(async () => {
      const result = await updateGalleryVisibilitySettings(galleryId, { visibilityMode: mode })
      if (result.error) {
        setSettings(settings) // Revert on error
        console.error('Failed to update visibility:', result.error)
      } else {
        onUpdate?.()
      }
    })
  }

  const handleToggle = (key: keyof Omit<GalleryVisibilitySettings, 'visibilityMode'>, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    startTransition(async () => {
      const result = await updateGalleryVisibilitySettings(galleryId, { [key]: value })
      if (result.error) {
        setSettings(settings) // Revert on error
        console.error('Failed to update setting:', result.error)
      } else {
        onUpdate?.()
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Main Visibility Mode Selector */}
      <div className="relative">
        <button
          onClick={() => setShowModeSelector(!showModeSelector)}
          disabled={isPending}
          className="w-full flex items-center justify-between p-3 bg-white border border-stone-200 rounded-xl hover:border-stone-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${currentMode.bgColor} flex items-center justify-center`}>
              <CurrentIcon className={`w-5 h-5 ${currentMode.color}`} />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-stone-900">{currentMode.label}</p>
              <p className="text-xs text-stone-500">{currentMode.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="w-4 h-4 text-stone-400 animate-spin" />}
            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {showModeSelector && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-lg z-50 overflow-hidden"
            >
              {visibilityModes.map((mode) => {
                const Icon = mode.icon
                const isSelected = mode.mode === settings.visibilityMode
                return (
                  <button
                    key={mode.mode}
                    onClick={() => handleModeChange(mode.mode)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-stone-50 transition-colors ${
                      isSelected ? 'bg-stone-50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg ${mode.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${mode.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-stone-900">{mode.label}</p>
                      <p className="text-xs text-stone-500">{mode.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-500" />
                    )}
                  </button>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Show on Profile Toggle */}
      <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center">
            <Eye className="w-4 h-4 text-stone-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-stone-700">Show on Profile</p>
            <p className="text-xs text-stone-500">Display in your public portfolio</p>
          </div>
        </div>
        <button
          onClick={() => handleToggle('showOnProfile', !settings.showOnProfile)}
          disabled={isPending}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            settings.showOnProfile ? 'bg-emerald-500' : 'bg-stone-300'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              settings.showOnProfile ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Advanced Settings */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-stone-400" />
            <span className="text-sm font-medium text-stone-600">Advanced Settings</span>
          </div>
          {showAdvanced ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 pt-0 space-y-3 border-t border-stone-100">
                {/* Respect Profile Visibility */}
                <div className="flex items-start justify-between gap-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700">Respect Profile Visibility</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      If your profile is private, block direct gallery links too
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('respectProfileVisibility', !settings.respectProfileVisibility)}
                    disabled={isPending}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      settings.respectProfileVisibility ? 'bg-emerald-500' : 'bg-stone-300'
                    } ${isPending ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.respectProfileVisibility ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Inherit Profile PIN */}
                <div className="flex items-start justify-between gap-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-700">Inherit Profile PIN</p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Use profile PIN instead of separate password (avoids double auth)
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle('inheritProfilePin', !settings.inheritProfilePin)}
                    disabled={isPending}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                      settings.inheritProfilePin ? 'bg-emerald-500' : 'bg-stone-300'
                    } ${isPending ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings.inheritProfilePin ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Info Note */}
                <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg mt-2">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    These settings control how visibility rules cascade from your profile to individual galleries.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
