'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, Share2, Check, Loader2, Camera, X, ArrowLeft, PlayCircle } from 'lucide-react'
import { setCoverImage } from '@/server/actions/gallery.actions'
import JSZip from 'jszip'

interface Image {
  id: string
  thumbnailUrl: string  // 400px for grid display
  previewUrl: string    // 1920px for fullscreen viewing
  originalUrl: string   // Full resolution for downloads only
  width?: number | null
  height?: number | null
}

interface PublicGalleryViewProps {
  title: string
  images: Image[]
  downloadEnabled?: boolean
  photographerName?: string
  isOwner?: boolean
  galleryId?: string
  gallerySlug?: string
  coverImageId?: string | null
}

// Determine image orientation
type Orientation = 'landscape' | 'portrait' | 'square'

function getOrientation(width?: number | null, height?: number | null): Orientation {
  if (!width || !height) return 'square'
  const ratio = width / height
  if (ratio > 1.2) return 'landscape'
  if (ratio < 0.8) return 'portrait'
  return 'square'
}

// Editorial image component - artsy display only, no click to enlarge
function EditorialImage({ 
  image, 
  index, 
  aspectRatio = '3/4',
  priority = false,
  className = ''
}: { 
  image: Image
  index: number
  aspectRatio?: string
  priority?: boolean
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [hasError, setHasError] = useState(false)
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ 
        duration: 0.8, 
        delay: priority ? 0 : Math.min(index * 0.08, 0.3),
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`relative overflow-hidden ${className}`}
    >
      <div 
        className="relative overflow-hidden bg-neutral-100"
        style={{ aspectRatio }}
      >
        {hasError || !image.thumbnailUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <span className="text-neutral-300 text-sm">Image unavailable</span>
          </div>
        ) : (
          <>
            <img
              src={image.previewUrl || image.thumbnailUrl}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              onError={() => setHasError(true)}
              className="w-full h-full object-cover object-center"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
            {/* Subtle film grain overlay for artsy feel */}
            <div 
              className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                backgroundSize: '100px 100px',
              }}
            />
          </>
        )}
      </div>
    </motion.div>
  )
}

// Editorial row layouts for magazine-style presentation
function EditorialRow({ 
  images, 
  startIndex,
  layout 
}: { 
  images: Image[]
  startIndex: number
  layout: 'full' | 'split' | 'trio' | 'asymmetric' | 'stagger'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  
  if (layout === 'full' && images[0]) {
    // Full-width cinematic image
    return (
      <motion.div 
        ref={ref}
        className="mb-4 sm:mb-6 md:mb-8"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      >
        <EditorialImage 
          image={images[0]} 
          index={startIndex} 
          aspectRatio="16/9"
          priority={startIndex < 3}
          className="rounded-sm sm:rounded-md"
        />
      </motion.div>
    )
  }
  
  if (layout === 'split' && images.length >= 2) {
    // Two images side by side
    return (
      <div ref={ref} className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <EditorialImage 
          image={images[0]} 
          index={startIndex} 
          aspectRatio="3/4"
          priority={startIndex < 4}
          className="rounded-sm sm:rounded-md"
        />
        <EditorialImage 
          image={images[1]} 
          index={startIndex + 1} 
          aspectRatio="3/4"
          priority={startIndex < 4}
          className="rounded-sm sm:rounded-md"
        />
      </div>
    )
  }
  
  if (layout === 'trio' && images.length >= 3) {
    // Three images in a row
    return (
      <div ref={ref} className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
        {images.slice(0, 3).map((img, i) => (
          <EditorialImage 
            key={img.id}
            image={img} 
            index={startIndex + i} 
            aspectRatio="4/5"
            className="rounded-sm sm:rounded-md"
          />
        ))}
      </div>
    )
  }
  
  if (layout === 'asymmetric' && images.length >= 2) {
    // One large, one small stacked vertically
    return (
      <div ref={ref} className="grid grid-cols-5 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="col-span-3">
          <EditorialImage 
            image={images[0]} 
            index={startIndex} 
            aspectRatio="4/5"
            className="rounded-sm sm:rounded-md"
          />
        </div>
        <div className="col-span-2 flex flex-col gap-3 sm:gap-4 md:gap-6">
          <EditorialImage 
            image={images[1]} 
            index={startIndex + 1} 
            aspectRatio="1/1"
            className="rounded-sm sm:rounded-md"
          />
          {images[2] && (
            <EditorialImage 
              image={images[2]} 
              index={startIndex + 2} 
              aspectRatio="1/1"
              className="rounded-sm sm:rounded-md"
            />
          )}
        </div>
      </div>
    )
  }
  
  if (layout === 'stagger' && images.length >= 2) {
    // Staggered two-column with offset
    return (
      <div ref={ref} className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
        <div className="pt-0 sm:pt-8 md:pt-12">
          <EditorialImage 
            image={images[0]} 
            index={startIndex} 
            aspectRatio="3/4"
            className="rounded-sm sm:rounded-md"
          />
        </div>
        <div>
          <EditorialImage 
            image={images[1]} 
            index={startIndex + 1} 
            aspectRatio="3/4"
            className="rounded-sm sm:rounded-md"
          />
        </div>
      </div>
    )
  }
  
  // Fallback: single image
  if (images[0]) {
    return (
      <div ref={ref} className="mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
        <EditorialImage 
          image={images[0]} 
          index={startIndex} 
          aspectRatio="3/4"
          className="rounded-sm sm:rounded-md"
        />
      </div>
    )
  }
  
  return null
}

// Hero section image with parallax
function HeroImage({ 
  image, 
  title,
  isOwner,
  gallerySlug,
  galleryId,
  onChangeCover
}: { 
  image: Image
  title: string
  isOwner?: boolean
  gallerySlug?: string
  galleryId?: string
  onChangeCover?: () => void
}) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 1.05])
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  
  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }
  
  // Debug
  console.log('[HeroImage] URL:', image.thumbnailUrl?.substring(0, 100) + '...')
  
  return (
    <section 
      className="relative h-[55vh] sm:h-[65vh] overflow-hidden bg-neutral-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Parallax background - Show immediately */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        {image.thumbnailUrl && !hasError ? (
          <img
            src={image.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            onError={() => {
              console.error('[HeroImage] Failed to load image')
              setHasError(true)
            }}
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
            <span className="text-neutral-500">Image unavailable</span>
          </div>
        )}
        {/* Film grain overlay - masks pixelation on upscaled images */}
        <div 
          className="absolute inset-0 opacity-[0.15] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '150px 150px',
          }}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />
      </motion.div>

      {/* Top Actions Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 sm:p-6 flex items-center justify-between">
        {/* Share Button - Always visible */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-colors"
        >
          {showCopied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="hidden sm:inline">Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Gallery</span>
            </>
          )}
        </button>

        {/* Change Cover - Only for owners */}
        {isOwner && (
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onChangeCover}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-colors cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Change Cover
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
      
      {/* Content */}
      <motion.div 
        className="relative z-10 h-full flex flex-col items-center justify-end pb-16 sm:pb-24 px-4 sm:px-6"
        style={{ opacity }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl"
        >
          {/* Gallery title - Premium serif typography */}
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white font-light tracking-tight leading-tight sm:leading-none mb-4 sm:mb-6">
            {title}
          </h1>
          
          {/* Elegant divider */}
          <div className="w-12 sm:w-16 h-px bg-white/40 mx-auto mb-6" />
          
          {/* Scroll prompt */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-white/60"
          >
            <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 mx-auto" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

// Cover Photo Picker Modal
function CoverPickerModal({
  images,
  currentCoverId,
  onSelect,
  onClose,
  isUpdating
}: {
  images: Image[]
  currentCoverId?: string | null
  onSelect: (imageId: string) => void
  onClose: () => void
  isUpdating: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Choose Cover Photo</h2>
            <p className="text-sm text-neutral-500">Select an image to use as your gallery cover</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Image Grid */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((image) => {
              const isCurrentCover = image.id === currentCoverId || (!currentCoverId && images[0]?.id === image.id)
              return (
                <button
                  key={image.id}
                  onClick={() => onSelect(image.id)}
                  disabled={isUpdating}
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden group transition-all ${
                    isCurrentCover 
                      ? 'ring-2 ring-offset-2 ring-neutral-900' 
                      : 'hover:ring-2 hover:ring-offset-2 hover:ring-neutral-300'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <img
                    src={image.thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  {isCurrentCover && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="bg-white text-neutral-900 text-xs font-medium px-2 py-1 rounded-full">
                        Current Cover
                      </div>
                    </div>
                  )}
                  {!isCurrentCover && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Set as Cover
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function PublicGalleryView({ 
  title, 
  images, 
  downloadEnabled = false,
  photographerName,
  isOwner = false,
  galleryId,
  gallerySlug,
  coverImageId
}: PublicGalleryViewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [isUpdatingCover, setIsUpdatingCover] = useState(false)
  const [currentCoverId, setCurrentCoverId] = useState(coverImageId)

  // Download all images as ZIP (client-side)
  const handleDownloadAll = useCallback(async () => {
    if (isDownloading || images.length === 0) return
    
    setIsDownloading(true)
    
    try {
      const zip = new JSZip()
      
      // Download each image and add to ZIP
      // Use originalUrl for full-resolution downloads
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        try {
          const response = await fetch(image.originalUrl)
          if (!response.ok) continue
          
          const blob = await response.blob()
          const filename = `${String(i + 1).padStart(3, '0')}_image.jpg`
          zip.file(filename, blob)
        } catch (err) {
          console.error(`Failed to fetch image ${i + 1}:`, err)
        }
      }
      
      // Generate ZIP and download
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_')}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }, [images, title, isDownloading])

  // Share/copy link
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }, [])

  // Organize images by orientation for psychology-based layout
  const organizedImages = useMemo(() => {
    return images.map((img, idx) => ({
      ...img,
      orientation: getOrientation(img.width, img.height),
      originalIndex: idx,
    }))
  }, [images])

  // Handle cover image selection
  const handleSelectCover = useCallback(async (imageId: string) => {
    if (!galleryId || isUpdatingCover) return
    
    setIsUpdatingCover(true)
    try {
      const result = await setCoverImage(galleryId, imageId)
      if (result.success) {
        setCurrentCoverId(imageId)
        setCoverPickerOpen(false)
        // Refresh the page to show new cover
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to set cover:', error)
    } finally {
      setIsUpdatingCover(false)
    }
  }, [galleryId, isUpdatingCover])

  // Get cover image - use selected cover or first image
  const coverImage = useMemo(() => {
    if (currentCoverId) {
      const cover = images.find(img => img.id === currentCoverId)
      if (cover) return cover
    }
    return images[0]
  }, [images, currentCoverId])
  
  // Gallery images - all except cover (shown in hero)
  const galleryImages = images.filter(img => img.id !== currentCoverId)
  
  // Generate editorial layout pattern based on image count
  const editorialLayout = useMemo(() => {
    const layouts: { layout: 'full' | 'split' | 'trio' | 'asymmetric' | 'stagger', count: number }[] = []
    const imgs = galleryImages
    let remaining = imgs.length
    let index = 0
    
    // Start with a statement piece if we have enough images
    if (remaining >= 5) {
      layouts.push({ layout: 'full', count: 1 })
      remaining -= 1
      index += 1
    }
    
    // Alternate through patterns for visual variety
    const patterns: ('split' | 'trio' | 'asymmetric' | 'stagger' | 'full')[] = [
      'split', 'trio', 'asymmetric', 'stagger', 'full', 'split', 'trio'
    ]
    let patternIndex = 0
    
    while (remaining > 0) {
      const pattern = patterns[patternIndex % patterns.length]
      
      if (pattern === 'full' && remaining >= 1) {
        layouts.push({ layout: 'full', count: 1 })
        remaining -= 1
      } else if (pattern === 'split' && remaining >= 2) {
        layouts.push({ layout: 'split', count: 2 })
        remaining -= 2
      } else if (pattern === 'trio' && remaining >= 3) {
        layouts.push({ layout: 'trio', count: 3 })
        remaining -= 3
      } else if (pattern === 'asymmetric' && remaining >= 2) {
        const count = remaining >= 3 ? 3 : 2
        layouts.push({ layout: 'asymmetric', count })
        remaining -= count
      } else if (pattern === 'stagger' && remaining >= 2) {
        layouts.push({ layout: 'stagger', count: 2 })
        remaining -= 2
      } else if (remaining === 1) {
        layouts.push({ layout: 'full', count: 1 })
        remaining -= 1
      } else {
        // Fallback to split for 2 remaining
        layouts.push({ layout: 'split', count: Math.min(2, remaining) })
        remaining -= Math.min(2, remaining)
      }
      
      patternIndex++
    }
    
    return layouts
  }, [galleryImages])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      {coverImage && (
        <HeroImage 
          image={coverImage} 
          title={title} 
          isOwner={isOwner}
          gallerySlug={gallerySlug}
          galleryId={galleryId}
          onChangeCover={() => setCoverPickerOpen(true)}
        />
      )}

      {/* Minimal sticky header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-4 flex items-center justify-between">
          {/* Left: Breadcrumb + Image count */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <a 
              href="https://12img.com" 
              className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">12img</span>
            </a>
            <span className="text-neutral-200">|</span>
            <span className="text-sm text-neutral-500">{images.length} images</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Watch Reel Button */}
            <Link 
              href={`/view-reel/${galleryId}`}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Watch</span>
            </Link>

            {/* Share button */}
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <AnimatePresence mode="wait">
                {showCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-600" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="hidden sm:inline">{showCopied ? 'Copied!' : 'Share'}</span>
            </button>

            {/* Download button */}
            {downloadEnabled && (
              <button 
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-70 rounded-full transition-colors"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">Preparing...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Download All</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Gallery Section - Psychology-based layout */}
      <section className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-16 md:py-24">
        {/* Section intro - Editorial style */}
        <motion.div 
          className="text-center mb-12 sm:mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-neutral-400 text-xs sm:text-sm uppercase tracking-[0.2em] mb-3">
            The Collection
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-neutral-800 font-light tracking-tight">
            {galleryImages.length} Moments Captured
          </h2>
          {downloadEnabled && (
            <p className="text-neutral-400 text-xs sm:text-sm mt-4">
              Download all images using the button above
            </p>
          )}
        </motion.div>

        {/* Editorial Layout - Magazine-style varied compositions */}
        <div className="max-w-6xl mx-auto">
          {(() => {
            let imageIndex = 0
            return editorialLayout.map((row, rowIndex) => {
              const rowImages = galleryImages.slice(imageIndex, imageIndex + row.count)
              const startIdx = imageIndex
              imageIndex += row.count
              return (
                <EditorialRow
                  key={rowIndex}
                  images={rowImages}
                  startIndex={startIdx}
                  layout={row.layout}
                />
              )
            })
          })()}
        </div>
      </section>

      {/* Elegant footer */}
      <footer className="border-t border-neutral-100 bg-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
            <a 
              href="https://12img.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-900 flex items-center justify-center">
                <span className="text-[10px] sm:text-xs font-bold text-white">12</span>
              </div>
              <span className="text-xs sm:text-sm text-neutral-500">Crafted with 12img</span>
            </a>
            
            {photographerName && (
              <p className="text-xs sm:text-sm text-neutral-400 text-center">
                Photography by <span className="text-neutral-600">{photographerName}</span>
              </p>
            )}
            
            <p className="text-xs sm:text-sm text-neutral-400">
              © {new Date().getFullYear()} All rights reserved
            </p>
          </div>
        </div>
      </footer>

      {/* Cover Picker Modal */}
      <AnimatePresence>
        {coverPickerOpen && (
          <CoverPickerModal
            images={images}
            currentCoverId={currentCoverId}
            onSelect={handleSelectCover}
            onClose={() => setCoverPickerOpen(false)}
            isUpdating={isUpdatingCover}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
