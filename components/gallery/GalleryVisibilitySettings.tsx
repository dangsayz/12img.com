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
    <div className="space-y-1">
      {/* Main Visibility Mode Selector - Compact inline style */}
      <div className="relative">
        <button
          onClick={() => setShowModeSelector(!showModeSelector)}
          disabled={isPending}
          className="w-full flex items-center justify-between py-2 hover:bg-stone-50 rounded-lg px-1 -mx-1 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <CurrentIcon className={`w-4 h-4 ${currentMode.color}`} />
            <div className="text-left">
              <p className="text-sm font-medium text-stone-700">{currentMode.label}</p>
              <p className="text-xs text-stone-400">{currentMode.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPending && <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin" />}
            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {showModeSelector && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg z-50 overflow-hidden"
            >
              {visibilityModes.map((mode) => {
                const Icon = mode.icon
                const isSelected = mode.mode === settings.visibilityMode
                return (
                  <button
                    key={mode.mode}
                    onClick={() => handleModeChange(mode.mode)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-stone-50 transition-colors ${
                      isSelected ? 'bg-stone-50' : ''
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${mode.color}`} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-stone-700">{mode.label}</p>
                      <p className="text-xs text-stone-400">{mode.description}</p>
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

      {/* Show on Profile Toggle - Simple row */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2.5">
          <Eye className="w-4 h-4 text-stone-400" />
          <div>
            <p className="text-sm font-medium text-stone-700">Show on Profile</p>
            <p className="text-xs text-stone-400">Display in your public portfolio</p>
          </div>
        </div>
        <button
          onClick={() => handleToggle('showOnProfile', !settings.showOnProfile)}
          disabled={isPending}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            settings.showOnProfile ? 'bg-emerald-500' : 'bg-stone-300'
          } ${isPending ? 'opacity-50' : ''}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              settings.showOnProfile ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Advanced Settings - Subtle collapsible */}
      <div className="pt-1">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 py-1 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="text-xs">Advanced</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pl-5 pt-2 space-y-2">
                {/* Respect Profile Visibility */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-stone-500">Block direct links if profile private</p>
                  <button
                    onClick={() => handleToggle('respectProfileVisibility', !settings.respectProfileVisibility)}
                    disabled={isPending}
                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                      settings.respectProfileVisibility ? 'bg-emerald-500' : 'bg-stone-300'
                    } ${isPending ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                        settings.respectProfileVisibility ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Inherit Profile PIN */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-stone-500">Use profile PIN (skip double auth)</p>
                  <button
                    onClick={() => handleToggle('inheritProfilePin', !settings.inheritProfilePin)}
                    disabled={isPending}
                    className={`relative w-8 h-4 rounded-full transition-colors shrink-0 ${
                      settings.inheritProfilePin ? 'bg-emerald-500' : 'bg-stone-300'
                    } ${isPending ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${
                        settings.inheritProfilePin ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
