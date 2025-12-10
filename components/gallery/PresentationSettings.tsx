'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Quote,
  MapPin,
  Palette,
  Type,
  MessageSquare,
  Check,
  ChevronDown,
  X,
  ImageIcon,
  Loader2,
} from 'lucide-react'
import { updateGalleryPresentation, getLocationSuggestions } from '@/server/actions/gallery.actions'
import { LocationAutocomplete } from './LocationAutocomplete'
import {
  type PresentationData,
  type EventType,
  type HeroLayout,
  type ColorScheme,
  type Typography,
  EVENT_TYPE_LABELS,
  HERO_LAYOUT_LABELS,
  COLOR_SCHEME_LABELS,
  TYPOGRAPHY_LABELS,
  DEFAULT_PRESENTATION,
} from '@/lib/types/presentation'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl?: string
}

interface PresentationSettingsProps {
  galleryId: string
  galleryTitle: string
  images: GalleryImage[]
  initialData?: PresentationData | null
  onSave?: () => void
  onClose?: () => void
  isModal?: boolean
}

export function PresentationSettings({
  galleryId,
  galleryTitle,
  images,
  initialData,
  onSave,
  onClose,
  isModal = false,
}: PresentationSettingsProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string | null>('story')
  
  // Form state
  const [eventDate, setEventDate] = useState(initialData?.eventDate || '')
  const [eventType, setEventType] = useState<EventType | ''>(initialData?.eventType || '')
  const [partner1, setPartner1] = useState(initialData?.coupleNames?.partner1 || '')
  const [partner2, setPartner2] = useState(initialData?.coupleNames?.partner2 || '')
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '')
  const [quote, setQuote] = useState(initialData?.quote || '')
  const [quoteAttribution, setQuoteAttribution] = useState(initialData?.quoteAttribution || '')
  const [venue, setVenue] = useState(initialData?.venue || '')
  const [location, setLocation] = useState(initialData?.location || '')
  const [coverImageId, setCoverImageId] = useState(initialData?.coverImageId || '')
  const [heroLayout, setHeroLayout] = useState<HeroLayout>(initialData?.heroLayout || DEFAULT_PRESENTATION.heroLayout!)
  const [colorScheme, setColorScheme] = useState<ColorScheme>(initialData?.colorScheme || DEFAULT_PRESENTATION.colorScheme!)
  const [typography, setTypography] = useState<Typography>(initialData?.typography || DEFAULT_PRESENTATION.typography!)
  const [customMessage, setCustomMessage] = useState(initialData?.customMessage || '')
  const [enableAnimations, setEnableAnimations] = useState(initialData?.enableAnimations ?? DEFAULT_PRESENTATION.enableAnimations!)
  
  // Location suggestions for autocomplete
  const [venueSuggestions, setVenueSuggestions] = useState<string[]>([])
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([])
  
  // Fetch location suggestions on mount
  useEffect(() => {
    getLocationSuggestions().then(({ venues, locations }) => {
      setVenueSuggestions(venues)
      setLocationSuggestions(locations)
    })
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setErrorMessage(null)
    
    const presentationData: PresentationData = {
      eventDate: eventDate || undefined,
      eventType: eventType || undefined,
      coupleNames: partner1 ? { partner1, partner2: partner2 || undefined } : undefined,
      subtitle: subtitle || undefined,
      quote: quote || undefined,
      quoteAttribution: quoteAttribution || undefined,
      venue: venue || undefined,
      location: location || undefined,
      coverImageId: coverImageId || undefined,
      heroLayout,
      colorScheme,
      typography,
      customMessage: customMessage || undefined,
      enableAnimations,
    }

    const result = await updateGalleryPresentation(galleryId, presentationData)
    
    setIsSaving(false)
    
    if (result.success) {
      setShowSuccess(true)
      onSave?.()
      // Redirect to preview after a brief success message
      setTimeout(() => {
        window.open(`/view-reel/${galleryId}`, '_blank')
        onClose?.()
      }, 1500)
    } else {
      setErrorMessage(result.error || 'Failed to save. Please try again.')
    }
  }

  // Check if any fields have been filled
  const hasAnyData = partner1 || partner2 || eventDate || subtitle || quote || venue || location || coverImageId || customMessage

  const content = (
    <div className="space-y-3">
      {/* Soft hint for first-time users */}
      {!hasAnyData && (
        <p className="text-xs text-neutral-400 leading-relaxed pb-3 border-b border-neutral-100">
          Start with Tagline below. Everything is optional.
        </p>
      )}
      {/* Tagline Section */}
      <CollapsibleSection
        id="story"
        label="Tagline"
        icon={Type}
        isOpen={activeSection === 'story'}
        onToggle={() => setActiveSection(activeSection === 'story' ? null : 'story')}
        hint="A short phrase for the hero"
        filled={!!subtitle}
      >
        <input
          type="text"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="test test test"
          className="w-full px-3 py-2.5 border border-neutral-200 focus:border-black focus:ring-0 text-black placeholder:text-neutral-300 text-sm"
        />
      </CollapsibleSection>

      {/* Quote Section */}
      <CollapsibleSection
        id="quote"
        label="Featured Quote"
        icon={Quote}
        isOpen={activeSection === 'quote'}
        onToggle={() => setActiveSection(activeSection === 'quote' ? null : 'quote')}
        hint="Add a meaningful quote or vows"
        filled={!!quote}
      >
        <div className="space-y-3">
          <textarea
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="In all the world, there is no heart for me like yours..."
            rows={2}
            className="w-full px-3 py-2.5 border border-neutral-200 focus:border-black focus:ring-0 text-black placeholder:text-neutral-300 resize-none text-sm"
          />
          <input
            type="text"
            value={quoteAttribution}
            onChange={(e) => setQuoteAttribution(e.target.value)}
            placeholder="Attribution (optional)"
            className="w-full px-3 py-2.5 border border-neutral-200 focus:border-black focus:ring-0 text-black placeholder:text-neutral-300 text-sm"
          />
        </div>
      </CollapsibleSection>

      {/* Location Section */}
      <CollapsibleSection
        id="location"
        label="Location"
        icon={MapPin}
        isOpen={activeSection === 'location'}
        onToggle={() => setActiveSection(activeSection === 'location' ? null : 'location')}
        hint="Venue and city/region"
        filled={!!(venue || location)}
      >
        <div className="space-y-3">
          <LocationAutocomplete
            value={venue}
            onChange={setVenue}
            suggestions={venueSuggestions}
            placeholder="Venue name"
            label=""
          />
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            suggestions={locationSuggestions}
            placeholder="City / Region"
            label=""
          />
        </div>
      </CollapsibleSection>

      {/* Cover Image Section */}
      <CollapsibleSection
        id="cover"
        label="Cover Image"
        icon={ImageIcon}
        isOpen={activeSection === 'cover'}
        onToggle={() => setActiveSection(activeSection === 'cover' ? null : 'cover')}
        hint="Choose the hero image"
        filled={!!coverImageId}
      >
        {images.length === 0 ? (
          <p className="text-xs text-neutral-400">No images yet</p>
        ) : (
          <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
            {images.slice(0, 24).map((image) => (
              <button
                key={image.id}
                onClick={() => setCoverImageId(image.id)}
                className={`relative aspect-square overflow-hidden transition-all ${
                  coverImageId === image.id
                    ? 'ring-2 ring-black ring-offset-1'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={image.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </CollapsibleSection>

      {/* Visual Style Section */}
      <CollapsibleSection
        id="style"
        label="Visual Style"
        icon={Palette}
        isOpen={activeSection === 'style'}
        onToggle={() => setActiveSection(activeSection === 'style' ? null : 'style')}
        hint="Layout, colors, and typography"
      >
        <div className="space-y-4">
          {/* Hero Layout */}
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(HERO_LAYOUT_LABELS) as [HeroLayout, { name: string; description: string }][]).map(([value, { name }]) => (
              <button
                key={value}
                onClick={() => setHeroLayout(value)}
                className={`px-3 py-2 text-xs text-left border transition-all ${
                  heroLayout === value
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Color Scheme */}
          <div className="flex gap-1.5">
            {(Object.entries(COLOR_SCHEME_LABELS) as [ColorScheme, { name: string; description: string }][]).map(([value, { name }]) => (
              <button
                key={value}
                onClick={() => setColorScheme(value)}
                className={`flex-1 px-2 py-2 text-xs border transition-all ${
                  colorScheme === value
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Typography */}
          <div className="grid grid-cols-3 gap-1.5">
            {(Object.entries(TYPOGRAPHY_LABELS) as [Typography, { name: string; font: string }][]).map(([value, { name }]) => (
              <button
                key={value}
                onClick={() => setTypography(value)}
                className={`px-2 py-2 text-xs border transition-all ${
                  typography === value
                    ? 'border-black bg-black text-white'
                    : 'border-neutral-200 hover:border-neutral-400 text-neutral-600'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Animations Toggle */}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-neutral-600">Animations</span>
            <button
              onClick={() => setEnableAnimations(!enableAnimations)}
              className={`w-9 h-5 rounded-full transition-colors ${
                enableAnimations ? 'bg-black' : 'bg-neutral-300'
              }`}
            >
              <motion.div
                animate={{ x: enableAnimations ? 17 : 2 }}
                className="w-4 h-4 bg-white rounded-full"
              />
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Personal Message Section */}
      <CollapsibleSection
        id="message"
        label="Personal Message"
        icon={MessageSquare}
        isOpen={activeSection === 'message'}
        onToggle={() => setActiveSection(activeSection === 'message' ? null : 'message')}
        hint="A thank you note for clients"
        filled={!!customMessage}
      >
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Thank you for letting us capture your special day..."
          rows={3}
          className="w-full px-3 py-2.5 border border-neutral-200 focus:border-black focus:ring-0 text-black placeholder:text-neutral-300 resize-none text-sm"
        />
      </CollapsibleSection>

      {/* Save Button */}
      <div className="pt-4 border-t border-neutral-100 mt-4">
        <button
          onClick={handleSave}
          disabled={isSaving || showSuccess}
          className="w-full h-11 text-sm font-medium flex items-center justify-center gap-2 transition-all bg-black hover:bg-neutral-800 disabled:bg-neutral-400 text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : showSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Saved! Opening preview...
            </>
          ) : (
            'Save & Preview'
          )}
        </button>
        {errorMessage && (
          <p className="text-center text-xs text-neutral-500 mt-2">
            {errorMessage}
          </p>
        )}
        <p className="text-center text-[11px] text-neutral-400 mt-2">
          Opens a preview in a new tab
        </p>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white shadow-xl m-4"
        >
          {/* Modal Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-medium text-black">Presentation Settings</h2>
              <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                Customize {galleryTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-neutral-100 transition-colors"
            >
              <X className="w-4 h-4 text-neutral-500" />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-4">
            {content}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-neutral-200 p-4">
      <div className="mb-4">
        <h2 className="text-sm font-medium text-black">Presentation Settings</h2>
      </div>
      {content}
    </div>
  )
}

// Collapsible Section Component - Minimalist black/white design
function CollapsibleSection({
  id,
  label,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  hint,
  filled,
}: {
  id: string
  label: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  hint?: string
  filled?: boolean
}) {
  return (
    <div className="border border-neutral-200 bg-white">
      <button
        onClick={onToggle}
        className="w-full px-3 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 ${filled ? 'text-black' : 'text-neutral-400'}`} />
          <div className="text-left min-w-0">
            <span className="text-sm text-black">{label}</span>
            {hint && !isOpen && <span className="text-[11px] text-neutral-400 block">{hint}</span>}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-4 pt-1 border-t border-neutral-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
