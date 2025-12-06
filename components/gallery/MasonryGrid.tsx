'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MasonryItem } from './MasonryItem'
import { FullscreenViewer } from './FullscreenViewer'

interface Image {
  id: string
  storagePath?: string  // For on-demand URL fetching
  thumbnailUrl: string  // 400px for grid display
  previewUrl: string    // 1920px for fullscreen viewing
  originalUrl: string   // Full resolution for downloads only
  width?: number | null
  height?: number | null
}

interface MasonryGridProps {
  images: Image[]
  editable?: boolean
  galleryId?: string
  galleryTitle?: string
}

export function MasonryGrid({ images: initialImages, editable = false, galleryId, galleryTitle }: MasonryGridProps) {
  const router = useRouter()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Filter out deleted images from props (avoids full state sync flicker)
  const images = useMemo(() => 
    initialImages.filter(img => !deletedIds.has(img.id)),
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
      {/* Pinterest-style masonry using CSS columns */}
      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 py-6">
        {images.map((image, index) => (
          <MasonryItem
            key={image.id}
            image={image}
            index={index}
            onClick={() => handleImageClick(index)}
            editable={editable}
            galleryId={galleryId}
            onDelete={handleImageDelete}
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
