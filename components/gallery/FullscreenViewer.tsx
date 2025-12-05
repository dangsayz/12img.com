'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Image {
  id: string
  signedUrl: string
}

interface FullscreenViewerProps {
  images: Image[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
}

export function FullscreenViewer({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: FullscreenViewerProps) {
  const [mounted, setMounted] = useState(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const currentImage = images[currentIndex]

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate])

  // Portal mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Swipe handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }, [])

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return

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
    [onNavigate]
  )

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full transition-all duration-200"
        aria-label="Close viewer"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Navigation arrows (desktop) */}
      <button
        onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full hidden md:flex transition-all duration-200 hover:scale-110"
        aria-label="Previous image"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onNavigate('next'); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 text-white/70 hover:text-white bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full hidden md:flex transition-all duration-200 hover:scale-110"
        aria-label="Next image"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Image container */}
      <div className="flex items-center justify-center w-full h-full p-4 md:p-8" onClick={onClose}>
        <img
          src={currentImage.signedUrl}
          alt=""
          className="max-w-full max-h-full object-contain shadow-2xl"
          draggable={false}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Image counter */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <span className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-md text-white/90 text-sm font-medium border border-white/10">
          {currentIndex + 1} / {images.length}
        </span>
      </div>
    </div>,
    document.body
  )
}
