'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight, Download, Share2, X, ZoomIn } from 'lucide-react'
import Link from 'next/link'
import { ImageDownloadButton, ImageDownloadButtonDark } from '@/components/ui/ImageDownloadButton'
import { SocialShareButtons, SocialShareButtonsDark } from '@/components/ui/SocialShareButtons'
import { getSeoAltText } from '@/lib/seo/image-urls'
import type { PresentationData } from '@/lib/types/presentation'

interface AlbumImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
}

interface AlbumViewProps {
  title: string
  images: AlbumImage[]
  downloadEnabled?: boolean
  photographerName?: string
  galleryId?: string
  gallerySlug?: string
  presentation?: PresentationData | null
}

// Spread layout patterns - how images are arranged on each spread
type SpreadLayout = 'single-left' | 'single-right' | 'duo' | 'trio-left' | 'trio-right' | 'quad'

interface Spread {
  layout: SpreadLayout
  images: AlbumImage[]
}

// Generate spreads from images - intelligent layout based on image count and aspect ratios
function generateSpreads(images: AlbumImage[]): Spread[] {
  if (images.length === 0) return []
  
  const spreads: Spread[] = []
  let i = 0
  
  // First spread is always a single hero image on right page
  if (images.length > 0) {
    spreads.push({ layout: 'single-right', images: [images[0]] })
    i = 1
  }
  
  while (i < images.length) {
    const remaining = images.length - i
    
    if (remaining === 1) {
      // Last single image - center it
      spreads.push({ layout: 'single-left', images: [images[i]] })
      i += 1
    } else if (remaining === 2) {
      // Two images - duo spread
      spreads.push({ layout: 'duo', images: [images[i], images[i + 1]] })
      i += 2
    } else if (remaining === 3) {
      // Three images - trio layout
      spreads.push({ layout: 'trio-left', images: [images[i], images[i + 1], images[i + 2]] })
      i += 3
    } else {
      // 4+ images - alternate between layouts for variety
      const spreadIndex = spreads.length
      const pattern = spreadIndex % 4
      
      if (pattern === 0 && remaining >= 2) {
        // Duo spread
        spreads.push({ layout: 'duo', images: [images[i], images[i + 1]] })
        i += 2
      } else if (pattern === 1 && remaining >= 3) {
        // Trio with large on left
        spreads.push({ layout: 'trio-left', images: [images[i], images[i + 1], images[i + 2]] })
        i += 3
      } else if (pattern === 2 && remaining >= 3) {
        // Trio with large on right
        spreads.push({ layout: 'trio-right', images: [images[i], images[i + 1], images[i + 2]] })
        i += 3
      } else if (remaining >= 4) {
        // Quad spread
        spreads.push({ layout: 'quad', images: [images[i], images[i + 1], images[i + 2], images[i + 3]] })
        i += 4
      } else if (remaining >= 2) {
        spreads.push({ layout: 'duo', images: [images[i], images[i + 1]] })
        i += 2
      } else {
        spreads.push({ layout: 'single-left', images: [images[i]] })
        i += 1
      }
    }
  }
  
  return spreads
}

// Individual image component with loading state
function AlbumImage({ 
  image, 
  index, 
  galleryTitle, 
  downloadEnabled,
  onClick,
  className = '',
  priority = false,
}: { 
  image: AlbumImage
  index: number
  galleryTitle: string
  downloadEnabled: boolean
  onClick: () => void
  className?: string
  priority?: boolean
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`relative overflow-hidden cursor-pointer group bg-stone-100 ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
      )}
      <Image
        src={image.previewUrl || image.thumbnailUrl}
        alt={getSeoAltText(galleryTitle, undefined, index + 1)}
        fill
        className={`object-cover transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isHovered ? 'scale-105' : 'scale-100'}`}
        style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
        sizes="(max-width: 768px) 100vw, 50vw"
        loading={priority ? 'eager' : 'lazy'}
        priority={priority}
        onLoad={() => setIsLoaded(true)}
        unoptimized
      />
      
      {/* Zoom indicator */}
      <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <ZoomIn className="w-8 h-8 text-white" />
      </div>
      
      {/* Action buttons */}
      {isHovered && (
        <div 
          className="absolute top-2 right-2 z-10 flex gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {downloadEnabled && <ImageDownloadButton imageId={image.id} size="sm" />}
          {(image.originalUrl || image.previewUrl) && (
            <SocialShareButtons
              imageUrl={image.originalUrl || image.previewUrl}
              description={`${galleryTitle} | 12img`}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  )
}

// Spread component - renders a two-page spread
function SpreadView({
  spread,
  spreadIndex,
  galleryTitle,
  downloadEnabled,
  onImageClick,
  globalImageOffset,
}: {
  spread: Spread
  spreadIndex: number
  galleryTitle: string
  downloadEnabled: boolean
  onImageClick: (index: number) => void
  globalImageOffset: number
}) {
  const isPriority = spreadIndex < 2
  
  // Different layouts for spreads
  switch (spread.layout) {
    case 'single-left':
      return (
        <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
          <div className="relative">
            <AlbumImage
              image={spread.images[0]}
              index={globalImageOffset}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset)}
              className="h-full"
              priority={isPriority}
            />
          </div>
          <div className="bg-stone-50" /> {/* Empty right page */}
        </div>
      )
      
    case 'single-right':
      return (
        <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
          <div className="bg-stone-50" /> {/* Empty left page */}
          <div className="relative">
            <AlbumImage
              image={spread.images[0]}
              index={globalImageOffset}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset)}
              className="h-full"
              priority={isPriority}
            />
          </div>
        </div>
      )
      
    case 'duo':
      return (
        <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
          <AlbumImage
            image={spread.images[0]}
            index={globalImageOffset}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            onClick={() => onImageClick(globalImageOffset)}
            className="h-full"
            priority={isPriority}
          />
          <AlbumImage
            image={spread.images[1]}
            index={globalImageOffset + 1}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            onClick={() => onImageClick(globalImageOffset + 1)}
            className="h-full"
            priority={isPriority}
          />
        </div>
      )
      
    case 'trio-left':
      // Large image on left, two stacked on right
      return (
        <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
          <AlbumImage
            image={spread.images[0]}
            index={globalImageOffset}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            onClick={() => onImageClick(globalImageOffset)}
            className="h-full"
            priority={isPriority}
          />
          <div className="grid grid-rows-2 gap-4 md:gap-8 h-full">
            <AlbumImage
              image={spread.images[1]}
              index={globalImageOffset + 1}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset + 1)}
              className="h-full"
              priority={isPriority}
            />
            <AlbumImage
              image={spread.images[2]}
              index={globalImageOffset + 2}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset + 2)}
              className="h-full"
              priority={isPriority}
            />
          </div>
        </div>
      )
      
    case 'trio-right':
      // Two stacked on left, large image on right
      return (
        <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
          <div className="grid grid-rows-2 gap-4 md:gap-8 h-full">
            <AlbumImage
              image={spread.images[0]}
              index={globalImageOffset}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset)}
              className="h-full"
              priority={isPriority}
            />
            <AlbumImage
              image={spread.images[1]}
              index={globalImageOffset + 1}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset + 1)}
              className="h-full"
              priority={isPriority}
            />
          </div>
          <AlbumImage
            image={spread.images[2]}
            index={globalImageOffset + 2}
            galleryTitle={galleryTitle}
            downloadEnabled={downloadEnabled}
            onClick={() => onImageClick(globalImageOffset + 2)}
            className="h-full"
            priority={isPriority}
          />
        </div>
      )
      
    case 'quad':
      return (
        <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
          <div className="grid grid-rows-2 gap-4 md:gap-8 h-full">
            <AlbumImage
              image={spread.images[0]}
              index={globalImageOffset}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset)}
              className="h-full"
              priority={isPriority}
            />
            <AlbumImage
              image={spread.images[1]}
              index={globalImageOffset + 1}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset + 1)}
              className="h-full"
              priority={isPriority}
            />
          </div>
          <div className="grid grid-rows-2 gap-4 md:gap-8 h-full">
            <AlbumImage
              image={spread.images[2]}
              index={globalImageOffset + 2}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset + 2)}
              className="h-full"
              priority={isPriority}
            />
            <AlbumImage
              image={spread.images[3]}
              index={globalImageOffset + 3}
              galleryTitle={galleryTitle}
              downloadEnabled={downloadEnabled}
              onClick={() => onImageClick(globalImageOffset + 3)}
              className="h-full"
              priority={isPriority}
            />
          </div>
        </div>
      )
      
    default:
      return null
  }
}

// Fullscreen image viewer
function FullscreenViewer({
  images,
  currentIndex,
  onClose,
  onNavigate,
  downloadEnabled,
  galleryTitle,
}: {
  images: AlbumImage[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  downloadEnabled: boolean
  galleryTitle: string
}) {
  const [isLoaded, setIsLoaded] = useState(false)
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
  
  // Reset loaded state when image changes
  useEffect(() => {
    setIsLoaded(false)
  }, [currentIndex])
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Navigation */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1) }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1) }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}
      
      {/* Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <Image
          src={image.originalUrl || image.previewUrl}
          alt={getSeoAltText(galleryTitle, undefined, currentIndex + 1)}
          fill
          className={`object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          unoptimized
          priority
        />
      </div>
      
      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <span className="text-white/70 text-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {downloadEnabled && <ImageDownloadButtonDark imageId={image.id} />}
            {(image.originalUrl || image.previewUrl) && (
              <SocialShareButtonsDark
                imageUrl={image.originalUrl || image.previewUrl}
                description={`${galleryTitle} | 12img`}
              />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Main Album View component
export function AlbumView({
  title,
  images,
  downloadEnabled = false,
  photographerName,
  galleryId,
  gallerySlug,
  presentation,
}: AlbumViewProps) {
  const [currentSpread, setCurrentSpread] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [direction, setDirection] = useState(0) // -1 for prev, 1 for next
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Generate spreads from images
  const spreads = generateSpreads(images)
  const totalSpreads = spreads.length
  
  // Calculate global image offset for current spread
  const getGlobalImageOffset = (spreadIndex: number): number => {
    let offset = 0
    for (let i = 0; i < spreadIndex; i++) {
      offset += spreads[i].images.length
    }
    return offset
  }
  
  // Navigation handlers
  const goToPrevious = useCallback(() => {
    if (currentSpread > 0) {
      setDirection(-1)
      setCurrentSpread(prev => prev - 1)
    }
  }, [currentSpread])
  
  const goToNext = useCallback(() => {
    if (currentSpread < totalSpreads - 1) {
      setDirection(1)
      setCurrentSpread(prev => prev + 1)
    }
  }, [currentSpread, totalSpreads])
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewerOpen) return // Let viewer handle its own keyboard events
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToPrevious, goToNext, viewerOpen])
  
  // Swipe gesture handling
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      goToPrevious()
    } else if (info.offset.x < -threshold) {
      goToNext()
    }
  }
  
  // Image click handler - opens fullscreen viewer
  const handleImageClick = (globalIndex: number) => {
    setViewerIndex(globalIndex)
    setViewerOpen(true)
  }
  
  // Presentation settings - map typography to font class
  const typographyFonts: Record<string, string> = {
    classic: 'font-serif',
    modern: 'font-sans',
    editorial: 'font-serif',
    romantic: 'font-serif',
    minimal: 'font-sans',
  }
  const fontFamily = typographyFonts[presentation?.typography || 'classic'] || 'font-serif'
  
  // Page turn animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  }
  
  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-stone-400 hover:text-stone-600 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className={`${fontFamily} text-lg md:text-xl font-medium text-stone-900`}>
                {title}
              </h1>
              {photographerName && (
                <p className="text-xs text-stone-500">by {photographerName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-sm text-stone-500">
            <span>
              Page {currentSpread + 1} of {totalSpreads}
            </span>
          </div>
        </div>
      </header>
      
      {/* Album Container */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-7xl mx-auto px-4 py-8 md:py-12"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        {/* Book wrapper with shadow */}
        <div className="relative h-full bg-white rounded-sm shadow-[0_10px_60px_-10px_rgba(0,0,0,0.15)] overflow-hidden">
          {/* Page spine shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-transparent via-stone-200/50 to-transparent z-10 pointer-events-none hidden md:block" />
          
          {/* Spread content with animation */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSpread}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              className="absolute inset-0 p-4 md:p-8 lg:p-12 cursor-grab active:cursor-grabbing"
            >
              {spreads[currentSpread] && (
                <SpreadView
                  spread={spreads[currentSpread]}
                  spreadIndex={currentSpread}
                  galleryTitle={title}
                  downloadEnabled={downloadEnabled}
                  onImageClick={handleImageClick}
                  globalImageOffset={getGlobalImageOffset(currentSpread)}
                />
              )}
            </motion.div>
          </AnimatePresence>
          
          {/* Navigation arrows */}
          <button
            onClick={goToPrevious}
            disabled={currentSpread === 0}
            className={`absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white/90 shadow-lg transition-all ${
              currentSpread === 0 
                ? 'opacity-30 cursor-not-allowed' 
                : 'opacity-70 hover:opacity-100 hover:scale-110'
            }`}
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-stone-700" />
          </button>
          
          <button
            onClick={goToNext}
            disabled={currentSpread === totalSpreads - 1}
            className={`absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-3 rounded-full bg-white/90 shadow-lg transition-all ${
              currentSpread === totalSpreads - 1 
                ? 'opacity-30 cursor-not-allowed' 
                : 'opacity-70 hover:opacity-100 hover:scale-110'
            }`}
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-stone-700" />
          </button>
        </div>
        
        {/* Thumbnail strip */}
        <div className="mt-4 md:mt-6">
          <div className="flex items-center justify-center gap-1 md:gap-2 overflow-x-auto py-2 px-4">
            {spreads.map((spread, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentSpread ? 1 : -1)
                  setCurrentSpread(index)
                }}
                className={`relative flex-shrink-0 w-12 h-8 md:w-16 md:h-10 rounded overflow-hidden transition-all ${
                  index === currentSpread 
                    ? 'ring-2 ring-stone-900 scale-110' 
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                {spread.images[0] && (
                  <Image
                    src={spread.images[0].thumbnailUrl || spread.images[0].previewUrl}
                    alt={`Page ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Navigation hints */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full text-white/70 text-xs hidden md:flex items-center gap-4">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">←</kbd>
          <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-[10px]">→</kbd>
          <span className="ml-1">Navigate</span>
        </span>
        <span className="text-white/40">|</span>
        <span>Swipe or click arrows</span>
      </div>
      
      {/* Fullscreen viewer */}
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
