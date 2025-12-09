'use client'

import { useState, useCallback, useRef, useEffect, memo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, ChevronDown } from 'lucide-react'
import { SocialShareButtons, SocialShareButtonsDark } from '@/components/ui/SocialShareButtons'
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

interface VirtualizedGalleryProps {
  title: string
  images: GalleryImage[]
  downloadEnabled?: boolean
  galleryId?: string
}

// Memoized image card - prevents re-renders
const ImageCard = memo(function ImageCard({
  image,
  index,
  onClick,
  galleryTitle,
  downloadEnabled,
}: {
  image: GalleryImage
  index: number
  onClick: () => void
  galleryTitle: string
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
      {/* Skeleton placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
      )}
      
      <Image
        src={image.thumbnailUrl}
        alt={getSeoAltText(galleryTitle, undefined, index + 1)}
        fill
        className={`object-cover transition-all duration-500 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        } group-hover:scale-[1.02]`}
        style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        onLoad={() => setIsLoaded(true)}
        // Critical: Only eager load first 8 images
        loading={index < 8 ? 'eager' : 'lazy'}
        // Priority only for first 4
        priority={index < 4}
      />
      
      {/* Hover overlay */}
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
              description={`${galleryTitle} | 12img`}
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  )
})

// Fullscreen viewer - memoized
const FullscreenViewer = memo(function FullscreenViewer({
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
  galleryTitle: string
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
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {downloadEnabled && (
          <ImageDownloadButtonDark imageId={image.id} size="md" />
        )}
        {image.previewUrl && (
          <SocialShareButtonsDark
            imageUrl={image.previewUrl}
            description={`${galleryTitle} | 12img`}
          />
        )}
        <button
          onClick={onClose}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-16">
        <Image
          key={image.id}
          src={image.previewUrl}
          alt={getSeoAltText(galleryTitle, undefined, currentIndex + 1)}
          fill
          className="object-contain"
          style={{ objectPosition: `${image.focalX ?? 50}% ${image.focalY ?? 50}%` }}
          priority
          sizes="100vw"
        />
      </div>

      {/* Navigation */}
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

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </motion.div>
  )
})

/**
 * High-performance gallery for large image sets (500+ images)
 * 
 * Optimizations:
 * 1. Memoized components prevent unnecessary re-renders
 * 2. CSS Grid instead of Framer Motion for layout (no JS layout calculations)
 * 3. Native lazy loading with priority hints
 * 4. Skeleton placeholders (no layout shift)
 * 5. Keyboard navigation in viewer
 */
export function VirtualizedGallery({
  title,
  images,
  downloadEnabled = false,
  galleryId,
}: VirtualizedGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

  const openViewer = useCallback((index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])

  const closeViewer = useCallback(() => {
    setViewerOpen(false)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-[2000px] mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium text-stone-900 truncate">{title}</h1>
          <span className="text-sm text-stone-400">{images.length} photos</span>
        </div>
      </header>

      {/* Grid - Pure CSS, no JS layout */}
      <main className="max-w-[2000px] mx-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          {images.map((image, idx) => (
            <ImageCard
              key={image.id}
              image={image}
              index={idx}
              onClick={() => openViewer(idx)}
              galleryTitle={title}
              downloadEnabled={downloadEnabled}
            />
          ))}
        </div>
      </main>

      {/* Fullscreen Viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <FullscreenViewer
            images={images}
            currentIndex={viewerIndex}
            onClose={closeViewer}
            onNavigate={setViewerIndex}
            downloadEnabled={downloadEnabled}
            galleryTitle={title}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
