'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Image {
  id: string
  signedUrl: string
}

interface FullscreenViewerProps {
  images: Image[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  galleryTitle?: string
}

export function FullscreenViewer({
  images,
  currentIndex,
  onClose,
  onNavigate,
  galleryTitle = 'image',
}: FullscreenViewerProps) {
  const [mounted, setMounted] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null)
  const currentImage = images[currentIndex]

  // Download image at full resolution
  const handleDownload = useCallback(async () => {
    if (isDownloading) return
    
    setIsDownloading(true)
    
    try {
      // Fetch the image as a blob (full resolution)
      const response = await fetch(currentImage.signedUrl)
      if (!response.ok) throw new Error('Failed to fetch image')
      
      const blob = await response.blob()
      
      // Determine file extension from content type
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.split('/')[1] || 'jpg'
      
      // Create filename
      const safeTitle = galleryTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      const filename = `${safeTitle}_${currentIndex + 1}.${ext}`
      
      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Failed to download image. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }, [currentImage.signedUrl, currentIndex, galleryTitle, isDownloading])

  // Reset states on image change
  useEffect(() => {
    setIsZoomed(false)
    setImageLoaded(false)
  }, [currentIndex])

  // Lock body scroll
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    resetControlsTimer()
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current)
    }
  }, [resetControlsTimer])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetControlsTimer()
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onNavigate('prev')
          break
        case 'ArrowRight':
          onNavigate('next')
          break
        case ' ':
          e.preventDefault()
          setIsZoomed(z => !z)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate, resetControlsTimer])

  // Portal mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Preload adjacent images
  useEffect(() => {
    const preloadIndexes = [
      (currentIndex - 1 + images.length) % images.length,
      (currentIndex + 1) % images.length,
    ]
    preloadIndexes.forEach(i => {
      const img = new window.Image()
      img.src = images[i].signedUrl
    })
  }, [currentIndex, images])

  // Swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || isZoomed) return

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x
      const threshold = 50

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onNavigate('prev')
        } else {
          onNavigate('next')
        }
      }

      touchStart.current = null
    },
    [onNavigate, isZoomed]
  )

  const handleMouseMove = useCallback(() => {
    resetControlsTimer()
  }, [resetControlsTimer])

  if (!mounted) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/95"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onClick={() => resetControlsTimer()}
    >
      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : -20 }}
        transition={{ duration: 0.2 }}
        className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 md:p-6"
      >
        {/* Counter */}
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl text-white text-sm font-medium border border-white/10">
            {currentIndex + 1} <span className="text-white/50">of</span> {images.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(z => !z)}
            className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all duration-200 border border-white/10"
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
          >
            {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDownload()
            }}
            disabled={isDownloading}
            className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all duration-200 border border-white/10 disabled:opacity-50"
            aria-label="Download image"
          >
            {isDownloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full transition-all duration-200 border border-white/10"
            aria-label="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Navigation arrows */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: showControls ? 1 : 0, x: showControls ? 0 : -20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 p-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full hidden md:flex transition-all duration-200 hover:scale-110 border border-white/10"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-6 h-6" />
      </motion.button>

      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: showControls ? 1 : 0, x: showControls ? 0 : 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 p-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full hidden md:flex transition-all duration-200 hover:scale-110 border border-white/10"
        aria-label="Next image"
      >
        <ChevronRight className="w-6 h-6" />
      </motion.button>

      {/* Main image container */}
      <div 
        className="flex items-center justify-center w-full h-full p-4 md:p-20 pt-20 pb-28" 
        onClick={onClose}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: imageLoaded ? 1 : 0, 
              scale: isZoomed ? 1.5 : 1 
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className={`relative max-w-full max-h-full ${isZoomed ? 'cursor-zoom-out overflow-auto' : 'cursor-zoom-in'}`}
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomed(z => !z)
            }}
          >
            {/* Loading skeleton */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
              </div>
            )}
            <img
              src={currentImage.signedUrl}
              alt=""
              className={`max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-300 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ 
                maxHeight: isZoomed ? 'none' : 'calc(100vh - 12rem)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}
              draggable={false}
              onLoad={() => setImageLoaded(true)}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbnail strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: showControls ? 1 : 0, y: showControls ? 0 : 20 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-0 left-0 right-0 z-50 p-4 overflow-x-auto"
      >
        <div className="flex items-center justify-center gap-2 min-w-max px-4">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={(e) => {
                e.stopPropagation()
                const direction = idx > currentIndex ? 'next' : 'prev'
                const steps = Math.abs(idx - currentIndex)
                for (let i = 0; i < steps; i++) {
                  setTimeout(() => onNavigate(direction), i * 50)
                }
              }}
              className={`relative flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                idx === currentIndex 
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50 scale-110' 
                  : 'opacity-50 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img
                src={img.signedUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
