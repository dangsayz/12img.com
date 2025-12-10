/**
 * ============================================================================
 * CINEMATIC GALLERY - Moody, Dark Gallery Template
 * ============================================================================
 * 
 * Inspired by Pic-Time's dark gallery theme with varied row patterns:
 * - Hero section with image + title side by side
 * - Varied row layouts (4 equal, 1+2 stacked, 2+1 tall, 3 equal, wide span)
 * - Generous spacing (40px gaps - 5x normal)
 * - Dark/moody color scheme (stone-900 background)
 * 
 * @see https://pic-time.com for reference
 * ============================================================================
 */

'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, Check, ChevronDown, X } from 'lucide-react'
import { type PresentationData } from '@/lib/types/presentation'
import { getSeoAltText } from '@/lib/seo/image-urls'
import { ImageDownloadButtonDark } from '@/components/ui/ImageDownloadButton'
import { SocialShareButtonsDark } from '@/components/ui/SocialShareButtons'
import { DownloadModal } from '@/components/ui/DownloadModal'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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

interface CinematicGalleryProps {
  title: string
  images: GalleryImage[]
  galleryId: string
  gallerySlug?: string
  downloadEnabled?: boolean
  totalFileSizeBytes?: number
  presentation?: PresentationData | null
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW PATTERN TYPES (Pic-Time style)
// ─────────────────────────────────────────────────────────────────────────────

type RowPattern = 
  | 'four-equal'      // 4 images, equal width
  | 'one-tall-two'    // 1 tall left, 2 stacked right
  | 'two-one-tall'    // 2 stacked left, 1 tall right
  | 'three-equal'     // 3 images, equal width
  | 'wide-two'        // 1 wide top, 2 below
  | 'single'          // 1 large image

interface Row {
  pattern: RowPattern
  images: GalleryImage[]
  startIndex: number
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const GAP = 40 // 5x normal gap (~8px) = 40px

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Generate varied row patterns (Pic-Time style)
function generateRows(images: GalleryImage[]): Row[] {
  if (images.length === 0) return []
  
  const result: Row[] = []
  let i = 0
  let patternIndex = 0
  
  // Pattern sequence for visual variety
  const patterns: RowPattern[] = [
    'four-equal',
    'one-tall-two',
    'three-equal',
    'two-one-tall',
    'wide-two',
    'three-equal',
    'four-equal',
  ]
  
  while (i < images.length) {
    const remaining = images.length - i
    const pattern = patterns[patternIndex % patterns.length]
    
    let count = 0
    switch (pattern) {
      case 'four-equal':
        count = Math.min(4, remaining)
        break
      case 'one-tall-two':
      case 'two-one-tall':
      case 'three-equal':
      case 'wide-two':
        count = Math.min(3, remaining)
        break
      case 'single':
        count = 1
        break
      default:
        count = Math.min(3, remaining)
    }
    
    // Adjust pattern if not enough images
    let actualPattern = pattern
    if (count === 1) actualPattern = 'single'
    else if (count === 2) actualPattern = 'three-equal' // Will just show 2
    else if (count === 3 && pattern === 'four-equal') actualPattern = 'three-equal'
    
    result.push({
      pattern: actualPattern,
      images: images.slice(i, i + count),
      startIndex: i + 1, // +1 because hero is index 0
    })
    
    i += count
    patternIndex++
  }
  
  return result
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE CARD (Dark theme with hover actions)
// ─────────────────────────────────────────────────────────────────────────────

function ImageCard({
  image,
  index,
  onClick,
  galleryTitle,
  downloadEnabled,
  className = '',
  aspectRatio,
}: {
  image: GalleryImage
  index: number
  onClick: () => void
  galleryTitle?: string
  downloadEnabled?: boolean
  className?: string
  aspectRatio?: string
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`relative cursor-pointer group overflow-hidden bg-stone-800 ${className}`}
      style={{ aspectRatio }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-stone-800 animate-pulse" />
      )}

      {/* Image */}
      {image.thumbnailUrl && (
        <Image
          src={image.thumbnailUrl}
          alt={getSeoAltText(galleryTitle || 'Photo', undefined, index + 1)}
          fill
          className={`object-cover transition-all duration-700 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-105' : 'scale-100'}`}
          style={{ 
            objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%`,
          }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onLoad={() => setIsLoaded(true)}
          loading={index < 8 ? 'eager' : 'lazy'}
          unoptimized
        />
      )}

      {/* Hover overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/30"
      />

      {/* Actions - top right */}
      <motion.div
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute top-3 right-3 flex gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {downloadEnabled && (
          <ImageDownloadButtonDark imageId={image.id} size="sm" />
        )}
        <SocialShareButtonsDark
          imageUrl={image.thumbnailUrl}
          description={`${galleryTitle || 'Photo'} | 12img`}
        />
      </motion.div>
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW COMPONENTS (Pic-Time style patterns)
// ─────────────────────────────────────────────────────────────────────────────

function FourEqualRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: GAP }}>
      {images.map((img, i) => (
        <ImageCard
          key={img.id}
          image={img}
          index={startIndex + i}
          onClick={() => onImageClick(startIndex + i)}
          galleryTitle={galleryTitle}
          downloadEnabled={downloadEnabled}
          aspectRatio="4/3"
        />
      ))}
    </div>
  )
}

function OneTallTwoRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: GAP }}>
      {/* Tall left */}
      <ImageCard
        image={images[0]}
        index={startIndex}
        onClick={() => onImageClick(startIndex)}
        galleryTitle={galleryTitle}
        downloadEnabled={downloadEnabled}
        aspectRatio="3/4"
      />
      {/* Two stacked right */}
      <div className="flex flex-col" style={{ gap: GAP }}>
        {images.slice(1, 3).map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={startIndex + 1 + i}
            onClick={() => onImageClick(startIndex + 1 + i)}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            className="flex-1"
          />
        ))}
      </div>
    </div>
  )
}

function TwoOneTallRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: GAP }}>
      {/* Two stacked left */}
      <div className="flex flex-col" style={{ gap: GAP }}>
        {images.slice(0, 2).map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={startIndex + i}
            onClick={() => onImageClick(startIndex + i)}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            className="flex-1"
          />
        ))}
      </div>
      {/* Tall right */}
      {images[2] && (
        <ImageCard
          image={images[2]}
          index={startIndex + 2}
          onClick={() => onImageClick(startIndex + 2)}
          galleryTitle={galleryTitle}
          downloadEnabled={downloadEnabled}
          aspectRatio="3/4"
        />
      )}
    </div>
  )
}

function ThreeEqualRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3" style={{ gap: GAP }}>
      {images.map((img, i) => (
        <ImageCard
          key={img.id}
          image={img}
          index={startIndex + i}
          onClick={() => onImageClick(startIndex + i)}
          galleryTitle={galleryTitle}
          downloadEnabled={downloadEnabled}
          aspectRatio="4/3"
        />
      ))}
    </div>
  )
}

function WideTwoRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <div className="flex flex-col" style={{ gap: GAP }}>
      {/* Wide top */}
      <ImageCard
        image={images[0]}
        index={startIndex}
        onClick={() => onImageClick(startIndex)}
        galleryTitle={galleryTitle}
        downloadEnabled={downloadEnabled}
        aspectRatio="21/9"
      />
      {/* Two below */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: GAP }}>
        {images.slice(1, 3).map((img, i) => (
          <ImageCard
            key={img.id}
            image={img}
            index={startIndex + 1 + i}
            onClick={() => onImageClick(startIndex + 1 + i)}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            aspectRatio="4/3"
          />
        ))}
      </div>
    </div>
  )
}

function SingleRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <ImageCard
      image={images[0]}
      index={startIndex}
      onClick={() => onImageClick(startIndex)}
      galleryTitle={galleryTitle}
      downloadEnabled={downloadEnabled}
      aspectRatio="16/9"
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function CinematicGallery({
  title,
  images,
  galleryId,
  gallerySlug,
  downloadEnabled = false,
  totalFileSizeBytes,
  presentation,
}: CinematicGalleryProps) {
  const [showCopied, setShowCopied] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  
  // Hero image is first, grid images are the rest
  const heroImage = presentation?.coverImageId 
    ? images.find(img => img.id === presentation.coverImageId) || images[0]
    : images[0]
  const gridImages = images.slice(1)
  
  // Generate varied row patterns
  const rows = useMemo(() => generateRows(gridImages), [gridImages])
  
  const displayTitle = presentation?.coupleNames?.partner1 
    ? presentation.coupleNames.partner2
      ? `${presentation.coupleNames.partner1} & ${presentation.coupleNames.partner2}`
      : presentation.coupleNames.partner1
    : title
  
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {}
  }
  
  const handleDownload = () => {
    setShowDownloadModal(true)
  }

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
    setLightboxImage(images[index])
  }, [images])

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? Math.min(lightboxIndex + 1, images.length - 1)
      : Math.max(lightboxIndex - 1, 0)
    setLightboxIndex(newIndex)
    setLightboxImage(images[newIndex])
  }

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxImage) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxImage(null)
      if (e.key === 'ArrowLeft' && lightboxIndex > 0) navigateLightbox('prev')
      if (e.key === 'ArrowRight' && lightboxIndex < images.length - 1) navigateLightbox('next')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage, lightboxIndex, images.length])

  return (
    <div className="min-h-screen bg-stone-900">
      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION - Image left, title right (Pic-Time style)
          ════════════════════════════════════════════════════════════════════ */}
      <section className="min-h-screen flex items-center justify-center px-8 md:px-16 lg:px-24 py-16">
        <div className="max-w-[1600px] w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Hero Image */}
          {heroImage && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-[4/5] cursor-pointer overflow-hidden"
              onClick={() => openLightbox(0)}
            >
              {/* Vertical photographer credit */}
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:block">
                <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] whitespace-nowrap transform -rotate-90 block origin-center">
                  Photos by 12img
                </span>
              </div>
              <Image
                src={heroImage.previewUrl || heroImage.thumbnailUrl}
                alt={getSeoAltText(displayTitle, undefined, 1)}
                fill
                className="object-cover"
                style={{ 
                  objectPosition: `${heroImage.focalX ?? 50}% ${heroImage.focalY ?? 50}%`,
                }}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                unoptimized
              />
            </motion.div>
          )}

          {/* Title & Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-white"
          >
            {/* Gallery title */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-white/90 mb-4">
              {displayTitle}
            </h1>

            {/* Thin divider */}
            <div className="w-16 h-px bg-white/20 mb-8" />

            {/* Date */}
            {presentation?.eventDate && (
              <p className="text-white/50 text-sm tracking-widest uppercase mb-6">
                {formatDate(presentation.eventDate)}
              </p>
            )}

            {/* Subtitle */}
            {presentation?.subtitle && (
              <p className="text-white/40 text-sm tracking-wide mb-8">
                {presentation.subtitle}
              </p>
            )}

            {/* Image count */}
            <p className="text-xs text-white/30 tracking-[0.2em] uppercase">
              {images.length} photographs
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-8">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                {showCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {showCopied ? 'Copied' : 'Share'}
              </button>
              {downloadEnabled && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              )}
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-16 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <ChevronDown className="w-6 h-6 text-white/30" />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          GRID SECTION - Varied row patterns with generous spacing (40px)
          ════════════════════════════════════════════════════════════════════ */}
      <section className="px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-[1600px] mx-auto flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, rowIndex) => {
            const props = {
              images: row.images,
              startIndex: row.startIndex,
              onImageClick: openLightbox,
              galleryTitle: displayTitle,
              downloadEnabled,
            }

            switch (row.pattern) {
              case 'four-equal':
                return <FourEqualRow key={rowIndex} {...props} />
              case 'one-tall-two':
                return <OneTallTwoRow key={rowIndex} {...props} />
              case 'two-one-tall':
                return <TwoOneTallRow key={rowIndex} {...props} />
              case 'three-equal':
                return <ThreeEqualRow key={rowIndex} {...props} />
              case 'wide-two':
                return <WideTwoRow key={rowIndex} {...props} />
              case 'single':
                return <SingleRow key={rowIndex} {...props} />
              default:
                return <ThreeEqualRow key={rowIndex} {...props} />
            }
          })}
        </div>
      </section>

      {/* Footer - Editorial minimal */}
      <footer className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          {/* Custom message in elegant italic */}
          {presentation?.customMessage && (
            <p className="text-xl text-white/50 mb-16 italic font-serif max-w-xl mx-auto leading-relaxed">
              "{presentation.customMessage}"
            </p>
          )}
          
          {/* Download CTA - minimal elegant */}
          {downloadEnabled && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-3 px-10 py-4 text-sm font-light tracking-widest uppercase border border-white/20 text-white/80 hover:bg-white hover:text-black transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Download All
              {totalFileSizeBytes && (
                <span className="opacity-50 ml-2">({formatFileSize(totalFileSizeBytes)})</span>
              )}
            </button>
          )}
          
          {/* Fin marker - editorial style */}
          <div className="mt-24 flex flex-col items-center gap-4">
            <div className="w-px h-12 bg-white/10" />
            <p className="text-[10px] text-white/20 uppercase tracking-[0.4em]">
              Fin
            </p>
          </div>
          
          {/* Branding - ultra subtle */}
          <p className="text-[9px] text-white/10 mt-16 uppercase tracking-[0.3em]">
            Crafted with 12img
          </p>
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            {/* Top bar with actions */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
              <span className="text-white/50 text-sm">
                {lightboxIndex + 1} / {images.length}
              </span>
              <div className="flex items-center gap-2">
                {downloadEnabled && lightboxImage && (
                  <ImageDownloadButtonDark imageId={lightboxImage.id} size="md" />
                )}
                <SocialShareButtonsDark
                  imageUrl={lightboxImage.previewUrl || lightboxImage.thumbnailUrl}
                  description={`${displayTitle} | 12img`}
                />
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-3 text-white/60 hover:text-white transition-colors rounded-full bg-white/10 hover:bg-white/20"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev') }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white transition-colors z-10"
              >
                <ChevronDown className="w-8 h-8 rotate-90" />
              </button>
            )}
            {lightboxIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next') }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white transition-colors z-10"
              >
                <ChevronDown className="w-8 h-8 -rotate-90" />
              </button>
            )}

            <motion.div
              key={lightboxImage.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxImage.previewUrl || lightboxImage.thumbnailUrl}
                alt={getSeoAltText(displayTitle, undefined, lightboxIndex + 1)}
                width={lightboxImage.width || 1920}
                height={lightboxImage.height || 1080}
                className="max-w-full max-h-[90vh] object-contain"
                unoptimized
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Download Modal */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        galleryId={galleryId}
        galleryTitle={title}
        imageCount={images.length}
        totalSizeBytes={totalFileSizeBytes}
      />
    </div>
  )
}
