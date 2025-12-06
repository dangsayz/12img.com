'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Share2, Check, ArrowLeft, X, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface SingleImageViewProps {
  imageUrl: string
  imageWidth?: number | null
  imageHeight?: number | null
  galleryTitle: string
  gallerySlug: string
  imageId: string
  downloadEnabled?: boolean
}

export function SingleImageView({
  imageUrl,
  imageWidth,
  imageHeight,
  galleryTitle,
  gallerySlug,
  imageId,
  downloadEnabled = false,
}: SingleImageViewProps) {
  const [showCopied, setShowCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {
      // Fallback
      const input = document.createElement('input')
      input.value = window.location.href
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (isDownloading) return
    setIsDownloading(true)
    
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${galleryTitle.replace(/[^a-z0-9]/gi, '_')}_${imageId.slice(0, 8)}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }, [imageUrl, galleryTitle, imageId, isDownloading])

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          {/* Left: Back to gallery */}
          <Link
            href={`/g/${gallerySlug}`}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">Back to {galleryTitle}</span>
            <span className="text-sm font-medium sm:hidden">Back</span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <AnimatePresence mode="wait">
                {showCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Check className="w-4 h-4 text-green-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span className="hidden sm:inline">{showCopied ? 'Link Copied!' : 'Share'}</span>
            </button>

            {/* Download button */}
            {downloadEnabled && (
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-white bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-full transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{isDownloading ? 'Downloading...' : 'Download'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Image */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 pt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative max-w-6xl w-full"
        >
          <img
            src={imageUrl}
            alt={galleryTitle}
            onClick={() => setIsFullscreen(true)}
            className="w-full h-auto max-h-[85vh] object-contain cursor-zoom-in rounded-lg"
            style={{
              aspectRatio: imageWidth && imageHeight ? `${imageWidth}/${imageHeight}` : undefined,
            }}
          />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <Link
          href={`/g/${gallerySlug}`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          <span>View full gallery</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
        <div className="mt-3 flex items-center justify-center gap-2">
          <a
            href="https://12img.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-white/40 hover:text-white/60 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">12</span>
            </div>
            <span className="text-xs">Powered by 12img</span>
          </a>
        </div>
      </footer>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={imageUrl}
              alt={galleryTitle}
              className="max-w-full max-h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
