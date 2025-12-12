/**
 * ============================================================================
 * PUBLIC GALLERY VIEW - Performance Optimized for Large Galleries
 * ============================================================================
 * 
 * This component renders public-facing gallery pages with 100s-1000s of images.
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * 
 * 1. NO PER-ITEM FRAMER MOTION
 *    - Previous: motion.div with whileInView on each image = 670 intersection observers
 *    - Current: Pure CSS transitions = 0 intersection observers
 *    - Impact: Massive reduction in JS overhead and memory usage
 * 
 * 2. SKELETON LOADING STATES
 *    - Shows animated placeholder while image loads
 *    - Prevents layout shift (CLS = 0)
 *    - Uses CSS animate-pulse (GPU accelerated)
 * 
 * 3. SMART PRIORITY HINTS
 *    - First 4-6 images: priority={true} (preload in <head>)
 *    - First 8-12 images: loading="eager" (load immediately)
 *    - Rest: loading="lazy" (native browser lazy loading)
 * 
 * 4. RESPONSIVE IMAGE SIZES
 *    - Grid: thumbnailUrl (600px) - fast loading
 *    - Lightbox: previewUrl (1920px) - crisp viewing
 *    - Download: originalUrl - full resolution
 * 
 * TEMPLATES:
 * - 'mosaic': Pic-Time style varied grid (featured rows, duos, quads)
 * - 'clean-grid': Uniform 3-column grid
 * 
 * @see lib/storage/signed-urls.ts for image URL generation
 * @see lib/utils/constants.ts for IMAGE_SIZES configuration
 * ============================================================================
 */

'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, Share2, Check, Loader2, Heart, X, ArrowLeft } from 'lucide-react'
// Note: Heart used in FullscreenViewer, X used for close button
import Link from 'next/link'
import { SocialShareButtons, SocialShareButtonsDark } from '@/components/ui/SocialShareButtons'
import { ImageDownloadButton, ImageDownloadButtonDark } from '@/components/ui/ImageDownloadButton'
import { getSeoAltText } from '@/lib/seo/image-urls'
import type { PresentationData } from '@/lib/types/presentation'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
}

interface PublicGalleryViewProps {
  title: string
  images: GalleryImage[]
  downloadEnabled?: boolean
  photographerName?: string
  eventDate?: string
  galleryId?: string
  gallerySlug?: string
  template?: 'mosaic' | 'clean-grid'
  presentation?: PresentationData | null
}

// Get aspect ratio category
function getAspectCategory(img: GalleryImage): 'portrait' | 'landscape' | 'square' {
  if (!img.width || !img.height) return 'square'
  const ratio = img.width / img.height
  if (ratio > 1.2) return 'landscape'
  if (ratio < 0.85) return 'portrait'
  return 'square'
}

// Mosaic layout generator - creates Tetris-style packed grid
// Intelligently pairs tall portraits with stacked smaller images to eliminate gaps
function generateMosaicLayout(images: GalleryImage[]): { type: string; images: GalleryImage[] }[] {
  if (images.length === 0) return []
  
  const rows: { type: string; images: GalleryImage[] }[] = []
  let i = 0
  
  // Helper: look ahead to find best pairing for a portrait
  const findStackableImages = (startIdx: number, excludeIdx: number): number[] => {
    const candidates: number[] = []
    for (let j = startIdx; j < Math.min(startIdx + 6, images.length); j++) {
      if (j === excludeIdx) continue
      const cat = getAspectCategory(images[j])
      if (cat !== 'portrait') candidates.push(j)
      if (candidates.length === 2) break
    }
    return candidates
  }
  
  while (i < images.length) {
    const remaining = images.length - i
    const rowIndex = rows.length
    const currentAspect = getAspectCategory(images[i])
    
    // TETRIS LOGIC: Prioritize pairing portraits with stacked non-portraits
    if (remaining >= 3 && currentAspect === 'portrait') {
      // Portrait first - find 2 non-portraits to stack next to it
      const stackable = findStackableImages(i + 1, i)
      if (stackable.length === 2) {
        // Portrait left + 2 stacked right (tetris fit)
        rows.push({ 
          type: 'portrait-stack-right', 
          images: [images[i], images[stackable[0]], images[stackable[1]]] 
        })
        // Mark used indices and advance
        const usedSet = new Set([i, ...stackable])
        i = Math.max(...stackable) + 1
        // Skip any we already used that might be in between
        continue
      }
    }
    
    // Check if next image is portrait and current is not - reverse tetris
    if (remaining >= 3 && currentAspect !== 'portrait') {
      const nextAspect = getAspectCategory(images[i + 1])
      if (nextAspect === 'portrait') {
        // Find another non-portrait to stack with current
        const thirdAspect = i + 2 < images.length ? getAspectCategory(images[i + 2]) : 'portrait'
        if (thirdAspect !== 'portrait') {
          // 2 stacked left + portrait right (tetris fit)
          rows.push({ 
            type: 'portrait-stack-left', 
            images: [images[i], images[i + 2], images[i + 1]] // stack images, then portrait
          })
          i += 3
          continue
        }
      }
    }
    
    // Standard patterns with variety
    if (remaining >= 3 && rowIndex % 4 === 0) {
      // Row type: 1 large left + 2 stacked right
      rows.push({ type: 'featured-left', images: images.slice(i, i + 3) })
      i += 3
    } else if (remaining >= 3 && rowIndex % 4 === 2) {
      // Row type: 2 stacked left + 1 large right  
      rows.push({ type: 'featured-right', images: images.slice(i, i + 3) })
      i += 3
    } else if (remaining >= 4 && rowIndex % 3 === 1) {
      // Row type: 4 equal columns
      rows.push({ type: 'quad', images: images.slice(i, i + 4) })
      i += 4
    } else if (remaining >= 2) {
      // Duo - but check for aspect mismatch that would create gaps
      const aspect1 = getAspectCategory(images[i])
      const aspect2 = getAspectCategory(images[i + 1])
      
      // If one is portrait and other isn't, try to find a better match
      if ((aspect1 === 'portrait') !== (aspect2 === 'portrait') && remaining >= 3) {
        // Look for a third image that matches better
        const aspect3 = getAspectCategory(images[i + 2])
        if (aspect1 === 'portrait' && aspect3 !== 'portrait') {
          // Portrait + 2 non-portraits stacked
          rows.push({ 
            type: 'portrait-stack-right', 
            images: [images[i], images[i + 1], images[i + 2]] 
          })
          i += 3
          continue
        } else if (aspect2 === 'portrait' && aspect3 !== 'portrait') {
          // 2 non-portraits stacked + portrait
          rows.push({ 
            type: 'portrait-stack-left', 
            images: [images[i], images[i + 2], images[i + 1]] 
          })
          i += 3
          continue
        }
      }
      
      // Standard duo - same aspect types work well together
      rows.push({ type: 'duo', images: images.slice(i, i + 2) })
      i += 2
    } else {
      // Single image - full width
      rows.push({ type: 'single', images: [images[i]] })
      i += 1
    }
  }
  
  return rows
}

// Fullscreen Viewer
function FullscreenViewer({
  images,
  currentIndex,
  onClose,
  onNavigate,
  downloadEnabled,
  galleryTitle,
}: {
  images: GalleryImage[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  downloadEnabled?: boolean
  galleryTitle?: string
}) {
  const image = images[currentIndex]
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      {/* Top bar with Download, Pinterest and close */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {downloadEnabled && (
          <ImageDownloadButtonDark imageId={image.id} size="md" />
        )}
        {image.previewUrl && (
          <SocialShareButtonsDark
            imageUrl={image.previewUrl}
            description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
          />
        )}
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-16">
        <motion.img
          key={image.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          src={image.previewUrl}
          alt={getSeoAltText(galleryTitle || 'Photo Gallery', undefined, currentIndex + 1)}
          className="max-w-full max-h-full object-contain"
          style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
        />
      </div>

      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-white rotate-90" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-white -rotate-90" />
        </button>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <span className="text-white/60 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-full transition-colors ${
                isFavorite ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            {downloadEnabled && (
              <button className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Clean Grid Card - OPTIMIZED: CSS animations instead of Framer Motion per-item
// This prevents 670+ intersection observers for large galleries
function CleanGridCard({
  image,
  index,
  onClick,
  galleryTitle,
  downloadEnabled,
}: {
  image: GalleryImage
  index: number
  onClick: () => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  return (
    <div
      className="relative overflow-hidden cursor-pointer group aspect-[4/5] bg-stone-100"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Skeleton while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
      )}
      {image.thumbnailUrl && (
        <Image
          src={image.thumbnailUrl}
          alt={getSeoAltText(galleryTitle || 'Photo Gallery', undefined, index + 1)}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-[1.02] ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
          sizes="(max-width: 768px) 50vw, 33vw"
          onLoad={() => setIsLoaded(true)}
          loading={index < 20 ? 'eager' : 'lazy'}
          unoptimized
        />
      )}
      {/* Subtle hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
      {/* Action buttons on hover */}
      {isHovered && (
        <div 
          className="absolute top-2 right-2 z-10 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {downloadEnabled && (
            <ImageDownloadButton imageId={image.id} size="sm" />
          )}
          {image.originalUrl && (
            <SocialShareButtons
              imageUrl={image.originalUrl}
              description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  )
}

// Image Card - OPTIMIZED: CSS transitions, skeleton loading, proper priority hints
function ImageCard({
  image,
  index,
  onClick,
  className = '',
  priority = false,
  galleryTitle,
  downloadEnabled,
}: {
  image: GalleryImage
  index: number
  onClick: () => void
  className?: string
  priority?: boolean
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  
  return (
    <div
      className={`relative overflow-hidden cursor-pointer group bg-stone-100 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Skeleton while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
      )}
      <Image
        src={image.previewUrl || image.thumbnailUrl}
        alt={getSeoAltText(galleryTitle || 'Photo Gallery', undefined, index + 1)}
        fill
        className={`object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
        sizes="(max-width: 768px) 100vw, 50vw"
        loading={priority || index < 20 ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
        unoptimized
      />
      {/* Action buttons on hover */}
      {isHovered && (
        <div 
          className="absolute top-2 right-2 z-10 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {downloadEnabled && (
            <ImageDownloadButton imageId={image.id} size="sm" />
          )}
          {(image.originalUrl || image.previewUrl || image.thumbnailUrl) && (
            <SocialShareButtons
              imageUrl={image.originalUrl || image.previewUrl || image.thumbnailUrl}
              description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  )
}

export function PublicGalleryView({
  title,
  images: initialImages,
  downloadEnabled = false,
  photographerName,
  eventDate,
  galleryId,
  gallerySlug,
  template = 'mosaic',
  presentation,
}: PublicGalleryViewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  
  // Pagination state for large galleries (3-4K images)
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(initialImages.every(img => img.thumbnailUrl))
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Single IntersectionObserver for pagination (not per-item)
  useEffect(() => {
    if (!galleryId || hasLoadedAll) return
    
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          const needsLoading = images.some(img => !img.thumbnailUrl)
          if (!needsLoading) {
            setHasLoadedAll(true)
            return
          }
          
          setIsLoadingMore(true)
          try {
            const offset = images.filter(img => img.thumbnailUrl).length
            const res = await fetch(`/api/public/gallery/${galleryId}/images?offset=${offset}&limit=100`)
            if (res.ok) {
              const data = await res.json()
              if (data.images?.length > 0) {
                setImages(prev => {
                  const updated = [...prev]
                  data.images.forEach((newImg: GalleryImage) => {
                    const idx = updated.findIndex(img => img.id === newImg.id)
                    if (idx >= 0) updated[idx] = { ...updated[idx], ...newImg }
                    else updated.push(newImg)
                  })
                  return updated
                })
              }
              if (!data.hasMore) setHasLoadedAll(true)
            }
          } catch (err) {
            console.error('Failed to load more images:', err)
          } finally {
            setIsLoadingMore(false)
          }
        }
      },
      { rootMargin: '600px' } // Load early for smooth scrolling
    )
    
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [galleryId, images, isLoadingMore, hasLoadedAll])

  const mosaicRows = useMemo(() => generateMosaicLayout(images.filter(img => img.thumbnailUrl)), [images])
  
  // Get hero image (first landscape or first image)
  const heroImage = useMemo(() => {
    const landscape = images.find(img => getAspectCategory(img) === 'landscape')
    return landscape || images[0]
  }, [images])

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {}
  }, [])

  const handleDownloadAll = useCallback(async () => {
    if (!galleryId) return
    window.location.href = `/api/gallery/${galleryId}/download`
  }, [galleryId])

  const openViewer = (index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }

  // Find global index for an image
  const getGlobalIndex = (img: GalleryImage) => images.findIndex(i => i.id === img.id)

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================
          HERO SECTION - Full viewport immersive
          ============================================ */}
      {heroImage && template === 'mosaic' && (
        <section className="relative h-screen w-full overflow-hidden">
          {/* Hero Image - Full quality, no effects */}
          <Image
            src={heroImage.originalUrl || heroImage.previewUrl}
            alt={getSeoAltText(title, photographerName)}
            fill
            className="object-cover"
            style={{ objectPosition: `${heroImage.focalX ?? 50}% ${heroImage.focalY ?? 50}%` }}
            priority
            sizes="100vw"
            unoptimized
          />
          
          {/* Minimal gradient for text readability only */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-16 lg:p-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-4xl"
            >
              {photographerName && (
                <p className="text-white/70 text-sm uppercase tracking-[0.2em] mb-4">
                  {photographerName}
                </p>
              )}
              <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white font-light tracking-wide mb-4">
                {title}
              </h1>
              {/* Tagline/Subtitle from presentation */}
              {presentation?.subtitle && (
                <p className="text-white/70 text-base md:text-lg font-light italic mb-4">
                  {presentation.subtitle}
                </p>
              )}
              {eventDate && (
                <p className="text-white/60 text-sm tracking-wide">{eventDate}</p>
              )}
            </motion.div>
          </div>
          
          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ChevronDown className="w-5 h-5 text-white/60" />
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ============================================
          FIXED HEADER - Appears on scroll
          ============================================ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-3 py-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors rounded-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {showCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{showCopied ? 'Copied!' : 'Share'}</span>
            </button>
            
            {downloadEnabled && (
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="flex items-center gap-2 px-5 py-2 text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Download All</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ============================================
          GALLERY GRID
          ============================================ */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          {/* Modern Hero Section Header */}
          <div className="relative mb-16 md:mb-24">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.03, scale: 1 }}
                transition={{ duration: 1 }}
                className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-amber-400 to-orange-300 rounded-full blur-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.02, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute -bottom-20 -left-20 w-80 h-80 bg-gradient-to-tr from-stone-400 to-stone-300 rounded-full blur-3xl"
              />
            </div>
            
            {/* Main content */}
            <div className="relative text-center max-w-3xl mx-auto">
              {/* Animated tagline */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-6"
              >
                <span className="w-8 h-px bg-gradient-to-r from-transparent to-amber-400" />
                <span className="text-xs uppercase tracking-[0.3em] text-stone-400 font-medium">
                  The Collection
                </span>
                <span className="w-8 h-px bg-gradient-to-l from-transparent to-amber-400" />
              </motion.div>
              
              {/* Main headline with mixed typography */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <h2 className="text-4xl md:text-5xl lg:text-6xl text-stone-800 mb-4">
                  <span className="font-light">{images.length}</span>
                  <span className="font-serif italic text-stone-600"> Moments</span>
                  <br className="hidden sm:block" />
                  <span className="font-light"> Captured</span>
                </h2>
              </motion.div>
              
              {/* Subtitle with animation */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-stone-500 text-base md:text-lg font-light max-w-xl mx-auto mt-4"
              >
                {presentation?.subtitle || "Every frame tells a story. Scroll to explore."}
              </motion.p>
              
              {/* Animated decorative dots */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center justify-center gap-1.5 mt-8"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-stone-300"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                  />
                ))}
              </motion.div>
              
              {/* Image preview strip - larger cards with staggered animations */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mt-12 flex justify-center items-end gap-3 md:gap-4 px-4"
              >
                {images.slice(0, 5).map((img, idx) => {
                  const isCenter = idx === 2
                  const isEdge = idx === 0 || idx === 4
                  return (
                    <motion.div
                      key={img.id}
                      className="relative overflow-hidden rounded-xl shadow-xl cursor-pointer"
                      style={{
                        width: isCenter ? 180 : isEdge ? 120 : 150,
                        height: isCenter ? 240 : isEdge ? 160 : 200,
                      }}
                      initial={{ 
                        opacity: 0, 
                        y: 60, 
                        scale: 0.8,
                        rotateY: isEdge ? (idx === 0 ? 15 : -15) : 0 
                      }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        rotateY: 0 
                      }}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.5 + idx * 0.1,
                        type: 'spring',
                        stiffness: 100
                      }}
                      whileHover={{ 
                        scale: 1.08, 
                        y: -12,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        zIndex: 10
                      }}
                    >
                      <Image
                        src={img.thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-110"
                        sizes="(max-width: 768px) 120px, 180px"
                        unoptimized
                      />
                      {/* Subtle gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>
          </div>

          {template === 'mosaic' ? (
            /* ============================================
               MOSAIC LAYOUT - Pic-Time style varied grid
               ============================================ */
            <div className="space-y-6 md:space-y-10">
              {mosaicRows.map((row, rowIdx) => {
                switch (row.type) {
                  case 'featured-left':
                    // 1 large left (2/3) + 2 stacked right (1/3)
                    return (
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                        <ImageCard
                          image={row.images[0]}
                          index={getGlobalIndex(row.images[0])}
                          onClick={() => openViewer(getGlobalIndex(row.images[0]))}
                          className="md:col-span-2 aspect-[4/3] md:aspect-[16/10]"
                          priority={rowIdx === 0}
                          galleryTitle={title}
                          downloadEnabled={downloadEnabled}
                        />
                        <div className="grid grid-rows-2 gap-6 md:gap-10">
                          {row.images.slice(1).map((img) => (
                            <ImageCard
                              key={img.id}
                              image={img}
                              index={getGlobalIndex(img)}
                              onClick={() => openViewer(getGlobalIndex(img))}
                              className="aspect-[4/3]"
                              galleryTitle={title}
                              downloadEnabled={downloadEnabled}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  
                  case 'featured-right':
                    // 2 stacked left (1/3) + 1 large right (2/3)
                    return (
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                        <div className="grid grid-rows-2 gap-6 md:gap-10 order-2 md:order-1">
                          {row.images.slice(1).map((img) => (
                            <ImageCard
                              key={img.id}
                              image={img}
                              index={getGlobalIndex(img)}
                              onClick={() => openViewer(getGlobalIndex(img))}
                              className="aspect-[4/3]"
                              galleryTitle={title}
                              downloadEnabled={downloadEnabled}
                            />
                          ))}
                        </div>
                        <ImageCard
                          image={row.images[0]}
                          index={getGlobalIndex(row.images[0])}
                          onClick={() => openViewer(getGlobalIndex(row.images[0]))}
                          className="md:col-span-2 aspect-[4/3] md:aspect-[16/10] order-1 md:order-2"
                          galleryTitle={title}
                          downloadEnabled={downloadEnabled}
                        />
                      </div>
                    )
                  
                  case 'portrait-stack-right':
                    // TETRIS: Portrait left + 2 stacked squares/landscapes right
                    // Portrait takes ~60% width, stacked images take ~40%
                    return (
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
                        <ImageCard
                          image={row.images[0]}
                          index={getGlobalIndex(row.images[0])}
                          onClick={() => openViewer(getGlobalIndex(row.images[0]))}
                          className="md:col-span-3 aspect-[3/4]"
                          galleryTitle={title}
                          downloadEnabled={downloadEnabled}
                        />
                        <div className="md:col-span-2 grid grid-rows-2 gap-6 md:gap-10">
                          {row.images.slice(1).map((img) => (
                            <ImageCard
                              key={img.id}
                              image={img}
                              index={getGlobalIndex(img)}
                              onClick={() => openViewer(getGlobalIndex(img))}
                              className="aspect-[4/3]"
                              galleryTitle={title}
                              downloadEnabled={downloadEnabled}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  
                  case 'portrait-stack-left':
                    // TETRIS: 2 stacked squares/landscapes left + Portrait right
                    // images[0] and images[1] are stacked, images[2] is portrait
                    return (
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-10">
                        <div className="md:col-span-2 grid grid-rows-2 gap-6 md:gap-10 order-2 md:order-1">
                          <ImageCard
                            image={row.images[0]}
                            index={getGlobalIndex(row.images[0])}
                            onClick={() => openViewer(getGlobalIndex(row.images[0]))}
                            className="aspect-[4/3]"
                            galleryTitle={title}
                            downloadEnabled={downloadEnabled}
                          />
                          <ImageCard
                            image={row.images[1]}
                            index={getGlobalIndex(row.images[1])}
                            onClick={() => openViewer(getGlobalIndex(row.images[1]))}
                            className="aspect-[4/3]"
                            galleryTitle={title}
                            downloadEnabled={downloadEnabled}
                          />
                        </div>
                        <ImageCard
                          image={row.images[2]}
                          index={getGlobalIndex(row.images[2])}
                          onClick={() => openViewer(getGlobalIndex(row.images[2]))}
                          className="md:col-span-3 aspect-[3/4] order-1 md:order-2"
                          galleryTitle={title}
                          downloadEnabled={downloadEnabled}
                        />
                      </div>
                    )
                  
                  case 'quad':
                    // 4 equal columns
                    return (
                      <div key={rowIdx} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                        {row.images.map((img, idx) => (
                          <ImageCard
                            key={img.id}
                            image={img}
                            index={getGlobalIndex(img)}
                            onClick={() => openViewer(getGlobalIndex(img))}
                            className={`aspect-[3/4]`}
                            galleryTitle={title}
                            downloadEnabled={downloadEnabled}
                          />
                        ))}
                      </div>
                    )
                  
                  case 'duo':
                    // 2 images - vary aspect based on image orientation
                    const aspect1 = getAspectCategory(row.images[0])
                    const aspect2 = row.images[1] ? getAspectCategory(row.images[1]) : 'square'
                    return (
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        {row.images.map((img) => {
                          const cat = getAspectCategory(img)
                          const aspectClass = cat === 'portrait' ? 'aspect-[3/4]' : cat === 'landscape' ? 'aspect-[4/3]' : 'aspect-square'
                          return (
                            <ImageCard
                              key={img.id}
                              image={img}
                              index={getGlobalIndex(img)}
                              onClick={() => openViewer(getGlobalIndex(img))}
                              className={aspectClass}
                              galleryTitle={title}
                              downloadEnabled={downloadEnabled}
                            />
                          )
                        })}
                      </div>
                    )
                  
                  case 'single':
                    // Full width single image
                    return (
                      <div key={rowIdx} className="max-w-4xl mx-auto">
                        <ImageCard
                          image={row.images[0]}
                          index={getGlobalIndex(row.images[0])}
                          onClick={() => openViewer(getGlobalIndex(row.images[0]))}
                          className="aspect-[16/9]"
                          galleryTitle={title}
                          downloadEnabled={downloadEnabled}
                        />
                      </div>
                    )
                  
                  default:
                    return null
                }
              })}
            </div>
          ) : (
            /* ============================================
               CLEAN GRID - Pic-Time style 3-column masonry
               ============================================ */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {images.filter(img => img.thumbnailUrl).map((image) => {
                const globalIdx = images.findIndex(i => i.id === image.id)
                return (
                  <CleanGridCard
                    key={image.id}
                    image={image}
                    index={globalIdx}
                    onClick={() => openViewer(globalIdx)}
                    galleryTitle={title}
                    downloadEnabled={downloadEnabled}
                  />
                )
              })}
            </div>
          )}
          
          {/* Pagination trigger - single observer for large galleries */}
          <div ref={loadMoreRef} className="h-4" />
          {isLoadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </section>

      {/* ============================================
          QUOTE SECTION
          ============================================ */}
      {presentation?.quote && (
        <section className="py-16 md:py-24 px-6 border-t border-neutral-100">
          <div className="max-w-2xl mx-auto text-center">
            <blockquote className="font-serif text-xl md:text-2xl italic text-neutral-700 leading-relaxed">
              "{presentation.quote}"
            </blockquote>
            {presentation.quoteAttribution && (
              <cite className="block mt-6 text-sm text-neutral-400 not-italic tracking-wide">
                — {presentation.quoteAttribution}
              </cite>
            )}
          </div>
        </section>
      )}

      {/* ============================================
          FOOTER
          ============================================ */}
      <footer className="border-t border-neutral-100 py-16">
        <div className="max-w-[1800px] mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-300 mb-6">Fin.</p>
          {photographerName && (
            <p className="text-sm text-neutral-400 mb-2">
              Photography by <span className="text-neutral-600">{photographerName}</span>
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="w-8 h-8 rounded-full bg-neutral-900 flex items-center justify-center">
              <span className="text-xs font-bold text-white">12</span>
            </div>
            <span className="text-sm text-neutral-400">Crafted with 12img</span>
          </div>
        </div>
      </footer>

      {/* ============================================
          FULLSCREEN VIEWER
          ============================================ */}
      <AnimatePresence>
        {viewerOpen && (
          <FullscreenViewer
            images={images}
            currentIndex={viewerIndex}
            onClose={() => setViewerOpen(false)}
            onNavigate={setViewerIndex}
            downloadEnabled={downloadEnabled}
            galleryTitle={title}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
