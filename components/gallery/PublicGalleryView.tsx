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

import { useState, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, Share2, Check, Loader2, Heart, X, ArrowLeft } from 'lucide-react'
// Note: Heart used in FullscreenViewer, X used for close button
import Link from 'next/link'
import { PinterestShareButton, PinterestShareButtonDark } from '@/components/ui/PinterestShareButton'
import { ImageDownloadButton, ImageDownloadButtonDark } from '@/components/ui/ImageDownloadButton'
import { getSeoAltText } from '@/lib/seo/image-urls'

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
}

// Get aspect ratio category
function getAspectCategory(img: GalleryImage): 'portrait' | 'landscape' | 'square' {
  if (!img.width || !img.height) return 'square'
  const ratio = img.width / img.height
  if (ratio > 1.2) return 'landscape'
  if (ratio < 0.85) return 'portrait'
  return 'square'
}

// Mosaic layout generator - creates Pic-Time style varied grid
function generateMosaicLayout(images: GalleryImage[]): { type: string; images: GalleryImage[] }[] {
  if (images.length === 0) return []
  
  const rows: { type: string; images: GalleryImage[] }[] = []
  let i = 0
  
  while (i < images.length) {
    const remaining = images.length - i
    const rowIndex = rows.length
    
    // Vary row patterns for visual interest
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
      // Row type: 2 images side by side
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
          <PinterestShareButtonDark
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
        loading={index < 12 ? 'eager' : 'lazy'}
        priority={index < 6}
      />
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
            <PinterestShareButton
              imageUrl={image.originalUrl}
              description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
              variant="icon"
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
        priority={priority || index < 4}
        loading={priority || index < 8 ? 'eager' : 'lazy'}
        onLoad={() => setIsLoaded(true)}
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
            <PinterestShareButton
              imageUrl={image.originalUrl || image.previewUrl || image.thumbnailUrl}
              description={galleryTitle ? `${galleryTitle} | 12img` : '12img'}
              variant="icon"
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
  images,
  downloadEnabled = false,
  photographerName,
  eventDate,
  galleryId,
  gallerySlug,
  template = 'mosaic',
}: PublicGalleryViewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const mosaicRows = useMemo(() => generateMosaicLayout(images), [images])
  
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
            quality={90}
            sizes="100vw"
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
          <Link 
            href={`/gallery/${gallerySlug || galleryId}`}
            className="flex items-center gap-2 text-neutral-400 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          
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
      <section className="py-12 md:py-20">
        <div className="max-w-[1800px] mx-auto px-4 md:px-8">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-neutral-400 mb-2">
              The Collection
            </p>
            <h2 className="font-serif text-2xl md:text-3xl text-neutral-800 font-light">
              {images.length} Moments Captured
            </h2>
          </div>

          {template === 'mosaic' ? (
            /* ============================================
               MOSAIC LAYOUT - Pic-Time style varied grid
               ============================================ */
            <div className="space-y-3 md:space-y-4">
              {mosaicRows.map((row, rowIdx) => {
                switch (row.type) {
                  case 'featured-left':
                    // 1 large left (2/3) + 2 stacked right (1/3)
                    return (
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <ImageCard
                          image={row.images[0]}
                          index={getGlobalIndex(row.images[0])}
                          onClick={() => openViewer(getGlobalIndex(row.images[0]))}
                          className="md:col-span-2 aspect-[4/3] md:aspect-[16/10]"
                          priority={rowIdx === 0}
                          galleryTitle={title}
                          downloadEnabled={downloadEnabled}
                        />
                        <div className="grid grid-rows-2 gap-3 md:gap-4">
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
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                        <div className="grid grid-rows-2 gap-3 md:gap-4 order-2 md:order-1">
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
                  
                  case 'quad':
                    // 4 equal columns
                    return (
                      <div key={rowIdx} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
                      <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
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
               CLEAN GRID - Uniform cards, consistent sizing
               ============================================ */
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {images.map((image, idx) => (
                <CleanGridCard
                  key={image.id}
                  image={image}
                  index={idx}
                  onClick={() => openViewer(idx)}
                  galleryTitle={title}
                  downloadEnabled={downloadEnabled}
                />
              ))}
            </div>
          )}
        </div>
      </section>

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
