'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Heart,
  Quote,
  MapPin,
  Palette,
  Type,
  Sparkles,
  Check,
  ChevronDown,
  X,
  ImageIcon,
  Loader2,
  Info,
  ExternalLink
} from 'lucide-react'
import { updateGalleryPresentation } from '@/server/actions/gallery.actions'
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

  const sections = [
    { id: 'story', label: 'Story Details', icon: Heart },
    { id: 'quote', label: 'Featured Quote', icon: Quote },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'cover', label: 'Cover Image', icon: ImageIcon },
    { id: 'style', label: 'Visual Style', icon: Palette },
    { id: 'message', label: 'Personal Message', icon: Sparkles },
  ]

  const content = (
    <div className="space-y-1">
      {/* Story Details Section */}
      <CollapsibleSection
        id="story"
        label="Story Details"
        icon={Heart}
        isOpen={activeSection === 'story'}
        onToggle={() => setActiveSection(activeSection === 'story' ? null : 'story')}
      >
        <div className="space-y-6">
          {/* Event Type */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).slice(0, 6).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setEventType(value)}
                  className={`px-3 py-2 text-sm border transition-all ${
                    eventType === value
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 hover:border-stone-400 text-stone-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="mt-2 w-full px-3 py-2 text-sm border border-stone-200 bg-white text-stone-600 focus:border-stone-400 focus:ring-0"
            >
              <option value="">More options...</option>
              {(Object.entries(EVENT_TYPE_LABELS) as [EventType, string][]).slice(6).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
                {eventType === 'portrait' || eventType === 'maternity' ? 'Name' : 'Partner 1'}
              </label>
              <input
                type="text"
                value={partner1}
                onChange={(e) => setPartner1(e.target.value)}
                placeholder="Lexie"
                className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300"
              />
            </div>
            {eventType !== 'portrait' && eventType !== 'maternity' && eventType !== 'newborn' && (
              <div>
                <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
                  Partner 2
                </label>
                <input
                  type="text"
                  value={partner2}
                  onChange={(e) => setPartner2(e.target.value)}
                  placeholder="Taylor"
                  className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300"
                />
              </div>
            )}
          </div>

          {/* Event Date */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Event Date
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Subtitle / Tagline
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="A love story in the hills of Tuscany"
              className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300"
            />
            <p className="mt-1 text-xs text-stone-400">
              Appears below the names on the hero section
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Quote Section */}
      <CollapsibleSection
        id="quote"
        label="Featured Quote"
        icon={Quote}
        isOpen={activeSection === 'quote'}
        onToggle={() => setActiveSection(activeSection === 'quote' ? null : 'quote')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Quote or Vows Excerpt
            </label>
            <textarea
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="In all the world, there is no heart for me like yours..."
              rows={3}
              className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Attribution (optional)
            </label>
            <input
              type="text"
              value={quoteAttribution}
              onChange={(e) => setQuoteAttribution(e.target.value)}
              placeholder="Maya Angelou"
              className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Location Section */}
      <CollapsibleSection
        id="location"
        label="Location"
        icon={MapPin}
        isOpen={activeSection === 'location'}
        onToggle={() => setActiveSection(activeSection === 'location' ? null : 'location')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              Venue Name
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Villa Cimbrone"
              className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
              City / Region
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ravello, Italy"
              className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Cover Image Section */}
      <CollapsibleSection
        id="cover"
        label="Cover Image"
        icon={ImageIcon}
        isOpen={activeSection === 'cover'}
        onToggle={() => setActiveSection(activeSection === 'cover' ? null : 'cover')}
      >
        <div>
          <p className="text-sm text-stone-500 mb-4">
            Select the hero image that will appear at the top of your gallery
          </p>
          <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
            {images.slice(0, 20).map((image) => (
              <button
                key={image.id}
                onClick={() => setCoverImageId(image.id)}
                className={`relative aspect-square overflow-hidden border-2 transition-all ${
                  coverImageId === image.id
                    ? 'border-stone-900 ring-2 ring-stone-900 ring-offset-2'
                    : 'border-transparent hover:border-stone-300'
                }`}
              >
                <Image
                  src={image.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100px"
                />
                {coverImageId === image.id && (
                  <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {images.length > 20 && (
            <p className="mt-2 text-xs text-stone-400">
              Showing first 20 images. Upload more to see additional options.
            </p>
          )}
        </div>
      </CollapsibleSection>

      {/* Visual Style Section */}
      <CollapsibleSection
        id="style"
        label="Visual Style"
        icon={Palette}
        isOpen={activeSection === 'style'}
        onToggle={() => setActiveSection(activeSection === 'style' ? null : 'style')}
      >
        <div className="space-y-6">
          {/* Hero Layout */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-3">
              Hero Layout
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(HERO_LAYOUT_LABELS) as [HeroLayout, { name: string; description: string }][]).map(([value, { name, description }]) => (
                <button
                  key={value}
                  onClick={() => setHeroLayout(value)}
                  className={`p-4 text-left border transition-all ${
                    heroLayout === value
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <p className="font-medium text-stone-900">{name}</p>
                  <p className="text-xs text-stone-500 mt-1">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-3">
              Color Scheme
            </label>
            <div className="flex gap-2">
              {(Object.entries(COLOR_SCHEME_LABELS) as [ColorScheme, { name: string; description: string }][]).map(([value, { name }]) => (
                <button
                  key={value}
                  onClick={() => setColorScheme(value)}
                  className={`flex-1 px-3 py-2 text-sm border transition-all ${
                    colorScheme === value
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 hover:border-stone-400 text-stone-600'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-stone-400 mb-3">
              Typography
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(TYPOGRAPHY_LABELS) as [Typography, { name: string; font: string }][]).map(([value, { name, font }]) => (
                <button
                  key={value}
                  onClick={() => setTypography(value)}
                  className={`p-3 text-center border transition-all ${
                    typography === value
                      ? 'border-stone-900 bg-stone-50'
                      : 'border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <p className="font-medium text-stone-900">{name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{font}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Animations Toggle */}
          <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200">
            <div>
              <p className="font-medium text-stone-900">Enable Animations</p>
              <p className="text-xs text-stone-500">Smooth transitions and scroll effects</p>
            </div>
            <button
              onClick={() => setEnableAnimations(!enableAnimations)}
              className={`w-12 h-7 rounded-full transition-colors ${
                enableAnimations ? 'bg-stone-900' : 'bg-stone-300'
              }`}
            >
              <motion.div
                animate={{ x: enableAnimations ? 22 : 4 }}
                className="w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Personal Message Section */}
      <CollapsibleSection
        id="message"
        label="Personal Message"
        icon={Sparkles}
        isOpen={activeSection === 'message'}
        onToggle={() => setActiveSection(activeSection === 'message' ? null : 'message')}
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
            Thank You Message
          </label>
          <textarea
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Thank you for letting us capture your special day. We hope these images bring back beautiful memories for years to come..."
            rows={4}
            className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300 resize-none"
          />
          <p className="mt-1 text-xs text-stone-400">
            This message appears at the end of the gallery
          </p>
        </div>
      </CollapsibleSection>

      {/* Save Button */}
      <div className="pt-6 border-t border-stone-200 mt-6">
        <button
          onClick={handleSave}
          disabled={isSaving || showSuccess}
          className={`w-full h-14 font-medium flex items-center justify-center gap-2 transition-all ${
            showSuccess 
              ? 'bg-emerald-500 text-white' 
              : 'bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : showSuccess ? (
            <>
              <Check className="w-5 h-5" />
              Saved! Opening preview...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              Save & Preview
            </>
          )}
        </button>
        {errorMessage && (
          <p className="text-center text-sm text-red-600 mt-3 font-medium">
            {errorMessage}
          </p>
        )}
        <p className="text-center text-xs text-stone-400 mt-3">
          {showSuccess 
            ? 'Your presentation is ready for clients ✨' 
            : 'These settings customize how your gallery appears to clients'
          }
        </p>
      </div>
    </div>
  )

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl"
        >
          {/* Modal Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-stone-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-serif text-stone-900">Presentation Settings</h2>
              <p className="text-sm text-stone-500">{galleryTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>
          
          {/* Modal Content */}
          <div className="p-6">
            {content}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 p-6">
      <div className="mb-6">
        <h2 className="text-xl font-serif text-stone-900">Final Delivery Settings</h2>
        <p className="text-sm text-stone-500 mt-1">
          Customize how your gallery appears to clients
        </p>
      </div>
      {content}
    </div>
  )
}

// Collapsible Section Component
function CollapsibleSection({
  id,
  label,
  icon: Icon,
  isOpen,
  onToggle,
  children,
}: {
  id: string
  label: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-stone-200 bg-white">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-stone-400" />
          <span className="font-medium text-stone-900">{label}</span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-6 pt-2 border-t border-stone-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
