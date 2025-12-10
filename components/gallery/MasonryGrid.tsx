'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MasonryItem } from './MasonryItem'
import { FullscreenViewer } from './FullscreenViewer'
import type { ProcessingStatus } from '@/types/database'
import type { ImageDerivatives } from '@/lib/storage/signed-urls'

// Legacy interface for backward compatibility
interface LegacyImage {
  id: string
  storagePath?: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width?: number | null
  height?: number | null
}

// New interface with derivatives support
export interface GalleryImage {
  id: string
  storagePath?: string
  width?: number | null
  height?: number | null
  processingStatus?: ProcessingStatus
  // New derivative-based URLs
  derivatives?: ImageDerivatives
  // Legacy URLs (for backward compatibility)
  thumbnailUrl?: string
  previewUrl?: string
  originalUrl?: string
}

// Normalize image to ensure we have the URLs we need
function normalizeImage(image: GalleryImage): GalleryImage & { thumbnailUrl: string; previewUrl: string; originalUrl: string } {
  if (image.derivatives) {
    return {
      ...image,
      thumbnailUrl: image.derivatives.sm || image.derivatives.xs || image.derivatives.original,
      previewUrl: image.derivatives.lg || image.derivatives.md || image.derivatives.original,
      originalUrl: image.derivatives.original,
    }
  }
  return {
    ...image,
    thumbnailUrl: image.thumbnailUrl || '',
    previewUrl: image.previewUrl || '',
    originalUrl: image.originalUrl || '',
  }
}

interface MasonryGridProps {
  images: GalleryImage[]
  editable?: boolean
  galleryId?: string
  galleryTitle?: string
  /** Show Pinterest share on image hover (for public galleries) */
  showPinterestShare?: boolean
}

export function MasonryGrid({ images: initialImages, editable = false, galleryId, galleryTitle, showPinterestShare = false }: MasonryGridProps) {
  const router = useRouter()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Filter out deleted images and normalize for consistent URL access
  const images = useMemo(() => 
    initialImages
      .filter(img => !deletedIds.has(img.id))
      .map(normalizeImage),
    [initialImages, deletedIds]
  )

  const handleImageDelete = useCallback((imageId: string) => {
    // Optimistic update - mark as deleted immediately
    setDeletedIds(prev => new Set(prev).add(imageId))
    // Delay refresh to avoid layout thrash - server already deleted
    setTimeout(() => router.refresh(), 2000)
  }, [router])

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

  return (
    <>
      {/* True CSS columns masonry - images flow vertically with natural aspect ratios */}
      <div className="columns-2 sm:columns-3 gap-6 sm:gap-8 lg:gap-10 py-8 px-2">
        {images.map((image, index) => (
          <MasonryItem
            key={image.id}
            image={image}
            index={index}
            onClick={() => handleImageClick(index)}
            editable={editable}
            galleryId={galleryId}
            galleryTitle={galleryTitle}
            onDelete={handleImageDelete}
            showPinterestShare={showPinterestShare}
          />
        ))}
      </div>

      {viewerOpen && (
        <FullscreenViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={handleViewerClose}
          onNavigate={handleViewerNavigate}
          galleryTitle={galleryTitle}
          gallerySlug={galleryId}
        />
      )}
    </>
  )
}
