'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  galleryId: string
  galleryTitle: string
  imageCount: number
  totalSizeBytes?: number
}

// Estimate download time based on file size and typical connection speed
function estimateDownloadTime(sizeBytes: number, imageCount: number): string {
  // Assume ~1.5MB per image average if no size provided (compressed JPEGs)
  const estimatedSize = sizeBytes || imageCount * 1.5 * 1024 * 1024
  
  // Assume 25 Mbps average connection (more realistic for modern connections)
  const bitsPerSecond = 25 * 1000 * 1000
  const bytesPerSecond = bitsPerSecond / 8
  
  // Server processing: ~0.15s per image (parallel fetching + zipping)
  const serverProcessingSeconds = imageCount * 0.15
  const downloadSeconds = estimatedSize / bytesPerSecond
  const totalSeconds = serverProcessingSeconds + downloadSeconds
  
  if (totalSeconds < 30) {
    return 'a few seconds'
  } else if (totalSeconds < 60) {
    return 'less than a minute'
  } else if (totalSeconds < 120) {
    return 'about a minute'
  } else if (totalSeconds < 180) {
    return '2-3 minutes'
  } else if (totalSeconds < 300) {
    return '3-5 minutes'
  } else if (totalSeconds < 600) {
    return '5-10 minutes'
  } else {
    return `about ${Math.ceil(totalSeconds / 60)} minutes`
  }
}

// Encouraging messages to show while waiting
const WAITING_MESSAGES = [
  "Gathering your full-resolution photos...",
  "Preparing your memories in highest quality...",
  "Packaging your beautiful moments...",
  "Almost there, creating your archive...",
  "Wrapping up your gallery...",
]

export function DownloadModal({
  isOpen,
  onClose,
  galleryId,
  galleryTitle,
  imageCount,
  totalSizeBytes,
}: DownloadModalProps) {
  const [status, setStatus] = useState<'idle' | 'preparing' | 'downloading' | 'complete' | 'error'>('idle')
  const [messageIndex, setMessageIndex] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const estimatedTime = estimateDownloadTime(totalSizeBytes || 0, imageCount)

  // Rotate through encouraging messages
  useEffect(() => {
    if (status !== 'preparing' && status !== 'downloading') return
    
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % WAITING_MESSAGES.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [status])

  // Track elapsed time
  useEffect(() => {
    if (status !== 'preparing' && status !== 'downloading') return
    
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [status])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle')
      setMessageIndex(0)
      setElapsedSeconds(0)
      setError(null)
    }
  }, [isOpen])

  const handleDownload = useCallback(async () => {
    setStatus('preparing')
    setElapsedSeconds(0)
    
    try {
      // Start the download
      const response = await fetch(`/api/gallery/${galleryId}/download`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Download failed')
      }
      
      setStatus('downloading')
      
      // Get the blob
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${galleryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-gallery.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      setStatus('complete')
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)
      
    } catch (err) {
      console.error('Download error:', err)
      setError(err instanceof Error ? err.message : 'Download failed')
      setStatus('error')
    }
  }, [galleryId, galleryTitle, onClose])

  const formatElapsedTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && status !== 'preparing' && status !== 'downloading') {
            onClose()
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-medium text-stone-900">Download Gallery</h3>
            {status !== 'preparing' && status !== 'downloading' && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Idle State - Ready to download */}
            {status === 'idle' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="w-8 h-8 text-stone-600" />
                </div>
                <h4 className="text-lg font-medium text-stone-900 mb-2">
                  {galleryTitle}
                </h4>
                <p className="text-sm text-stone-500 mb-1">
                  {imageCount} photos • Full resolution
                </p>
                <p className="text-xs text-stone-400 mb-6">
                  Estimated time: {estimatedTime}
                </p>
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download All Photos
                </button>
              </div>
            )}

            {/* Preparing/Downloading State */}
            {(status === 'preparing' || status === 'downloading') && (
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  {/* Spinning loader */}
                  <motion.div
                    className="absolute inset-0 border-4 border-stone-200 rounded-full"
                    style={{ borderTopColor: '#57534e' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  {/* Center icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Download className="w-6 h-6 text-stone-600" />
                  </div>
                </div>
                
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-stone-700 font-medium mb-2"
                >
                  {WAITING_MESSAGES[messageIndex]}
                </motion.p>
                
                <p className="text-sm text-stone-500 mb-4">
                  {imageCount} full-resolution photos
                </p>
                
                {/* Progress bar (indeterminate) */}
                <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-stone-600 rounded-full"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '40%' }}
                  />
                </div>
                
                <p className="text-xs text-stone-400">
                  Time elapsed: {formatElapsedTime(elapsedSeconds)}
                </p>
                
                <p className="text-xs text-stone-400 mt-2">
                  Please keep this window open
                </p>
              </div>
            )}

            {/* Complete State */}
            {status === 'complete' && (
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </motion.div>
                <h4 className="text-lg font-medium text-stone-900 mb-2">
                  Download Complete!
                </h4>
                <p className="text-sm text-stone-500">
                  Your photos are ready. Check your downloads folder.
                </p>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-lg font-medium text-stone-900 mb-2">
                  Download Failed
                </h4>
                <p className="text-sm text-stone-500 mb-4">
                  {error || 'Something went wrong. Please try again.'}
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
