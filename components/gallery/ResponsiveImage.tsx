'use client'

import { useState } from 'react'
import type { ImageDerivatives } from '@/lib/storage/signed-urls'
import type { ProcessingStatus } from '@/types/database'

interface ResponsiveImageProps {
  derivatives: ImageDerivatives
  processingStatus?: ProcessingStatus
  alt?: string
  sizes?: string
  priority?: boolean
  className?: string
  onLoad?: () => void
  onClick?: () => void
}

/**
 * Responsive image component that uses srcset for optimal loading
 * 
 * Uses pre-generated derivatives when available, with proper srcset
 * for responsive loading based on viewport and DPR.
 */
export function ResponsiveImage({
  derivatives,
  processingStatus = 'ready',
  alt = '',
  sizes = '100vw',
  priority = false,
  className = '',
  onLoad,
  onClick,
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Build srcset from available derivatives
  const srcsetParts: string[] = []
  
  if (derivatives.xs) srcsetParts.push(`${derivatives.xs} 200w`)
  if (derivatives.sm) srcsetParts.push(`${derivatives.sm} 400w`)
  if (derivatives.md) srcsetParts.push(`${derivatives.md} 800w`)
  if (derivatives.lg) srcsetParts.push(`${derivatives.lg} 1600w`)
  if (derivatives.xl) srcsetParts.push(`${derivatives.xl} 2400w`)

  const srcset = srcsetParts.length > 0 ? srcsetParts.join(', ') : undefined

  // Determine the best fallback src
  const src = derivatives.sm || derivatives.md || derivatives.lg || derivatives.original

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
  }

  // Show processing indicator if still processing
  if (processingStatus === 'processing' || processingStatus === 'pending') {
    return (
      <div 
        className={`relative bg-gray-100 flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
          <span className="text-xs">Processing...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (hasError || processingStatus === 'failed') {
    return (
      <div 
        className={`relative bg-gray-100 flex items-center justify-center ${className}`}
        onClick={onClick}
      >
        <div className="flex flex-col items-center gap-2 text-gray-400">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs">Failed to load</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} onClick={onClick}>
      {/* Loading placeholder */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
      
      {/* Actual image */}
      <img
        src={src}
        srcSet={srcset}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}

/**
 * Thumbnail variant optimized for grid display
 */
export function ThumbnailImage({
  derivatives,
  processingStatus,
  alt = '',
  className = '',
  onClick,
}: Omit<ResponsiveImageProps, 'sizes' | 'priority'>) {
  return (
    <ResponsiveImage
      derivatives={derivatives}
      processingStatus={processingStatus}
      alt={alt}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className={className}
      onClick={onClick}
    />
  )
}

/**
 * Lightbox variant optimized for fullscreen display
 */
export function LightboxImage({
  derivatives,
  processingStatus,
  alt = '',
  className = '',
  onLoad,
}: Omit<ResponsiveImageProps, 'sizes' | 'onClick'>) {
  return (
    <ResponsiveImage
      derivatives={derivatives}
      processingStatus={processingStatus}
      alt={alt}
      sizes="100vw"
      priority
      className={className}
      onLoad={onLoad}
    />
  )
}
