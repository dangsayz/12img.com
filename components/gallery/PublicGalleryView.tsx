'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, Share2, Check, Loader2, Camera, X, ArrowLeft } from 'lucide-react'
import { FullscreenViewer } from './FullscreenViewer'
import { setCoverImage } from '@/server/actions/gallery.actions'
import JSZip from 'jszip'

interface Image {
  id: string
  signedUrl: string
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

// Visual psychology-based image card - Simplified for fast loading
function GalleryImage({ 
  image, 
  index, 
  onClick,
  priority = false
}: { 
  image: Image
  index: number
  onClick: () => void
  priority?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [hasError, setHasError] = useState(false)
  
  const aspectRatio = image.width && image.height ? image.width / image.height : 1
  
  // Debug: log URL
  if (!image.signedUrl) {
    console.log('[GalleryImage] Missing signedUrl for image:', image.id)
  }
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration: 0.5, 
        delay: priority ? 0 : Math.min(index * 0.05, 0.2),
        ease: 'easeOut'
      }}
      className="group relative"
    >
      <div 
        className="relative overflow-hidden cursor-pointer rounded-sm bg-neutral-200"
        onClick={onClick}
        style={{ aspectRatio: aspectRatio || 1 }}
      >
        {hasError || !image.signedUrl ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-200">
            <span className="text-neutral-400 text-sm">Failed to load</span>
          </div>
        ) : (
          <img
            src={image.signedUrl}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setHasError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
          />
        )}
        
        {/* Subtle hover vignette */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>
    </motion.div>
  )
}

// Hero section image with parallax
function HeroImage({ 
  image, 
  title,
  isOwner,
  onChangeCover
}: { 
  image: Image
  title: string
  isOwner?: boolean
  onChangeCover?: () => void
}) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 1.1])
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Debug
  console.log('[HeroImage] URL:', image.signedUrl?.substring(0, 100) + '...')
  
  return (
    <section 
      className="relative h-[85vh] sm:h-screen overflow-hidden bg-neutral-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Parallax background - Show immediately */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        {image.signedUrl && !hasError ? (
          <img
            src={image.signedUrl}
            alt=""
            className="w-full h-full object-cover"
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

      {/* Change Cover Overlay - Only for owners */}
      {isOwner && (
        <AnimatePresence>
          {isHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onChangeCover}
              className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Change Cover
            </motion.button>
          )}
        </AnimatePresence>
      )}
      
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
          <div className="w-12 sm:w-16 h-px bg-white/40 mx-auto mb-4 sm:mb-6" />
          
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
                    src={image.signedUrl}
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
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [coverPickerOpen, setCoverPickerOpen] = useState(false)
  const [isUpdatingCover, setIsUpdatingCover] = useState(false)
  const [currentCoverId, setCurrentCoverId] = useState(coverImageId)

  const handleImageClick = useCallback((index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])

  const handleViewerClose = useCallback(() => {
    setViewerOpen(false)
  }, [])

  const handleViewerNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      setViewerIndex((current) => {
        if (direction === 'prev') {
          return current > 0 ? current - 1 : images.length - 1
        }
        return current < images.length - 1 ? current + 1 : 0
      })
    },
    [images.length]
  )

  // Download all images as ZIP (client-side)
  const handleDownloadAll = useCallback(async () => {
    if (isDownloading || images.length === 0) return
    
    setIsDownloading(true)
    
    try {
      const zip = new JSZip()
      
      // Download each image and add to ZIP
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        try {
          const response = await fetch(image.signedUrl)
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
  
  // Gallery images exclude the cover
  const galleryImages = useMemo(() => {
    const coverId = coverImage?.id
    return images.filter(img => img.id !== coverId)
  }, [images, coverImage])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      {coverImage && (
        <HeroImage 
          image={coverImage} 
          title={title} 
          isOwner={isOwner}
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
        {/* Section title - Clean and minimal */}
        <motion.div 
          className="text-center mb-10 sm:mb-14 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl text-neutral-800 font-medium tracking-tight mb-2">
            {title}
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm">
            Tap any image to view in full screen
          </p>
        </motion.div>

        {/* 
          Psychology-based Masonry Grid
          - Mobile: 1 column for immersive viewing
          - Tablet: 2 columns
          - Desktop: 3-4 columns
          - Respects natural image orientations
        */}
        <div className="columns-1 sm:columns-2 lg:columns-3 2xl:columns-4 gap-3 sm:gap-4 md:gap-6">
          {galleryImages.map((image, index) => (
            <div 
              key={image.id} 
              className="mb-3 sm:mb-4 md:mb-6 break-inside-avoid"
            >
              <GalleryImage
                image={image}
                index={index}
                onClick={() => handleImageClick(images.findIndex(img => img.id === image.id))}
                priority={index < 6}
              />
            </div>
          ))}
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

      {/* Fullscreen Viewer */}
      {viewerOpen && (
        <FullscreenViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={handleViewerClose}
          onNavigate={handleViewerNavigate}
          galleryTitle={title}
          gallerySlug={gallerySlug}
        />
      )}

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
