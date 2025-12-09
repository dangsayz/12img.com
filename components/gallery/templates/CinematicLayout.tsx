/**
 * ============================================================================
 * CINEMATIC LAYOUT - Moody, Dark Gallery Template
 * ============================================================================
 * 
 * Inspired by Pic-Time's dark gallery theme with varied row patterns:
 * - Hero section with image + title side by side
 * - Varied row layouts (4 equal, 1+2 stacked, 2+1 tall, wide span)
 * - Generous spacing (5x normal gaps = ~40px)
 * - Dark/moody color scheme
 * 
 * @see https://pic-time.com for reference
 * ============================================================================
 */

'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X, Download, Share2, Check, Loader2 } from 'lucide-react'
import { SocialShareButtonsDark } from '@/components/ui/SocialShareButtons'
import { ImageDownloadButtonDark } from '@/components/ui/ImageDownloadButton'
import { getSeoAltText } from '@/lib/seo/image-urls'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl?: string
  width?: number
  height?: number
  aspectRatio?: number
  focalX?: number
  focalY?: number
}

interface CinematicLayoutProps {
  images: GalleryImage[]
  galleryName: string
  galleryDate?: string
  photographerName?: string
  onImageClick?: (index: number) => void
  downloadEnabled?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// ROW PATTERN TYPES
// ─────────────────────────────────────────────────────────────────────────────

type RowPattern = 
  | 'four-equal'      // 4 images, equal width
  | 'one-tall-two'    // 1 tall left, 2 stacked right
  | 'two-one-tall'    // 2 stacked left, 1 tall right
  | 'three-equal'     // 3 images, equal width
  | 'wide-two'        // 1 wide top, 2 below
  | 'two-wide'        // 2 top, 1 wide below
  | 'single'          // 1 large image

interface Row {
  pattern: RowPattern
  images: GalleryImage[]
  startIndex: number
}

// ─────────────────────────────────────────────────────────────────────────────
// FULLSCREEN VIEWER (Dark theme)
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
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
        <span className="text-white/60 text-sm">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          {downloadEnabled && (
            <ImageDownloadButtonDark imageId={image.id} />
          )}
          <SocialShareButtonsDark
            imageUrl={image.previewUrl}
            description={`${galleryTitle || 'Photo'} | 12img`}
          />
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-16"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={image.previewUrl}
          alt={getSeoAltText(galleryTitle || 'Photo', undefined, currentIndex + 1)}
          fill
          className="object-contain"
          sizes="100vw"
          priority
        />
      </div>

      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-white rotate-90" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <ChevronDown className="w-6 h-6 text-white -rotate-90" />
        </button>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE CARD (Dark theme)
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
// ROW COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const GAP = 40 // 5x the normal ~8px gap

function FourEqualRow({ images, startIndex, onImageClick, galleryTitle, downloadEnabled }: {
  images: GalleryImage[]
  startIndex: number
  onImageClick: (index: number) => void
  galleryTitle?: string
  downloadEnabled?: boolean
}) {
  return (
    <div className="grid grid-cols-4" style={{ gap: GAP }}>
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
    <div className="grid grid-cols-2" style={{ gap: GAP }}>
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
    <div className="grid grid-cols-2" style={{ gap: GAP }}>
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
      <ImageCard
        image={images[2]}
        index={startIndex + 2}
        onClick={() => onImageClick(startIndex + 2)}
        galleryTitle={galleryTitle}
        downloadEnabled={downloadEnabled}
        aspectRatio="3/4"
      />
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
    <div className="grid grid-cols-3" style={{ gap: GAP }}>
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
      <div className="grid grid-cols-2" style={{ gap: GAP }}>
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

export function CinematicLayout({ 
  images, 
  galleryName, 
  galleryDate,
  photographerName,
  onImageClick,
  downloadEnabled = true 
}: CinematicLayoutProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [showCopied, setShowCopied] = useState(false)

  // Hero image is first image
  const heroImage = images[0]
  const gridImages = images.slice(1)

  // Generate varied row patterns
  const rows = useMemo(() => {
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
    
    while (i < gridImages.length) {
      const remaining = gridImages.length - i
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
        case 'two-wide':
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
        images: gridImages.slice(i, i + count),
        startIndex: i + 1, // +1 because hero is index 0
      })
      
      i += count
      patternIndex++
    }
    
    return result
  }, [gridImages])

  const openViewer = useCallback((index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

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
              onClick={() => openViewer(0)}
            >
              <Image
                src={heroImage.previewUrl}
                alt={getSeoAltText(galleryName, photographerName, 1)}
                fill
                className="object-cover"
                style={{ 
                  objectPosition: `${heroImage.focalX ?? 50}% ${heroImage.focalY ?? 50}%`,
                }}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
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
            {/* Photographer credit - vertical */}
            {photographerName && (
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-8 lg:mb-12">
                Photos by {photographerName}
              </p>
            )}

            {/* Gallery title */}
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-white/90 mb-4">
              {galleryName}
            </h1>

            {/* Date */}
            {galleryDate && (
              <p className="text-white/50 text-sm tracking-wide">
                {galleryDate}
              </p>
            )}

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
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 transition-colors">
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6 text-white/30" />
          </motion.div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          GRID SECTION - Varied row patterns with generous spacing
          ════════════════════════════════════════════════════════════════════ */}
      <section className="px-8 md:px-16 lg:px-24 pb-24">
        <div className="max-w-[1600px] mx-auto flex flex-col" style={{ gap: GAP }}>
          {rows.map((row, rowIndex) => {
            const props = {
              images: row.images,
              startIndex: row.startIndex,
              onImageClick: openViewer,
              galleryTitle: galleryName,
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

      {/* ════════════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════════════ */}
      <footer className="py-16 text-center border-t border-white/5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/20">
          {photographerName && `© ${new Date().getFullYear()} ${photographerName}`}
        </p>
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
            galleryTitle={galleryName}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
