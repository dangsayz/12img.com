'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { updateGalleryTemplate, updateGallery, toggleGalleryVisibility } from '@/server/actions/gallery.actions'
import { 
  ArrowLeft,
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Download,
  Lock,
  Unlock,
  Settings,
  Plus,
  Trash2,
  Share2,
  Mail,
  Smartphone,
  Eye,
  EyeOff,
  LayoutGrid,
  Layers,
  Film,
  BookOpen,
  Activity,
  Play,
  Pencil,
  Link2,
  Send,
  Globe,
  GripVertical,
  Shield,
  FileText
} from 'lucide-react'
import { EmailActivity } from '@/components/gallery/EmailActivity'
import { ShareModal } from '@/components/gallery/ShareModal'
import { FocalPointEditor } from '@/components/gallery/FocalPointEditor'
import { PresentationSettings } from '@/components/gallery/PresentationSettings'
import { SortableImageGrid } from '@/components/gallery/SortableImageGrid'
import { type GalleryTemplate, GALLERY_TEMPLATES, DEFAULT_TEMPLATE } from '@/components/gallery/templates'
import type { PresentationData } from '@/lib/types/presentation'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width: number | null
  height: number | null
  focalX?: number | null
  focalY?: number | null
}

// Masonry item that detects actual image dimensions and supports focal point
function MasonryImageItem({
  image,
  index,
  isHero,
  isSelecting,
  isSelected,
  onSelect,
  onEditFocalPoint,
}: {
  image: GalleryImage
  index: number
  isHero: boolean
  isSelecting: boolean
  isSelected: boolean
  onSelect: () => void
  onEditFocalPoint: () => void
}) {
  const [aspectRatio, setAspectRatio] = useState<number>(
    image.width && image.height ? image.width / image.height : 1
  )
  const [loaded, setLoaded] = useState(false)
  
  const imgSrc = image.originalUrl || image.previewUrl || image.thumbnailUrl
  
  // Focal point for object-position (default to center)
  const focalX = image.focalX ?? 50
  const focalY = image.focalY ?? 50
  const hasFocalPoint = image.focalX !== null && image.focalX !== undefined

  // If we don't have dimensions, detect them when image loads
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.naturalWidth && img.naturalHeight) {
      setAspectRatio(img.naturalWidth / img.naturalHeight)
    }
    setLoaded(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0.5 }}
      transition={{ duration: 0.3 }}
      className={`
        relative cursor-pointer group overflow-hidden break-inside-avoid mb-2 bg-stone-100
        ${isSelecting && isSelected ? 'ring-2 ring-stone-900' : ''}
      `}
      style={{ aspectRatio }}
      onClick={() => {
        if (isSelecting) {
          onSelect()
        }
      }}
    >
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          style={{ objectPosition: `${focalX}% ${focalY}%` }}
          sizes={isHero ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
          quality={100}
          loading={index < 6 ? "eager" : "lazy"}
          onLoad={handleImageLoad}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-200 animate-pulse">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Focal point indicator (shows if custom focal point is set) */}
      {hasFocalPoint && !isSelecting && (
        <div 
          className="absolute w-3 h-3 rounded-full bg-white border-2 border-stone-900 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ 
            left: `${focalX}%`, 
            top: `${focalY}%`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      )}
      
      {/* Selection checkbox */}
      {isSelecting && (
        <div className={`absolute top-2 left-2 w-5 h-5 border-2 flex items-center justify-center transition-colors ${
          isSelected
            ? 'bg-stone-900 border-stone-900'
            : 'bg-white/90 border-stone-400'
        }`}>
          {isSelected && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
      )}

      {/* Hover actions */}
      {!isSelecting && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Focal point button */}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                onEditFocalPoint()
              }}
              className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors rounded"
              title="Set focal point"
            >
              <svg className="w-4 h-4 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
            </button>
            <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors rounded">
              <ExternalLink className="w-4 h-4 text-stone-600" />
            </button>
            <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors rounded">
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface GalleryData {
  id: string
  title: string
  slug: string
  password_hash: string | null
  download_enabled: boolean
  is_public: boolean
  is_locked: boolean
  template?: string
  created_at: string
  imageCount: number
  presentation_data?: PresentationData | null
}

interface GalleryEditorProps {
  gallery: GalleryData
  images: GalleryImage[]
  photographerName?: string
  totalFileSizeBytes: number
}

export function GalleryEditor({ 
  gallery, 
  images, 
  photographerName,
  totalFileSizeBytes 
}: GalleryEditorProps) {
  const router = useRouter()
  const templateDropdownRef = useRef<HTMLDivElement>(null)
  
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<GalleryTemplate>(
    (gallery.template as GalleryTemplate) || DEFAULT_TEMPLATE
  )
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(50)
  const [loadedImages, setLoadedImages] = useState<GalleryImage[]>(images)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [focalPointImage, setFocalPointImage] = useState<GalleryImage | null>(null)
  const [showPresentationSettings, setShowPresentationSettings] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(gallery.title)
  const [currentTitle, setCurrentTitle] = useState(gallery.title)
  const [isSavingTitle, setIsSavingTitle] = useState(false)
  const [titleSaveSuccess, setTitleSaveSuccess] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [isPublic, setIsPublic] = useState(gallery.is_public)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)

  useEffect(() => {
    setShareUrl(`${window.location.origin}/view-reel/${gallery.id}`)
  }, [gallery.id])

  // Handle visibility toggle
  const handleVisibilityToggle = async () => {
    const newValue = !isPublic
    setIsTogglingVisibility(true)
    setIsPublic(newValue) // Optimistic update
    
    try {
      const result = await toggleGalleryVisibility(gallery.id, newValue)
      if (result.error) {
        // Revert on error
        setIsPublic(!newValue)
        console.error('Failed to toggle visibility:', result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      // Revert on error
      setIsPublic(!newValue)
      console.error('Failed to toggle visibility:', error)
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setShowTemplates(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTemplates(false)
      }
    }

    if (showTemplates) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [showTemplates])

  // Handle template change - save immediately
  const handleTemplateChange = async (templateId: GalleryTemplate) => {
    const previousTemplate = currentTemplate
    setCurrentTemplate(templateId)
    setShowTemplates(false)
    setIsSavingTemplate(true)
    
    try {
      console.log('Saving template:', templateId, 'for gallery:', gallery.id)
      const result = await updateGalleryTemplate(gallery.id, templateId)
      console.log('Save result:', result)
      
      if (result.error) {
        console.error('Failed to save template:', result.error)
        alert(`Failed to save: ${result.error}`)
        // Revert on error
        setCurrentTemplate(previousTemplate)
      } else {
        console.log('Template saved successfully!')
        // Refresh to update any cached data
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to save template:', error)
      alert('Failed to save template. Check console for details.')
      setCurrentTemplate(previousTemplate)
    } finally {
      setIsSavingTemplate(false)
    }
  }

  // Handle title edit
  const handleTitleEdit = () => {
    setIsEditingTitle(true)
    setEditedTitle(currentTitle)
    setTimeout(() => titleInputRef.current?.focus(), 0)
  }

  const handleTitleSave = async () => {
    if (!editedTitle.trim() || editedTitle === currentTitle) {
      setIsEditingTitle(false)
      setEditedTitle(currentTitle)
      return
    }

    setIsSavingTitle(true)
    try {
      const formData = new FormData()
      formData.append('title', editedTitle.trim())
      
      const result = await updateGallery(gallery.id, formData)
      
      if (result.error) {
        alert(`Failed to save: ${result.error}`)
        setEditedTitle(currentTitle)
      } else {
        // Update local state with new title
        setCurrentTitle(editedTitle.trim())
        // Show success message
        setTitleSaveSuccess(true)
        setTimeout(() => setTitleSaveSuccess(false), 2000)
        // Update URL to use gallery ID to avoid slug mismatch issues
        window.history.replaceState(null, '', `/gallery/${gallery.id}`)
      }
    } catch (error) {
      console.error('Failed to save title:', error)
      alert('Failed to save title')
      setEditedTitle(currentTitle)
    } finally {
      setIsSavingTitle(false)
      setIsEditingTitle(false)
    }
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave()
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false)
      setEditedTitle(currentTitle)
    }
  }

  // Load more images on demand
  const loadMoreImages = async () => {
    if (isLoadingMore) return
    
    setIsLoadingMore(true)
    try {
      const response = await fetch(
        `/api/gallery/${gallery.id}/images?offset=${visibleCount}&limit=50`
      )
      if (response.ok) {
        const data = await response.json()
        // Update images with URLs
        setLoadedImages(prev => {
          const updated = [...prev]
          data.images.forEach((img: GalleryImage, i: number) => {
            const index = visibleCount + i
            if (updated[index]) {
              updated[index] = img
            }
          })
          return updated
        })
        setVisibleCount(prev => prev + 50)
      }
    } catch (error) {
      console.error('Failed to load more images:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }

  const templateIcons: Record<GalleryTemplate, React.ReactNode> = {
    'clean-grid': <LayoutGrid className="w-4 h-4" />,
    'mosaic': <Layers className="w-4 h-4" />,
    'cinematic': <Film className="w-4 h-4" />,
    'editorial': <BookOpen className="w-4 h-4" />,
  }

  const getPreviewUrl = (template: GalleryTemplate) => {
    switch (template) {
      case 'editorial': return `/view-live/${gallery.id}`
      case 'cinematic': return `/view-reel/${gallery.id}`
      default: return `/view-reel/${gallery.id}`
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formattedDate = new Date(gallery.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  // Get cover image (first image or null)
  const coverImage = images[0] || null

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Hero Section with Cover */}
      <div className="relative">
        {/* Background - clean solid color */}
        <div className="absolute inset-0 h-[60vh] bg-[#fafaf9]" />

        {/* Header */}
        <header className="relative z-30">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <Link 
                href="/"
                className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Back</span>
              </Link>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPresentationSettings(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Presentation
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Cover + Title Section */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-16">
          <div className="flex flex-col lg:flex-row gap-12 items-start">
            {/* Cover Image */}
            <div className="lg:w-1/2">
              {coverImage ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative aspect-[4/5] bg-white shadow-2xl shadow-stone-900/10"
                >
                  <Image
                    src={coverImage.previewUrl}
                    alt={gallery.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </motion.div>
              ) : (
                <div className="aspect-[4/5] bg-stone-200 flex items-center justify-center">
                  <Plus className="w-12 h-12 text-stone-400" />
                </div>
              )}
              
              {/* Photographer Credit - Vertical */}
              {photographerName && (
                <div className="absolute -left-8 top-1/2 -translate-y-1/2 hidden lg:block">
                  <p className="text-xs text-stone-400 tracking-[0.2em] uppercase [writing-mode:vertical-lr] rotate-180">
                    Photos by {photographerName}
                  </p>
                </div>
              )}
            </div>

            {/* Title & Info */}
            <div className="lg:w-1/2 lg:pt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {/* Editable Title */}
                <div className="group mb-4">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <input
                        ref={titleInputRef}
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={handleTitleKeyDown}
                        onBlur={handleTitleSave}
                        disabled={isSavingTitle}
                        className="text-4xl lg:text-5xl font-serif text-stone-900 bg-transparent border-b-2 border-stone-300 focus:border-stone-900 outline-none w-full"
                        placeholder="Gallery title"
                      />
                      {isSavingTitle && (
                        <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleTitleEdit}
                        className="flex items-center gap-3 text-left"
                      >
                        <h1 className="text-4xl lg:text-5xl font-serif text-stone-900">
                          {currentTitle}
                        </h1>
                        <Pencil className="w-5 h-5 text-stone-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      {titleSaveSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-sm text-stone-500 font-medium"
                        >
                          <Check className="w-4 h-4" />
                          Saved
                        </motion.span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="w-12 h-px bg-stone-300 mb-4" />
                
                <p className="text-stone-500 mb-8">
                  {formattedDate}
                </p>

                <p className="text-sm text-stone-400 mb-8">
                  {images.length} images in the gallery
                </p>

                {/* Quick Actions - Simplified */}
                <div className="space-y-6">
                  {/* Primary Action Row */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className={`flex-1 h-11 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                        copied 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                    <button 
                      onClick={() => setShowShareModal(true)}
                      className="h-11 w-11 flex items-center justify-center bg-white border border-stone-200 rounded-lg text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all"
                      title="Send to client"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center justify-between py-3 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      {isPublic ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center">
                          <EyeOff className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-stone-900">
                          {isPublic ? 'Public Gallery' : 'Private Gallery'}
                        </p>
                        <p className="text-xs text-stone-500">
                          {isPublic 
                            ? 'Anyone with the link can view' 
                            : 'Only you can see this gallery'
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleVisibilityToggle}
                      disabled={isTogglingVisibility}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        isPublic ? 'bg-emerald-500' : 'bg-stone-300'
                      } ${isTogglingVisibility ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          isPublic ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* PIN Protection Status (only show if public) */}
                  {isPublic && gallery.is_locked && (
                    <div className="flex items-center gap-2 py-2 px-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                      <Shield className="w-3.5 h-3.5" />
                      <span>PIN protected</span>
                    </div>
                  )}

                  {/* Downloads Status */}
                  <div className="flex items-center gap-3 text-xs text-stone-400 pt-2">
                    <span className={`inline-flex items-center gap-1.5 ${gallery.download_enabled ? '' : 'opacity-50'}`}>
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      {gallery.download_enabled ? 'Downloads enabled' : 'Downloads disabled'}
                    </span>
                  </div>

                  {/* Email Activity Toggle */}
                  <div className="pt-6 border-t border-stone-200 mt-6">
                    <button
                      onClick={() => setShowActivity(!showActivity)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-stone-500" />
                        <span className="text-sm font-medium text-stone-700">Email Activity</span>
                      </div>
                      {showActivity ? (
                        <ChevronUp className="w-4 h-4 text-stone-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-stone-400" />
                      )}
                    </button>
                    
                    <AnimatePresence>
                      {showActivity && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <EmailActivity galleryId={gallery.id} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      {images.length > 0 && (
        <div className="flex justify-center pb-8">
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown className="w-6 h-6 text-stone-300" />
          </motion.div>
        </div>
      )}

      {/* Image Grid Section */}
      <div className="bg-white border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Grid Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-medium text-stone-900">All Photos</h2>
              
              {/* Template Switcher - moved here near the gallery */}
              <div className="relative" ref={templateDropdownRef}>
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  disabled={isSavingTemplate}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  {isSavingTemplate ? (
                    <div className="w-4 h-4 border-2 border-stone-300 border-t-stone-600 animate-spin" />
                  ) : (
                    templateIcons[currentTemplate]
                  )}
                  <span className="hidden sm:inline">{GALLERY_TEMPLATES.find(t => t.id === currentTemplate)?.name || 'Layout'}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showTemplates ? 'rotate-180' : ''}`} />
                </button>
                

                <AnimatePresence>
                  {showTemplates && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-10 bg-white shadow-xl border border-stone-200 py-2 min-w-[220px] z-50"
                    >
                      <p className="px-4 py-2 text-xs text-stone-400 uppercase tracking-wider">Gallery Layout</p>
                      {GALLERY_TEMPLATES.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateChange(template.id)}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                            currentTemplate === template.id
                              ? 'bg-stone-100 text-stone-900'
                              : 'text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {templateIcons[template.id]}
                          <div className="flex-1">
                            <p className="font-medium">{template.name}</p>
                            <p className="text-xs text-stone-400">{template.description}</p>
                          </div>
                          {currentTemplate === template.id && (
                            <Check className="w-4 h-4 text-emerald-500" />
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2">
              {/* Reorder button */}
              <button
                onClick={() => {
                  setIsReordering(!isReordering)
                  setIsSelecting(false)
                }}
                className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  isReordering 
                    ? 'bg-stone-900 text-white' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <GripVertical className="w-4 h-4" />
                {isReordering ? 'Done' : 'Reorder'}
              </button>
              <button
                onClick={() => {
                  setIsSelecting(!isSelecting)
                  setIsReordering(false)
                }}
                className={`px-4 py-2 text-sm transition-colors ${
                  isSelecting 
                    ? 'bg-stone-900 text-white' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {isSelecting ? `${selectedImages.size} selected` : 'Select'}
              </button>
              <Link
                href={getPreviewUrl(currentTemplate)}
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 border border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-white text-sm font-medium transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
              <Link
                href={`/gallery/${gallery.id}/upload`}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Photos
              </Link>
            </div>
            
            {/* Mobile Actions - Simplified row */}
            <div className="flex sm:hidden items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2">
              <button
                onClick={() => {
                  setIsReordering(!isReordering)
                  setIsSelecting(false)
                }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isReordering 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                <GripVertical className="w-4 h-4" />
                {isReordering ? 'Done' : 'Reorder'}
              </button>
              <button
                onClick={() => {
                  setIsSelecting(!isSelecting)
                  setIsReordering(false)
                }}
                className={`flex-shrink-0 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isSelecting 
                    ? 'bg-stone-900 text-white' 
                    : 'bg-stone-100 text-stone-600'
                }`}
              >
                {isSelecting ? `${selectedImages.size}` : 'Select'}
              </button>
              <Link
                href={getPreviewUrl(currentTemplate)}
                target="_blank"
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-600 text-sm rounded-lg"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Link>
            </div>
          </div>

          {/* Image Grid - Sortable or Masonry based on mode */}
          {loadedImages.length > 0 ? (
            isReordering ? (
              /* Sortable Grid for reordering */
              <SortableImageGrid
                galleryId={gallery.id}
                images={loadedImages}
                isSelecting={false}
                selectedImages={new Set()}
                onSelect={() => {}}
                onImagesReorder={(newImages) => setLoadedImages(newImages)}
              />
            ) : (
              /* Masonry Grid for viewing */
              <div className="columns-2 md:columns-3 lg:columns-4 gap-2">
                {loadedImages.slice(0, visibleCount).map((image, index) => {
                  // First image is hero (larger)
                  const isHero = index === 0
                  
                  return (
                    <MasonryImageItem
                      key={image.id}
                      image={image}
                      index={index}
                      isHero={isHero}
                      isSelecting={isSelecting}
                      isSelected={selectedImages.has(image.id)}
                      onSelect={() => {
                        const newSelected = new Set(selectedImages)
                        if (newSelected.has(image.id)) {
                          newSelected.delete(image.id)
                        } else {
                          newSelected.add(image.id)
                        }
                        setSelectedImages(newSelected)
                      }}
                      onEditFocalPoint={() => setFocalPointImage(image)}
                    />
                  )
                })}
              </div>
            )
          ) : (
            <div className="text-center py-24">
              <div className="w-20 h-20 bg-stone-100 flex items-center justify-center mx-auto mb-6">
                <Plus className="w-8 h-8 text-stone-300" />
              </div>
              <h3 className="text-xl font-medium text-stone-900 mb-2">No photos yet</h3>
              <p className="text-stone-500 mb-8">Add photos to bring your gallery to life</p>
              <Link
                href={`/gallery/${gallery.id}/upload`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Photos
              </Link>
            </div>
          )}

          {/* Load More Button */}
          {loadedImages.length > visibleCount && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMoreImages}
                disabled={isLoadingMore}
                className="px-6 py-3 text-sm font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading...' : `Load more (${loadedImages.length - visibleCount} remaining)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Selection Actions Bar */}
      <AnimatePresence>
        {isSelecting && selectedImages.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-4 px-6 py-4 bg-stone-900 text-white rounded-2xl shadow-2xl">
              <span className="text-sm font-medium">{selectedImages.size} selected</span>
              <div className="w-px h-6 bg-white/20" />
              <button className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={() => {
                  setSelectedImages(new Set())
                  setIsSelecting(false)
                }}
                className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        galleryId={gallery.id}
        galleryTitle={currentTitle}
        shareUrl={shareUrl}
        currentTemplate={currentTemplate}
      />

      {/* Focal Point Editor */}
      {focalPointImage && (
        <FocalPointEditor
          isOpen={!!focalPointImage}
          onClose={() => setFocalPointImage(null)}
          image={{
            id: focalPointImage.id,
            url: focalPointImage.originalUrl || focalPointImage.previewUrl || focalPointImage.thumbnailUrl,
            focalX: focalPointImage.focalX,
            focalY: focalPointImage.focalY,
          }}
          onSave={(focalX, focalY) => {
            // Update the image in local state
            setLoadedImages(prev => 
              prev.map(img => 
                img.id === focalPointImage.id 
                  ? { ...img, focalX, focalY }
                  : img
              )
            )
          }}
        />
      )}

      {/* Presentation Settings Modal */}
      <AnimatePresence>
        {showPresentationSettings && (
          <PresentationSettings
            galleryId={gallery.id}
            galleryTitle={currentTitle}
            images={loadedImages.map(img => ({
              id: img.id,
              thumbnailUrl: img.thumbnailUrl,
              previewUrl: img.previewUrl,
            }))}
            initialData={gallery.presentation_data}
            onSave={() => router.refresh()}
            onClose={() => setShowPresentationSettings(false)}
            isModal
          />
        )}
      </AnimatePresence>

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-40 pb-safe">
        <div className="bg-white border-t border-stone-200 px-4 py-3 flex items-center justify-around gap-2 shadow-lg">
          <Link
            href="/dashboard/clients"
            className="flex-1 flex flex-col items-center gap-1 py-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium">Contracts</span>
          </Link>
          <Link
            href="/gallery/create"
            className="flex-1 flex flex-col items-center gap-1 py-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">New Album</span>
          </Link>
          <Link
            href={`/gallery/${gallery.id}/upload`}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium">Add Photos</span>
          </Link>
        </div>
      </div>

      {/* Bottom padding for mobile floating bar */}
      <div className="h-24 sm:hidden" />
    </div>
  )
}
