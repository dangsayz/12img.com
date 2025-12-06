'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Download, X, ChevronLeft, ChevronRight } from 'lucide-react'

interface GridImage {
  id: string
  url: string
  thumbnailUrl: string
  originalUrl: string
  width: number
  height: number
}

interface GridPreviewProps {
  images: GridImage[]
  title: string
  galleryId: string
  gallerySlug: string
  downloadEnabled: boolean
  totalFileSizeBytes: number
}

function distributeImages(images: GridImage[], numCols: number): GridImage[][] {
  const cols: GridImage[][] = Array.from({ length: numCols }, () => [])
  const colHeights: number[] = Array(numCols).fill(0)

  images.forEach((img) => {
    const shortestCol = colHeights.indexOf(Math.min(...colHeights))
    cols[shortestCol].push(img)
    colHeights[shortestCol] += img.height / img.width
  })

  return cols
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function GridPreview({ 
  images, 
  title, 
  galleryId,
  gallerySlug,
  downloadEnabled,
  totalFileSizeBytes 
}: GridPreviewProps) {
  const [numCols, setNumCols] = useState(4)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobilePrompt, setShowMobilePrompt] = useState(false)

  // Responsive column count and mobile detection
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      setIsMobile(width < 768)
      if (width < 640) setNumCols(2)
      else if (width < 1024) setNumCols(3)
      else setNumCols(4)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const columns = useMemo(() => distributeImages(images, numCols), [images, numCols])

  // Flatten columns to get original index
  const flatImages = useMemo(() => {
    const indexMap = new Map<string, number>()
    images.forEach((img, i) => indexMap.set(img.id, i))
    return indexMap
  }, [images])

  const handleImageClick = useCallback((imageId: string) => {
    const index = flatImages.get(imageId)
    if (index !== undefined) {
      setViewerIndex(index)
      setViewerOpen(true)
    }
  }, [flatImages])

  const handleDownloadAll = async () => {
    if (!downloadEnabled || isDownloading) return
    setIsDownloading(true)
    try {
      window.location.href = `/api/download/${galleryId}`
    } finally {
      setTimeout(() => setIsDownloading(false), 2000)
    }
  }

  const handleDownloadSingle = async (url: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!downloadEnabled) return
    window.open(url, '_blank')
  }

  // Keyboard navigation
  useEffect(() => {
    if (!viewerOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewerOpen(false)
      if (e.key === 'ArrowLeft') setViewerIndex(i => i > 0 ? i - 1 : images.length - 1)
      if (e.key === 'ArrowRight') setViewerIndex(i => i < images.length - 1 ? i + 1 : 0)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewerOpen, images.length])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-[1800px] mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium text-gray-900">{title}</h1>
            <p className="text-sm text-gray-400">{images.length} photos</p>
          </div>
          {downloadEnabled && (
            <button
              onClick={() => isMobile ? setShowMobilePrompt(true) : handleDownloadAll()}
              disabled={isDownloading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">
                {isDownloading ? 'Preparing...' : `Download All (${formatFileSize(totalFileSizeBytes)})`}
              </span>
              <span className="sm:hidden">Download</span>
            </button>
          )}
        </div>
      </header>

      {/* Masonry Grid */}
      <main className="max-w-[1800px] mx-auto px-2 py-4">
        <div className="flex gap-2">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex-1 flex flex-col gap-2">
              {column.map((img) => (
                <div
                  key={img.id}
                  onClick={() => handleImageClick(img.id)}
                  className="relative overflow-hidden rounded-2xl bg-gray-100 cursor-pointer group"
                  style={{
                    aspectRatio: `${img.width} / ${img.height}`,
                  }}
                >
                  <Image
                    src={img.thumbnailUrl || img.url}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Hover overlay with download */}
                  {downloadEnabled && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end justify-end p-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => handleDownloadSingle(img.originalUrl, e)}
                        className="p-2 bg-white/90 rounded-full hover:bg-white shadow-lg"
                        title="Download"
                      >
                        <Download className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>

      {/* Fullscreen Viewer */}
      {viewerOpen && images[viewerIndex] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 text-white/70 hover:text-white"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation */}
          <button
            onClick={() => setViewerIndex(i => i > 0 ? i - 1 : images.length - 1)}
            className="absolute left-4 z-10 p-2 text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-10 h-10" />
          </button>
          <button
            onClick={() => setViewerIndex(i => i < images.length - 1 ? i + 1 : 0)}
            className="absolute right-4 z-10 p-2 text-white/70 hover:text-white"
          >
            <ChevronRight className="w-10 h-10" />
          </button>

          {/* Image - Use original quality for crisp fullscreen viewing */}
          <div className="relative w-full h-full flex items-center justify-center p-16">
            <Image
              src={images[viewerIndex].originalUrl}
              alt=""
              fill
              className="object-contain"
              priority
              quality={100}
            />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex items-center justify-between">
            <span className="text-white/70 text-sm">
              {viewerIndex + 1} / {images.length}
            </span>
            {downloadEnabled && (
              <button
                onClick={() => window.open(images[viewerIndex].originalUrl, '_blank')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Download Prompt */}
      {showMobilePrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Download on Desktop
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              For the best experience downloading all {images.length} photos, please visit this gallery on a desktop computer.
            </p>
            <button
              onClick={() => setShowMobilePrompt(false)}
              className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
