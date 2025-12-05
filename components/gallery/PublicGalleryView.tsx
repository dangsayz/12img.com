'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Download, ChevronDown, Share2, Check, Loader2 } from 'lucide-react'
import { FullscreenViewer } from './FullscreenViewer'

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

// Shimmer loading skeleton
function ImageSkeleton({ aspectRatio }: { aspectRatio: number }) {
  return (
    <div 
      className="bg-neutral-200 rounded-sm animate-pulse"
      style={{ aspectRatio: aspectRatio || 1 }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  )
}

// Visual psychology-based image card
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
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [isLoaded, setIsLoaded] = useState(false)
  
  const aspectRatio = image.width && image.height ? image.width / image.height : 1
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
      transition={{ 
        duration: 0.8, 
        delay: priority ? 0 : Math.min(index * 0.08, 0.4),
        ease: [0.22, 1, 0.36, 1]
      }}
      className="group relative"
    >
      <div 
        className="relative overflow-hidden cursor-pointer"
        onClick={onClick}
      >
        {/* Image with natural aspect ratio */}
        <div className="relative overflow-hidden rounded-sm bg-neutral-100">
          {/* Loading skeleton */}
          {!isLoaded && (
            <div 
              className="absolute inset-0 bg-neutral-200 animate-pulse"
              style={{ aspectRatio: aspectRatio || 'auto' }}
            />
          )}
          
          <img
            src={image.signedUrl}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setIsLoaded(true)}
            className={`w-full h-auto object-cover transition-all duration-700 ease-out group-hover:scale-[1.02] ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ aspectRatio: aspectRatio || 'auto' }}
          />
          
          {/* Subtle hover vignette */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
        </div>
      </div>
    </motion.div>
  )
}

// Hero section image with parallax
function HeroImage({ image, title }: { image: Image; title: string }) {
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 400], [1, 0])
  const scale = useTransform(scrollY, [0, 500], [1, 1.1])
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <section className="relative h-[85vh] sm:h-screen overflow-hidden bg-neutral-900">
      {/* Loading state */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}
      
      {/* Parallax background */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <img
          src={image.signedUrl}
          alt=""
          className={`w-full h-full object-cover transition-opacity duration-700 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        {/* Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/70" />
      </motion.div>
      
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

export function PublicGalleryView({ 
  title, 
  images, 
  downloadEnabled = false,
  photographerName 
}: PublicGalleryViewProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [showCopied, setShowCopied] = useState(false)

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

  // Download all images
  const handleDownloadAll = useCallback(async () => {
    if (isDownloading) return
    
    setIsDownloading(true)
    setDownloadProgress(0)
    
    try {
      // Download images one by one with progress
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        const response = await fetch(image.signedUrl)
        const blob = await response.blob()
        
        // Create download link
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${i + 1}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        setDownloadProgress(Math.round(((i + 1) / images.length) * 100))
        
        // Small delay between downloads to prevent browser blocking
        if (i < images.length - 1) {
          await new Promise(r => setTimeout(r, 300))
        }
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
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

  // Get cover image (first image)
  const coverImage = images[0]
  const galleryImages = images.slice(1) // Rest of images for the grid

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section */}
      {coverImage && <HeroImage image={coverImage} title={title} />}

      {/* Minimal sticky header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-100">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="font-serif text-base sm:text-lg text-neutral-900 truncate">{title}</span>
            <span className="text-neutral-300 hidden sm:inline">·</span>
            <span className="text-xs sm:text-sm text-neutral-500 hidden sm:inline">{images.length} images</span>
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
                    <span className="hidden sm:inline">{downloadProgress}%</span>
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
        {/* Section title with elegant serif */}
        <motion.div 
          className="text-center mb-10 sm:mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-neutral-900 font-light tracking-tight mb-3 sm:mb-4">
            The Collection
          </h2>
          <p className="text-neutral-500 text-xs sm:text-sm tracking-wide">
            {images.length > 1 ? 'Tap any image to view in full screen' : 'Tap to view in full screen'}
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
                onClick={() => handleImageClick(index + 1)} // +1 because cover is index 0
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
        />
      )}
    </div>
  )
}
