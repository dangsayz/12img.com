'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import { Trash2, Loader2, RefreshCw } from 'lucide-react'
import { deleteImage } from '@/server/actions/image.actions'
import { getThumbnailUrl } from '@/server/actions/image.actions'

interface Image {
  id: string
  storagePath?: string  // For on-demand URL fetching
  thumbnailUrl: string  // 400px for grid display
  previewUrl: string    // 1920px for fullscreen viewing
  originalUrl: string   // Full resolution for downloads only
  width?: number | null
  height?: number | null
}

interface MasonryItemProps {
  image: Image
  index: number
  onClick: () => void
  editable?: boolean
  galleryId?: string
  onDelete?: (imageId: string) => void
  displacement?: {
    y: number
    rotate: number
  }
}

export function MasonryItem({ 
  image, 
  index, 
  onClick, 
  editable,
  galleryId,
  onDelete,
  displacement 
}: MasonryItemProps) {
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [currentUrl, setCurrentUrl] = useState(image.thumbnailUrl)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Fetch URL if initially empty or retry on error (up to 3 times)
  useEffect(() => {
    const shouldFetch = (!currentUrl && image.storagePath) || (hasError && retryCount < 3 && image.storagePath)
    
    if (shouldFetch) {
      const delay = hasError ? 1000 * (retryCount + 1) : 0 // Immediate for initial, backoff for retries
      const timer = setTimeout(async () => {
        setIsRetrying(true)
        try {
          const result = await getThumbnailUrl(image.storagePath!)
          if (result.url) {
            setCurrentUrl(result.url)
            setHasError(false)
            if (hasError) setRetryCount(prev => prev + 1)
          }
        } catch {
          // Silent fail, will show error state
        }
        setIsRetrying(false)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [hasError, retryCount, image.storagePath, currentUrl])

  const handleLoad = useCallback(() => {
    setLoaded(true)
    setHasError(false)
  }, [])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    
    console.log('[MasonryItem] Starting delete for:', image.id)
    
    startTransition(async () => {
      try {
        const result = await deleteImage(image.id)
        console.log('[MasonryItem] Delete result:', result)
        
        if (result.error) {
          console.error('[MasonryItem] Delete failed:', result.error)
          alert(`Failed to delete: ${result.error}`)
        } else {
          console.log('[MasonryItem] Delete successful, calling onDelete')
          onDelete?.(image.id)
        }
      } catch (err) {
        console.error('[MasonryItem] Delete threw error:', err)
        alert('Failed to delete image. Please try again.')
      }
      setShowDeleteConfirm(false)
    })
  }, [image.id, onDelete, showDeleteConfirm])

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }, [])

  // Vogue-inspired displacement transform
  const displacementStyle = displacement ? {
    transform: `translateY(${displacement.y}px) rotate(${displacement.rotate}deg)`,
  } : {}

  // Calculate aspect ratio for natural sizing
  const aspectRatio = image.width && image.height 
    ? image.width / image.height 
    : 0.75 // Default to 3:4 portrait if dimensions unknown

  return (
    <div
      className="mb-3 sm:mb-4 break-inside-avoid overflow-hidden bg-gray-100 rounded-2xl relative group cursor-pointer"
      style={displacementStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowDeleteConfirm(false)
      }}
    >
      {/* Image wrapper with natural aspect ratio */}
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`View image ${index + 1}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick()
          }
        }}
        className="cursor-pointer relative w-full"
        style={{ aspectRatio: aspectRatio }}
      >
        {(hasError && retryCount >= 3) || (!currentUrl && !isRetrying) ? (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center rounded-2xl">
            <span className="text-gray-400 text-xs">Failed to load</span>
          </div>
        ) : isRetrying || (hasError && retryCount < 3) ? (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-2xl">
            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
          </div>
        ) : (
          <>
            <img
              src={currentUrl}
              alt=""
              loading={index < 20 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={handleLoad}
              onError={() => setHasError(true)}
              className={`w-full h-full object-cover rounded-2xl transition-all duration-300 ${
                loaded ? 'opacity-100' : 'opacity-0'
              } group-hover:brightness-95`}
            />
            {!loaded && (
              <div className="absolute inset-0 bg-gray-100 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-gray-200/60 to-transparent" />
              </div>
            )}
          </>
        )}
      </div>

      {/* Hover Overlay - Only in edit mode */}
      {editable && isHovered && (
        <div className="absolute inset-0 pointer-events-none rounded-2xl">
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1.5 pointer-events-auto">
            {/* Delete Button */}
            <button
              onClick={handleDelete}
              disabled={isPending}
              className={`h-8 rounded-full backdrop-blur-sm shadow-lg flex items-center justify-center disabled:opacity-50 ${
                showDeleteConfirm 
                  ? 'bg-red-500 hover:bg-red-600 px-3 w-auto' 
                  : 'bg-white/90 hover:bg-white hover:scale-110 w-8'
              }`}
              title={showDeleteConfirm ? 'Click again to confirm' : 'Delete image'}
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
              ) : showDeleteConfirm ? (
                <span className="text-xs font-medium text-white px-1">Delete?</span>
              ) : (
                <Trash2 className="w-3.5 h-3.5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Cancel hint when delete confirm is showing */}
          {showDeleteConfirm && (
            <button
              onClick={handleCancelDelete}
              className="absolute bottom-2 right-2 text-xs text-white/80 bg-black/40 px-2 py-1 rounded backdrop-blur-sm pointer-events-auto hover:bg-black/60"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
