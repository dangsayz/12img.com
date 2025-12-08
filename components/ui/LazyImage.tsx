'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: string
  objectPosition?: string
  priority?: boolean
  onLoad?: () => void
  /** SEO-friendly download filename (e.g., "12img-wedding-photo-001.jpg") */
  downloadFilename?: string
}

/**
 * Fast-loading image component
 * - Starts loading 600px before viewport (aggressive prefetch)
 * - Light neutral placeholder (not black)
 * - Quick fade-in when loaded
 */
export function LazyImage({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-[4/5]',
  objectPosition = '50% 50%',
  priority = false,
  onLoad,
  downloadFilename,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Aggressive prefetch - start loading 600px before viewport
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '600px 0px', // Start loading 600px before entering viewport
        threshold: 0,
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
  }

  // Handle right-click to provide SEO-friendly download
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!downloadFilename) return // Let default behavior happen
    
    // We can't override the native context menu, but we can provide
    // a custom download link. For now, we'll add a data attribute
    // that could be used by a custom context menu in the future.
  }, [downloadFilename])

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden bg-stone-100 ${aspectRatio} ${className}`}
      data-download-filename={downloadFilename}
    >
      {/* Actual image - start loading early */}
      {isInView && !hasError && (
        <a 
          href={src} 
          download={downloadFilename}
          onClick={(e) => e.preventDefault()} // Prevent navigation, allow right-click save
          className="absolute inset-0 block"
          draggable={false}
        >
          <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition }}
            onLoad={handleLoad}
            onError={handleError}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
          />
        </a>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <div className="text-stone-400 text-xs tracking-wider uppercase">
            Unable to load
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hero images - load immediately, no lazy loading
 */
export function HeroImage({
  src,
  alt,
  className = '',
  objectPosition = '50% 50%',
}: Omit<LazyImageProps, 'aspectRatio' | 'priority'>) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ objectPosition }}
        onLoad={() => setIsLoaded(true)}
        loading="eager"
        decoding="async"
      />
    </div>
  )
}
