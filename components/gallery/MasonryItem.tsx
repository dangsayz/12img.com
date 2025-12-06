'use client'

import { useState, useCallback, useTransition } from 'react'
import { Trash2, Star, Loader2 } from 'lucide-react'
import { deleteImage, setCoverImage } from '@/server/actions/image.actions'

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
}

export function MasonryItem({ 
  image, 
  index, 
  onClick, 
  editable,
  galleryId,
  onDelete 
}: MasonryItemProps) {
  const [loaded, setLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleLoad = useCallback(() => {
    setLoaded(true)
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

  const handleSetCover = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!galleryId) return
    
    startTransition(async () => {
      await setCoverImage(galleryId, image.id)
    })
  }, [galleryId, image.id])

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteConfirm(false)
  }, [])

  return (
    <div
      className="overflow-hidden rounded-xl bg-gray-100 relative group"
      onMouseEnter={() => editable && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setShowDeleteConfirm(false)
      }}
    >
      {/* Image - Fixed 3:4 portrait aspect ratio for clean grid */}
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
        className="cursor-pointer relative aspect-[3/4]"
      >
        {hasError || !image.thumbnailUrl ? (
          <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-xs">Failed to load</span>
          </div>
        ) : (
          <>
            <img
              src={image.thumbnailUrl}
              alt=""
              loading={index < 8 ? 'eager' : 'lazy'}
              decoding="async"
              onLoad={handleLoad}
              onError={() => setHasError(true)}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-200 ${
                loaded ? 'opacity-100' : 'opacity-0'
              } ${isHovered && editable ? 'brightness-90 scale-[1.02]' : ''}`}
            />
            {!loaded && <div className="absolute inset-0 bg-gray-100" />}
          </>
        )}
      </div>

      {/* Hover Overlay - Only in edit mode */}
      {editable && isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex gap-1.5 pointer-events-auto">
            {/* Set as Cover */}
            {galleryId && (
              <button
                onClick={handleSetCover}
                disabled={isPending}
                className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center hover:bg-white disabled:opacity-50"
                title="Set as cover"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 text-gray-600 animate-spin" />
                ) : (
                  <Star className="w-3.5 h-3.5 text-gray-600" />
                )}
              </button>
            )}

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
