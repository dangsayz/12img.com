/**
 * ============================================================================
 * MOSAIC VIEW - Pic-Time Style Gallery Layout
 * ============================================================================
 * 
 * A world-class mosaic gallery layout inspired by Pic-Time:
 * 
 * FEATURES:
 * - Split hero section (image left, text right)
 * - True 3-column masonry with staggered vertical rhythm
 * - Generous gaps (64px columns, 48px rows)
 * - Download/Pinterest on hover
 * - Sticky header with photographer logo
 * - Scroll-triggered reveals
 * - Elegant micro-interactions
 * 
 * @see https://pic-time.com for reference
 * ============================================================================
 */

'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { 
  Download, 
  ChevronDown, 
  X,
  Share2,
  Check,
  Loader2,
  ImageIcon
} from 'lucide-react'
import { SocialShareButtons, SocialShareButtonsDark } from '@/components/ui/SocialShareButtons'
import { ImageDownloadButton, ImageDownloadButtonDark } from '@/components/ui/ImageDownloadButton'
import { DownloadModal } from '@/components/ui/DownloadModal'
import { getSeoAltText } from '@/lib/seo/image-urls'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface GalleryImage {
  id: string
  storagePath?: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
}

interface MosaicViewProps {
  title: string
  images: GalleryImage[]
  downloadEnabled?: boolean
  photographerName?: string
  photographerLogo?: string
  galleryId?: string
  gallerySlug?: string
  totalImages?: number
  isOwner?: boolean
  coverImageId?: string | null
  onSetCover?: (imageId: string) => Promise<void>
}


// ─────────────────────────────────────────────────────────────────────────────
// FULLSCREEN VIEWER
// ─────────────────────────────────────────────────────────────────────────────

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1)
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(currentIndex + 1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, images.length, onClose, onNavigate])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between">
        <div className="text-white/60 text-sm font-light">
          {currentIndex + 1} / {images.length}
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Main image */}
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

      {/* Navigation arrows */}
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

      {/* Bottom bar with counter */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center">
          <span className="text-white/60 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MASONRY IMAGE CARD
// ─────────────────────────────────────────────────────────────────────────────

function MasonryCard({
  image,
  index,
  onClick,
  galleryTitle,
  downloadEnabled,
  isOwner,
  isCover,
  onSetCover,
}: {
  image: GalleryImage
  index: number
  onClick: () => void
  galleryTitle?: string
  downloadEnabled?: boolean
  isOwner?: boolean
  isCover?: boolean
  onSetCover?: (imageId: string) => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSettingCover, setIsSettingCover] = useState(false)

  const handleSetCover = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onSetCover || isSettingCover) return
    setIsSettingCover(true)
    try {
      await onSetCover(image.id)
    } finally {
      setIsSettingCover(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative cursor-pointer group overflow-hidden"
      style={{ 
        breakInside: 'avoid',
        marginBottom: '48px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Cover badge - always visible if this is the cover */}
      {isCover && (
        <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-stone-900/80 backdrop-blur-sm rounded text-[10px] uppercase tracking-wider text-white font-medium flex items-center gap-1">
          <ImageIcon className="w-3 h-3" />
          Cover
        </div>
      )}
      
      {/* Skeleton - shows before image loads */}
      {!isLoaded && (
        <div 
          className="w-full bg-stone-100 animate-pulse"
          style={{ 
            aspectRatio: (image.width && image.height) 
              ? `${image.width} / ${image.height}` 
              : '4 / 3' 
          }}
        />
      )}
      
      {/* Image - natural sizing for true masonry */}
      {image.thumbnailUrl && (
        <Image
          src={image.thumbnailUrl}
          alt={getSeoAltText(galleryTitle || 'Photo', undefined, index + 1)}
          width={image.width || 800}
          height={image.height || 600}
          className={`w-full h-auto transition-all duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
          style={{ 
            objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%`,
          }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setIsLoaded(true)}
          onError={() => console.error('Failed to load image:', image.id, image.thumbnailUrl)}
          loading={index < 9 ? 'eager' : 'lazy'}
          priority={index < 6}
        />
      )}
      
      {/* Overlay container - positioned over the image */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Hover overlay */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/10"
        />
        
        {/* Owner actions - top left (only if not already cover) */}
        {isOwner && !isCover && (
          <motion.div
            initial={false}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto absolute top-3 left-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleSetCover}
              disabled={isSettingCover}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/95 hover:bg-white rounded-md text-xs font-medium text-stone-700 hover:text-stone-900 shadow-sm transition-all disabled:opacity-50"
            >
              {isSettingCover ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3" />
              )}
              Set as Cover
            </button>
          </motion.div>
        )}
        
        {/* Download/Share - top right */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-auto absolute top-3 right-3 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {downloadEnabled && (
            <ImageDownloadButton imageId={image.id} size="sm" />
          )}
          {image.thumbnailUrl && (
            <SocialShareButtons
              imageUrl={image.originalUrl || image.previewUrl || image.thumbnailUrl}
              description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
              size="sm"
            />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function MosaicView({
  title,
  images: initialImages,
  downloadEnabled = false,
  photographerName,
  photographerLogo,
  galleryId,
  gallerySlug,
  totalImages,
  isOwner = false,
  coverImageId: initialCoverImageId,
  onSetCover,
}: MosaicViewProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [showCopied, setShowCopied] = useState(false)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [images, setImages] = useState<GalleryImage[]>(initialImages)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasLoadedAll, setHasLoadedAll] = useState(false)
  const [coverImageId, setCoverImageId] = useState<string | null | undefined>(initialCoverImageId)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  // Handle setting cover with optimistic update
  const handleSetCover = useCallback(async (imageId: string) => {
    const previousCoverId = coverImageId
    setCoverImageId(imageId) // Optimistic update
    try {
      if (onSetCover) {
        await onSetCover(imageId)
      }
    } catch (error) {
      setCoverImageId(previousCoverId) // Revert on error
      console.error('Failed to set cover:', error)
    }
  }, [coverImageId, onSetCover])
  
  const heroRef = useRef<HTMLDivElement>(null)
  
  // Lazy load more images when scrolling near bottom
  useEffect(() => {
    if (!galleryId || hasLoadedAll) return
    
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          // Check if we have images without URLs that need loading
          const needsLoading = images.some(img => !img.thumbnailUrl)
          if (!needsLoading) {
            // All current images have URLs, try to load more
            const total = totalImages || images.length
            if (images.length >= total) {
              setHasLoadedAll(true)
              return
            }
          }
          
          setIsLoadingMore(true)
          try {
            const offset = images.filter(img => img.thumbnailUrl).length
            const res = await fetch(`/api/public/gallery/${galleryId}/images?offset=${offset}&limit=24`)
            if (res.ok) {
              const data = await res.json()
              if (data.images && data.images.length > 0) {
                setImages(prev => {
                  // Merge new images with existing ones
                  const newImages = [...prev]
                  data.images.forEach((newImg: GalleryImage) => {
                    const existingIndex = newImages.findIndex(img => img.id === newImg.id)
                    if (existingIndex >= 0) {
                      // Update existing image with URLs
                      newImages[existingIndex] = { ...newImages[existingIndex], ...newImg }
                    } else {
                      // Add new image
                      newImages.push(newImg)
                    }
                  })
                  return newImages
                })
              }
              if (!data.hasMore) {
                setHasLoadedAll(true)
              }
            }
          } catch (error) {
            console.error('Failed to load more images:', error)
          } finally {
            setIsLoadingMore(false)
          }
        }
      },
      { rootMargin: '400px' }
    )
    
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }
    
    return () => observer.disconnect()
  }, [galleryId, images, isLoadingMore, hasLoadedAll, totalImages])
  const { scrollY } = useScroll()
  
  // Show header after scrolling past hero
  useEffect(() => {
    const unsubscribe = scrollY.on('change', (latest) => {
      const heroHeight = heroRef.current?.offsetHeight || 0
      setHeaderVisible(latest > heroHeight - 100)
    })
    return () => unsubscribe()
  }, [scrollY])
  
  // Get hero image (first landscape or first image)
  const heroImage = useMemo(() => {
    const landscape = images.find(img => {
      if (!img.width || !img.height) return false
      return img.width / img.height > 1.2
    })
    return landscape || images[0]
  }, [images])
  
  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {}
  }, [])

  const handleDownloadAll = useCallback(() => {
    if (!galleryId) return
    setShowDownloadModal(true)
  }, [galleryId])

  const openViewer = (imageId: string) => {
    const index = images.findIndex(img => img.id === imageId)
    if (index !== -1) {
      setViewerIndex(index)
      setViewerOpen(true)
    }
  }

  // Generate photographer initials for logo
  const initials = photographerName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '12'

  // Scroll-based parallax for hero
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  
  const heroImageY = useTransform(scrollYProgress, [0, 1], ['0%', '20%'])
  const heroImageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  return (
    <div className="min-h-screen bg-white">
      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION - Split layout with parallax
          ════════════════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen flex overflow-hidden">
        {/* Left - Hero Image with Parallax */}
        <div className="relative w-1/2 h-full overflow-hidden">
          {heroImage && (
            <>
              <motion.div
                className="absolute inset-0"
                style={{ 
                  y: heroImageY,
                  scale: heroImageScale,
                }}
              >
                <Image
                  src={heroImage.originalUrl || heroImage.previewUrl}
                  alt={getSeoAltText(title, photographerName)}
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${heroImage.focalX ?? 50}% ${heroImage.focalY ?? 50}%` }}
                  priority
                  quality={90}
                  sizes="50vw"
                />
              </motion.div>
              
              {/* Ultra-minimal text overlay on image */}
              <motion.div 
                className="absolute inset-0 flex items-end justify-start p-8 md:p-12"
                style={{ opacity: heroOpacity }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Subtle gradient for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Image count - ultra minimal */}
                  <p className="relative text-[10px] uppercase tracking-[0.4em] text-white/60 mb-2">
                    {images.length} images
                  </p>
                </motion.div>
              </motion.div>
            </>
          )}
        </div>
        
        {/* Right - Title & Info with parallax */}
        <motion.div 
          className="w-1/2 h-full flex flex-col items-center justify-center px-12 lg:px-20"
          style={{ y: textY }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-center max-w-md"
          >
            {/* Photographer Logo/Initials - elegant entrance */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {photographerLogo ? (
                <Image
                  src={photographerLogo}
                  alt={photographerName || 'Photographer'}
                  width={80}
                  height={80}
                  className="mx-auto"
                />
              ) : (
                <div className="inline-flex items-center justify-center">
                  <span className="text-5xl font-serif font-extralight text-stone-800 tracking-tight">
                    {initials}
                  </span>
                </div>
              )}
            </motion.div>
            
            {/* Gallery Title - staggered entrance */}
            <motion.h1 
              className="text-2xl md:text-3xl lg:text-4xl font-extralight text-stone-800 tracking-wide mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {title}
            </motion.h1>
            
            {/* Animated Divider */}
            <motion.div 
              className="w-12 h-px bg-stone-200 mx-auto mb-8"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            
            {/* Photographer Attribution */}
            <motion.p 
              className="text-xs uppercase tracking-[0.25em] text-stone-400 font-light"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              Photos by {photographerName || '12img'}
            </motion.p>

            {/* Download All Button - only if enabled */}
            {downloadEnabled && (
              <motion.button
                onClick={handleDownloadAll}
                className="mt-10 inline-flex items-center gap-2 px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-stone-500 border border-stone-200 hover:border-stone-400 hover:text-stone-700 transition-all"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
              >
                <Download className="w-4 h-4" />
                Download All
              </motion.button>
            )}
          </motion.div>
          
          {/* Scroll indicator - refined */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-10"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] text-stone-300">
                Scroll
              </span>
              <ChevronDown className="w-4 h-4 text-stone-300" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          STICKY HEADER - Appears on scroll
          ════════════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={false}
        animate={{ 
          y: headerVisible ? 0 : -100,
          opacity: headerVisible ? 1 : 0 
        }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-stone-100"
      >
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-center gap-4">
            <span className="text-xl font-serif font-light text-stone-800">
              {initials}
            </span>
          </div>
          
          {/* Center - Nav */}
          <nav className="flex items-center gap-8">
            <button className="text-xs uppercase tracking-[0.15em] text-stone-900 border-b-2 border-stone-900 py-4">
              Gallery
            </button>
          </nav>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2.5 hover:bg-stone-100 transition-colors rounded-full"
            >
              {showCopied ? (
                <Check className="w-5 h-5 text-stone-500" />
              ) : (
                <Share2 className="w-5 h-5 text-stone-500" />
              )}
            </button>
            {downloadEnabled && (
              <button
                onClick={handleDownloadAll}
                className="p-2.5 hover:bg-stone-100 transition-colors rounded-full"
              >
                <Download className="w-5 h-5 text-stone-500" />
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* ════════════════════════════════════════════════════════════════════
          MASONRY GRID - CSS columns for true staggered masonry
          ════════════════════════════════════════════════════════════════════ */}
      <section className="px-4 py-8 sm:px-8 sm:py-12 md:px-12 lg:px-16 md:py-16">
        <div 
          className="max-w-[1800px] mx-auto columns-1 sm:columns-2 lg:columns-3"
          style={{ columnGap: '64px' }}
        >
          {images.filter(img => img.thumbnailUrl).map((image, idx) => {
            const globalIndex = images.findIndex(img => img.id === image.id)
            return (
              <MasonryCard
                key={image.id}
                image={image}
                index={globalIndex}
                onClick={() => openViewer(image.id)}
                galleryTitle={title}
                downloadEnabled={downloadEnabled}
                isOwner={isOwner}
                isCover={image.id === coverImageId}
                onSetCover={handleSetCover}
              />
            )
          })}
        </div>
        
        {/* Lazy load trigger */}
        <div ref={loadMoreRef} className="h-4" />
        
        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-stone-100 py-16">
        <div className="max-w-[1800px] mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-300 mb-8">
            — Fin —
          </p>
          {photographerName && (
            <p className="text-sm text-stone-400 mb-4">
              Photography by <span className="text-stone-600">{photographerName}</span>
            </p>
          )}
          
          {/* Download All in footer */}
          {downloadEnabled && (
            <button
              onClick={handleDownloadAll}
              className="mt-8 mb-8 inline-flex items-center gap-2 px-8 py-3 text-xs uppercase tracking-[0.2em] text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-800 transition-all"
            >
              <Download className="w-4 h-4" />
              Download All Photos
            </button>
          )}
          
          <div className="flex items-center justify-center gap-3 mt-8">
            <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white">12</span>
            </div>
            <span className="text-xs text-stone-400">Delivered with 12img</span>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════════
          FULLSCREEN VIEWER
          ════════════════════════════════════════════════════════════════════ */}
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

      {/* Download Modal */}
      {galleryId && (
        <DownloadModal
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
          galleryId={galleryId}
          galleryTitle={title}
          imageCount={totalImages || images.length}
        />
      )}
    </div>
  )
}

export default MosaicView
