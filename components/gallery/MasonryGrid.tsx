'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MasonryItem } from './MasonryItem'
import { FullscreenViewer } from './FullscreenViewer'

interface Image {
  id: string
  signedUrl: string
  width?: number | null
  height?: number | null
}

interface MasonryGridProps {
  images: Image[]
  editable?: boolean
  galleryId?: string
  galleryTitle?: string
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

const COLUMNS_BY_BREAKPOINT = {
  default: 3,
  sm: 4,
  md: 5,
  lg: 6,
  xl: 8,
}

function getColumnCount(width: number): number {
  if (width >= BREAKPOINTS.xl) return COLUMNS_BY_BREAKPOINT.xl
  if (width >= BREAKPOINTS.lg) return COLUMNS_BY_BREAKPOINT.lg
  if (width >= BREAKPOINTS.md) return COLUMNS_BY_BREAKPOINT.md
  if (width >= BREAKPOINTS.sm) return COLUMNS_BY_BREAKPOINT.sm
  return COLUMNS_BY_BREAKPOINT.default
}

export function MasonryGrid({ images: initialImages, editable = false, galleryId, galleryTitle }: MasonryGridProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(COLUMNS_BY_BREAKPOINT.default)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())

  // Filter out deleted images from props (avoids full state sync flicker)
  const images = useMemo(() => 
    initialImages.filter(img => !deletedIds.has(img.id)),
    [initialImages, deletedIds]
  )

  // Clear deleted IDs when props change (server confirmed deletion)
  useEffect(() => {
    const currentIds = new Set(initialImages.map(img => img.id))
    setDeletedIds(prev => {
      const newSet = new Set<string>()
      prev.forEach(id => {
        if (currentIds.has(id)) newSet.add(id) // Keep if still pending
      })
      return newSet.size !== prev.size ? newSet : prev
    })
  }, [initialImages])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      setColumns(getColumnCount(width))
    })

    observer.observe(container)
    setColumns(getColumnCount(container.offsetWidth))

    return () => observer.disconnect()
  }, [])

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
      <div
        ref={containerRef}
        style={{
          columnCount: columns,
          columnGap: '0.375rem',
        }}
      >
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
        />
      )}
    </>
  )
}
