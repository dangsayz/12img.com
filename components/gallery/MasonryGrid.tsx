'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

export function MasonryGrid({ images, editable = false }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(COLUMNS_BY_BREAKPOINT.default)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

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
          />
        ))}
      </div>

      {viewerOpen && (
        <FullscreenViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={handleViewerClose}
          onNavigate={handleViewerNavigate}
        />
      )}
    </>
  )
}
