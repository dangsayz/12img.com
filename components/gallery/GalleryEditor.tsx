'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { updateGalleryTemplate, updateGallery, toggleGalleryVisibility, toggleGalleryDownloads, updateGalleryPassword, setCoverImage, deleteGallery, type GalleryVisibilityMode, type GalleryVisibilitySettings } from '@/server/actions/gallery.actions'
import { GalleryVisibilitySettings as GalleryVisibilitySettingsUI } from '@/components/gallery/GalleryVisibilitySettings'
import { 
  ArrowLeft,
  ArrowDownToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
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
  FileText,
  ArrowDown,
  ImageIcon,
  Star,
  Users,
  ChevronRight
} from 'lucide-react'
import { EmailActivity } from '@/components/gallery/EmailActivity'
import { ShareModal } from '@/components/gallery/ShareModal'
import { VendorShareModal } from '@/components/vendors/VendorShareModal'
import { SocialShareButtons } from '@/components/ui/SocialShareButtons'
import { PresentationSettings } from '@/components/gallery/PresentationSettings'
import { SortableImageGrid } from '@/components/gallery/SortableImageGrid'
import { type GalleryTemplate, GALLERY_TEMPLATES, DEFAULT_TEMPLATE } from '@/components/gallery/templates'
import type { PresentationData } from '@/lib/types/presentation'

interface GalleryImage {
  id: string
  storagePath?: string
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
  isCover,
  onSetCover,
  isSettingCover,
}: {
  image: GalleryImage
  index: number
  isHero: boolean
  isSelecting: boolean
  isSelected: boolean
  onSelect: () => void
  isCover: boolean
  onSetCover: () => void
  isSettingCover: boolean
}) {
  const [aspectRatio, setAspectRatio] = useState<number>(
    image.width && image.height ? image.width / image.height : 1
  )
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [currentUrl, setCurrentUrl] = useState(image.thumbnailUrl || image.previewUrl || image.originalUrl)
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false)
  
  // Auto-fetch URL if missing
  useEffect(() => {
    if (!currentUrl && image.storagePath && !isRetrying) {
      setIsRetrying(true)
      import('@/server/actions/image.actions').then(({ getThumbnailUrl }) => {
        getThumbnailUrl(image.storagePath!).then(result => {
          if (result.url) {
            setCurrentUrl(result.url)
          }
          setIsRetrying(false)
        }).catch(() => setIsRetrying(false))
      })
    }
  }, [currentUrl, image.storagePath, isRetrying])
  
  const imgSrc = currentUrl
  
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
    setHasError(false)
  }

  // Handle image load error with retry
  const handleImageError = async () => {
    if (isRetrying) return
    setHasError(true)
    
    // Try to get a fresh URL if we have the storage path
    if (image.storagePath) {
      setIsRetrying(true)
      try {
        const { getThumbnailUrl } = await import('@/server/actions/image.actions')
        const result = await getThumbnailUrl(image.storagePath)
        if (result.url) {
          setCurrentUrl(result.url)
          setHasError(false)
        }
      } catch {
        // Keep error state
      }
      setIsRetrying(false)
    }
  }

  // Format image number with leading zeros
  const imageNumber = String(index + 1).padStart(3, '0')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0.5 }}
      transition={{ duration: 0.3 }}
      className={`
        relative cursor-pointer group overflow-hidden bg-stone-100
        ${isSelecting && isSelected ? 'ring-2 ring-stone-900' : ''}
      `}
      style={{ aspectRatio }}
      onClick={() => {
        if (isSelecting) {
          onSelect()
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {imgSrc ? (
        <motion.div
          className="absolute inset-0"
          animate={{ scale: isHovered && !isSelecting ? 1.02 : 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src={imgSrc}
            alt=""
            fill
            className={`object-cover ${hasError ? 'opacity-0' : ''}`}
            style={{ objectPosition: `${focalX}% ${focalY}%` }}
            sizes={isHero ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
            loading={index < 6 ? "eager" : "lazy"}
            onLoad={handleImageLoad}
            onError={handleImageError}
            unoptimized
          />
          {/* Error state overlay */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100">
              {isRetrying ? (
                <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-6 h-6 text-stone-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-[10px] text-stone-400">Loading...</span>
                </>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100">
          <div className="w-5 h-5 border-2 border-stone-300 border-t-stone-500 rounded-full animate-spin mb-2" />
          <span className="text-[10px] text-stone-400">Loading image...</span>
        </div>
      )}
      
      {/* Subtle gradient overlay on hover - editorial style */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered && !isSelecting ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Image number - appears on hover, bottom left */}
      {!isSelecting && (
        <motion.div
          className="absolute bottom-3 left-3 pointer-events-none"
          initial={{ opacity: 0, y: 4 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            y: isHovered ? 0 : 4
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <span className="text-[10px] font-mono text-white/80 tracking-[0.15em]">
            {imageNumber}
          </span>
        </motion.div>
      )}
      
      {/* Focal point indicator (shows if custom focal point is set) */}
      {hasFocalPoint && !isSelecting && (
        <motion.div 
          className="absolute w-2.5 h-2.5 rounded-full bg-white/90 shadow-sm pointer-events-none"
          style={{ 
            left: `${focalX}%`, 
            top: `${focalY}%`,
            transform: 'translate(-50%, -50%)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
          transition={{ duration: 0.2 }}
        />
      )}
      
      {/* Cover image badge - always visible when this is the cover */}
      {isCover && !isSelecting && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2.5 left-2.5 px-2 py-1 bg-stone-900 text-white text-[9px] tracking-[0.15em] uppercase font-medium flex items-center gap-1.5 shadow-sm"
        >
          <Star className="w-2.5 h-2.5 fill-current" />
          Cover
        </motion.div>
      )}
      
      {/* Selection checkbox */}
      {isSelecting && (
        <motion.div 
          className={`absolute top-2.5 left-2.5 w-5 h-5 border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'bg-stone-900 border-stone-900'
              : 'bg-white/90 border-stone-300'
          }`}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isSelected && (
            <Check className="w-3 h-3 text-white" />
          )}
        </motion.div>
      )}

      {/* Hover actions - refined positioning and animation */}
      {!isSelecting && (
        <motion.div 
          className="absolute top-2.5 right-2.5 flex flex-col gap-1.5"
          initial={{ opacity: 0, x: 4 }}
          animate={{ 
            opacity: isHovered ? 1 : 0,
            x: isHovered ? 0 : 4
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Set as Cover button - only show if not already cover */}
          {!isCover && (
            <motion.button 
              onClick={(e) => {
                e.stopPropagation()
                onSetCover()
              }}
              disabled={isSettingCover}
              className={`w-7 h-7 bg-white/95 backdrop-blur-sm flex items-center justify-center transition-colors shadow-sm ${
                isSettingCover ? 'opacity-50' : 'hover:bg-amber-50'
              }`}
              title="Set as cover image"
              whileHover={{ scale: isSettingCover ? 1 : 1.05 }}
              whileTap={{ scale: isSettingCover ? 1 : 0.95 }}
            >
              {isSettingCover ? (
                <div className="w-3 h-3 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Star className="w-3.5 h-3.5 text-amber-500" />
              )}
            </motion.button>
          )}
          {/* Add to Portfolio button */}
          <motion.button
            onClick={async (e) => {
              e.stopPropagation()
              if (isAddingToPortfolio) return
              setIsAddingToPortfolio(true)
              try {
                const { addToPortfolio } = await import('@/server/actions/profile.actions')
                const result = await addToPortfolio(image.id)
                if (result?.error) {
                  console.log('Portfolio:', result.error)
                }
              } catch (err) {
                console.error('Failed to add to portfolio', err)
                alert('Failed to add image to portfolio. Please try again.')
              } finally {
                setIsAddingToPortfolio(false)
              }
            }}
            disabled={isAddingToPortfolio}
            className="w-7 h-7 bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-stone-50 transition-colors shadow-sm disabled:opacity-50"
            title="Add to portfolio"
            whileHover={{ scale: isAddingToPortfolio ? 1 : 1.05 }}
            whileTap={{ scale: isAddingToPortfolio ? 1 : 0.95 }}
          >
            {isAddingToPortfolio ? (
              <div className="w-3 h-3 border-2 border-stone-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <BookOpen className="w-3.5 h-3.5 text-stone-600" />
            )}
          </motion.button>
          {/* Download button */}
          <motion.button 
            onClick={(e) => {
              e.stopPropagation()
              // Open download in new tab (works on mobile too)
              window.open(`/api/image/${image.id}/download`, '_blank')
            }}
            className="w-7 h-7 bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-emerald-50 transition-colors shadow-sm"
            title="Download photo"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
          </motion.button>
          <motion.button 
            className="w-7 h-7 bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </motion.button>
        </motion.div>
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
  cover_image_id?: string | null
  // New visibility fields
  visibility_mode?: GalleryVisibilityMode
  show_on_profile?: boolean
  respect_profile_visibility?: boolean
  inherit_profile_pin?: boolean
}

interface GalleryEditorProps {
  gallery: GalleryData
  images: GalleryImage[]
  photographerName?: string
  totalFileSizeBytes: number
  profileSlug?: string
}

export function GalleryEditor({ 
  gallery, 
  images, 
  photographerName,
  totalFileSizeBytes,
  profileSlug
}: GalleryEditorProps) {
  const router = useRouter()
  const templateDropdownRef = useRef<HTMLDivElement>(null)
  
  const [copied, setCopied] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
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
  const [showVendorShareModal, setShowVendorShareModal] = useState(false)
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
  const [downloadsEnabled, setDownloadsEnabled] = useState(gallery.download_enabled)
  const [isTogglingDownloads, setIsTogglingDownloads] = useState(false)
  const [isLocked, setIsLocked] = useState(gallery.is_locked)
  const [currentPassword, setCurrentPassword] = useState<string | null>(
    (gallery as { password_plain?: string | null }).password_plain ?? null
  )
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [coverImageId, setCoverImageId] = useState<string | null>(gallery.cover_image_id || null)
  const [settingCoverImageId, setSettingCoverImageId] = useState<string | null>(null)

  useEffect(() => {
    setShareUrl(`${window.location.origin}/view-reel/${gallery.id}`)
  }, [gallery.id])

  // Handle setting cover image
  const handleSetCover = async (imageId: string) => {
    setSettingCoverImageId(imageId)
    try {
      const result = await setCoverImage(gallery.id, imageId)
      if (result.success) {
        setCoverImageId(imageId)
        router.refresh()
      } else {
        console.error('Failed to set cover:', result.error)
      }
    } catch (error) {
      console.error('Failed to set cover:', error)
    } finally {
      setSettingCoverImageId(null)
    }
  }

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

  // Handle downloads toggle
  const handleDownloadsToggle = async () => {
    const newValue = !downloadsEnabled
    setIsTogglingDownloads(true)
    setDownloadsEnabled(newValue) // Optimistic update
    
    try {
      const result = await toggleGalleryDownloads(gallery.id, newValue)
      if (result.error) {
        setDownloadsEnabled(!newValue)
        console.error('Failed to toggle downloads:', result.error)
      } else {
        router.refresh()
      }
    } catch (error) {
      setDownloadsEnabled(!newValue)
      console.error('Failed to toggle downloads:', error)
    } finally {
      setIsTogglingDownloads(false)
    }
  }

  // Handle password update
  const handlePasswordSave = async () => {
    setIsSavingPassword(true)
    try {
      const result = await updateGalleryPassword(gallery.id, newPassword || null)
      if (result.error) {
        console.error('Failed to update password:', result.error)
      } else {
        setIsLocked(result.isLocked ?? false)
        setCurrentPassword(newPassword || null) // Store for display
        setShowPasswordModal(false)
        setNewPassword('')
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to update password:', error)
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Handle password removal
  const handleRemovePassword = async () => {
    setIsSavingPassword(true)
    try {
      const result = await updateGalleryPassword(gallery.id, null)
      if (result.error) {
        console.error('Failed to remove password:', result.error)
      } else {
        setIsLocked(false)
        setCurrentPassword(null)
        setShowPasswordModal(false)
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to remove password:', error)
    } finally {
      setIsSavingPassword(false)
    }
  }

  // Handle gallery deletion
  const handleDeleteGallery = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteGallery(gallery.id)
      if (result.error) {
        console.error('Failed to delete gallery:', result.error)
        alert('Failed to delete album. Please try again.')
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Failed to delete gallery:', error)
      alert('Failed to delete album. Please try again.')
    } finally {
      setIsDeleting(false)
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
    'album': <ImageIcon className="w-4 h-4" />,
  }

  const getPreviewUrl = (template: GalleryTemplate) => {
    switch (template) {
      case 'editorial': return `/view-live/${gallery.slug}`
      case 'cinematic': return `/view-reel/${gallery.slug}`
      default: return `/view-reel/${gallery.slug}`
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

  // Get cover image - use explicit cover_image_id if set, otherwise first image
  const getCoverImage = () => {
    if (coverImageId) {
      const explicitCover = images.find(img => img.id === coverImageId)
      if (explicitCover && explicitCover.previewUrl) {
        return explicitCover
      }
    }
    // Fall back to first image with a valid preview URL
    const firstWithUrl = images.find(img => img.previewUrl)
    return firstWithUrl || images[0] || null
  }
  const coverImage = getCoverImage()

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
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Back</span>
                </Link>
                
                {profileSlug && (
                  <Link
                    href={`/profile/${profileSlug}`}
                    className="flex items-center gap-1.5 text-stone-400 hover:text-stone-700 transition-colors"
                    title="View Public Profile"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-xs">Profile</span>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPresentationSettings(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-stone-900 text-white hover:bg-stone-800 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Customize
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Album
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
              {coverImage && coverImage.previewUrl ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative aspect-[4/5] bg-white shadow-2xl shadow-stone-900/10 group"
                >
                  <Image
                    src={coverImage.previewUrl}
                    alt={gallery.title}
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                  {/* Social share on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <SocialShareButtons
                      imageUrl={coverImage.originalUrl || coverImage.previewUrl}
                      pageUrl={shareUrl}
                      description={`${gallery.title} | 12img`}
                      size="md"
                    />
                  </div>
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
                    <button 
                      onClick={() => setShowVendorShareModal(true)}
                      className="h-11 w-11 flex items-center justify-center bg-white border border-stone-200 rounded-lg text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all"
                      title="Share with vendors"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Visibility Settings */}
                  <div className="py-3 border-b border-stone-100">
                    <GalleryVisibilitySettingsUI
                      galleryId={gallery.id}
                      initialSettings={{
                        visibilityMode: gallery.visibility_mode || (gallery.is_public ? 'public' : 'private'),
                        showOnProfile: gallery.show_on_profile ?? true,
                        respectProfileVisibility: gallery.respect_profile_visibility ?? false,
                        inheritProfilePin: gallery.inherit_profile_pin ?? true,
                      }}
                      onUpdate={() => router.refresh()}
                    />
                  </div>

                  {/* Downloads Toggle */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      <ArrowDownToLine className={`w-4 h-4 ${downloadsEnabled ? 'text-blue-500' : 'text-stone-400'}`} />
                      <div>
                        <p className="text-sm font-medium text-stone-700">Downloads</p>
                        <p className="text-xs text-stone-400">
                          {downloadsEnabled ? 'Clients can download' : 'Disabled'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadsToggle}
                      disabled={isTogglingDownloads}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        downloadsEnabled ? 'bg-blue-500' : 'bg-stone-300'
                      } ${isTogglingDownloads ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                          downloadsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* PIN Protection */}
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2.5">
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-stone-600" />
                      ) : (
                        <Unlock className="w-4 h-4 text-stone-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-stone-700">PIN</p>
                        {isLocked && currentPassword ? (
                          <p className="text-xs text-stone-500 font-mono tracking-wider">{currentPassword}</p>
                        ) : (
                          <p className="text-xs text-stone-400">4-digit code</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPasswordModal(true)}
                      className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
                    >
                      {isLocked ? 'Change' : 'Set'}
                    </button>
                  </div>

                  {/* Share with Vendors */}
                  <div className="py-2">
                    <button
                      onClick={() => setShowVendorShareModal(true)}
                      className="w-full flex items-center gap-2.5 py-2 hover:bg-stone-50 rounded-lg px-1 -mx-1 transition-colors group"
                    >
                      <Users className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-stone-700">Share with Vendors</p>
                        <p className="text-xs text-stone-400">Florists, planners & venues</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                    </button>
                  </div>

                  {/* Email Activity Toggle */}
                  <div className="pt-2 border-t border-stone-100 mt-2">
                    <button
                      onClick={() => setShowActivity(!showActivity)}
                      className="flex items-center gap-1.5 py-1 text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span className="text-xs">Email Activity</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${showActivity ? 'rotate-180' : ''}`} />
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
              /* CSS Columns masonry - true Tetris-style packing */
              <div 
                className="columns-2 md:columns-3 lg:columns-4 gap-2"
              >
                {loadedImages.slice(0, visibleCount).map((image, index) => {
                  const isHero = index === 0
                  
                  return (
                    <div key={image.id} className="mb-2 break-inside-avoid">
                      <MasonryImageItem
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
                        isCover={coverImageId === image.id}
                        onSetCover={() => handleSetCover(image.id)}
                        isSettingCover={settingCoverImageId === image.id}
                      />
                    </div>
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

          {/* Load More - Editorial Style */}
          {loadedImages.length > visibleCount && (
            <motion.div 
              className="mt-16 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {/* Decorative line */}
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-stone-200 to-stone-300" />
              
              <motion.button
                onClick={loadMoreImages}
                disabled={isLoadingMore}
                className="group relative py-6 px-8 disabled:opacity-50"
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-4 h-4 border border-stone-300 border-t-stone-600 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <span className="text-xs tracking-[0.2em] uppercase text-stone-400">
                      Loading
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] tracking-[0.3em] uppercase text-stone-400 group-hover:text-stone-600 transition-colors">
                      Continue
                    </span>
                    <span className="text-xs font-light text-stone-500 group-hover:text-stone-700 transition-colors">
                      {loadedImages.length - visibleCount} more
                    </span>
                    <motion.div
                      className="mt-1"
                      animate={{ y: [0, 3, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <ChevronDown className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
                    </motion.div>
                  </div>
                )}
              </motion.button>
              
              {/* Bottom decorative line */}
              <div className="w-px h-8 bg-gradient-to-b from-stone-300 to-transparent" />
            </motion.div>
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
        gallerySlug={gallery.slug}
        galleryTitle={currentTitle}
        shareUrl={shareUrl}
        currentTemplate={currentTemplate}
      />

      {/* Vendor Share Modal */}
      <VendorShareModal
        isOpen={showVendorShareModal}
        onClose={() => setShowVendorShareModal(false)}
        galleryId={gallery.id}
        galleryTitle={currentTitle}
      />

      {/* PIN Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">
                    {isLocked ? 'Update PIN' : 'Set PIN'}
                  </h3>
                  <p className="text-xs text-stone-500">4-digit code to protect this gallery</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2 block">
                    4-Digit PIN
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={newPassword}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 4)
                      setNewPassword(value)
                    }}
                    placeholder="0000"
                    className="w-full px-4 py-4 rounded-xl border border-stone-200 focus:border-stone-900 focus:ring-0 text-center font-mono text-2xl tracking-[0.5em]"
                    autoFocus
                  />
                  <p className="text-xs text-stone-400 mt-2 text-center">
                    This PIN will be included when you email the gallery
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  {isLocked && (
                    <button
                      onClick={handleRemovePassword}
                      disabled={isSavingPassword}
                      className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={handlePasswordSave}
                    disabled={isSavingPassword || newPassword.length !== 4}
                    className="flex-1 py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
                  >
                    {isSavingPassword ? 'Saving...' : 'Save'}
                  </button>
                </div>

                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full py-2 text-xs text-stone-400 hover:text-stone-600"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Delete Confirmation Modal - Portal to body to escape transform context */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-stone-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-900">Remove Album</h3>
              </div>
              <p className="text-stone-600 mb-6">
                Are you sure you want to remove <strong>{currentTitle}</strong>? This action cannot be undone and all images will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteGallery}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Removing...' : 'Yes, Remove Album'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

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
