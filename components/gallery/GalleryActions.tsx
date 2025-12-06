'use client'

import { useState, useRef } from 'react'
import { Plus, Download, Loader2, ImageDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { UploadModal } from './UploadModal'
import JSZip from 'jszip'

interface GalleryActionsProps {
  galleryId: string
  gallerySlug: string
  images?: { originalUrl: string; originalFilename?: string }[]  // Uses originalUrl for full-res downloads
  galleryTitle?: string
  totalFileSizeBytes?: number
}

// Format bytes to human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function GalleryActions({ galleryId, gallerySlug, images = [], galleryTitle = 'gallery', totalFileSizeBytes }: GalleryActionsProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0, phase: 'fetching' as 'fetching' | 'zipping' })
  const cancelRef = useRef(false)
  const zipRef = useRef<JSZip | null>(null)

  const handleDownloadZip = async () => {
    if (isDownloading || images.length === 0) return
    setIsDownloading(true)
    setDownloadProgress({ current: 0, total: images.length, phase: 'fetching' })
    cancelRef.current = false
    
    try {
      const zip = new JSZip()
      zipRef.current = zip
      
      // Download each image and add to ZIP
      for (let i = 0; i < images.length; i++) {
        // Check if cancelled
        if (cancelRef.current) break
        
        const image = images[i]
        setDownloadProgress({ current: i + 1, total: images.length, phase: 'fetching' })
        try {
          const response = await fetch(image.originalUrl)
          if (!response.ok) continue
          
          const blob = await response.blob()
          const filename = `${String(i + 1).padStart(3, '0')}_${image.originalFilename || 'image.jpg'}`
          zip.file(filename, blob)
        } catch (err) {
          console.error(`Failed to fetch image ${i + 1}:`, err)
        }
      }
      
      // Generate ZIP and download (even if cancelled, zip what we have)
      setDownloadProgress(prev => ({ ...prev, phase: 'zipping' }))
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${galleryTitle.replace(/[^a-z0-9]/gi, '_')}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="h-9 w-9 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900"
          title="Add Images"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={() => setShowDownloadPrompt(true)}
          disabled={isDownloading || images.length === 0}
          className="h-9 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed px-3"
          title={images.length === 0 ? "No images to download" : "Download ZIP"}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isDownloading 
              ? downloadProgress.phase === 'zipping'
                ? 'Creating ZIP...'
                : `${downloadProgress.current}/${downloadProgress.total}`
              : 'Download ZIP'}
          </span>
        </button>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        galleryId={galleryId}
      />

      {/* Download Confirmation Modal */}
      <AnimatePresence>
        {showDownloadPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            onClick={() => setShowDownloadPrompt(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-white rounded-2xl p-6 text-center shadow-2xl"
            >
              {/* Icon */}
              <div className="mx-auto w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                <ImageDown className="w-7 h-7 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Download Full Album
              </h3>
              <p className="text-gray-500 text-sm mb-5 leading-relaxed">
                {images.length} photos{totalFileSizeBytes ? (
                  <span className="text-gray-700 font-medium"> ({formatFileSize(totalFileSizeBytes)})</span>
                ) : ''} will be downloaded as a ZIP file.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowDownloadPrompt(false)
                    handleDownloadZip()
                  }}
                  disabled={isDownloading}
                  className="w-full py-3 px-5 bg-gray-900 text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isDownloading 
                    ? downloadProgress.phase === 'zipping'
                      ? 'Creating ZIP...'
                      : `Fetching ${downloadProgress.current} of ${downloadProgress.total}...`
                    : `Download ${images.length} Photos`}
                </button>
                <button
                  onClick={() => setShowDownloadPrompt(false)}
                  className="w-full py-2.5 px-5 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Download Progress Banner - Top Right */}
      <AnimatePresence>
        {isDownloading && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-4 right-4 z-[101] bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-200 px-5 py-4 flex items-center gap-4 min-w-[320px]"
          >
            {/* Progress Ring */}
            <div className="relative w-11 h-11 flex-shrink-0">
              <svg className="w-11 h-11 -rotate-90" viewBox="0 0 48 48">
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(downloadProgress.current / downloadProgress.total) * 125.6} 125.6`}
                  className="transition-all duration-300"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
                {Math.round((downloadProgress.current / downloadProgress.total) * 100)}%
              </span>
            </div>
            
            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {downloadProgress.phase === 'zipping' 
                  ? 'Creating ZIP...'
                  : `Downloading ${downloadProgress.current} of ${downloadProgress.total}`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Please keep this window open
              </p>
            </div>
            
            {/* Cancel Button */}
            {downloadProgress.phase === 'fetching' && (
              <button
                onClick={() => {
                  cancelRef.current = true
                }}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Stop and download what's ready"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Standalone upload button for empty state
interface AddImagesButtonProps {
  galleryId: string
  className?: string
}

export function AddImagesButton({ galleryId, className }: AddImagesButtonProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <>
      <Button 
        className={className || "rounded-full h-11 px-6 bg-gray-900 hover:bg-gray-800"}
        onClick={() => setIsUploadModalOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Your First Images
      </Button>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        galleryId={galleryId}
      />
    </>
  )
}
