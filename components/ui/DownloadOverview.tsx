'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, Check, Loader2, X, Image as ImageIcon } from 'lucide-react'
import html2canvas from 'html2canvas'

interface DownloadOverviewProps {
  targetRef: React.RefObject<HTMLElement>
  fileName?: string
  clientName?: string
  variant?: 'button' | 'icon' | 'minimal'
  className?: string
}

export function DownloadOverview({ 
  targetRef, 
  fileName = 'overview',
  clientName,
  variant = 'button',
  className = ''
}: DownloadOverviewProps) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleCapture = async () => {
    if (!targetRef.current || isCapturing) return

    setIsCapturing(true)

    try {
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100))

      const canvas = await html2canvas(targetRef.current, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        // Ignore certain elements during capture
        ignoreElements: (element) => {
          return element.hasAttribute('data-html2canvas-ignore')
        }
      })

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob as Blob)
        }, 'image/jpeg', 0.95)
      })

      // Create download link
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setShowPreview(true)
      
    } catch (error) {
      console.error('Failed to capture:', error)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleDownload = () => {
    if (!previewUrl) return

    const link = document.createElement('a')
    link.href = previewUrl
    const safeName = (clientName || fileName).replace(/[^a-z0-9]/gi, '-').toLowerCase()
    link.download = `${safeName}-overview-${new Date().toISOString().split('T')[0]}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
      setShowPreview(false)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }, 2000)
  }

  const handleClose = () => {
    setShowPreview(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
  }

  // Button variants
  const buttonContent = () => {
    if (isCapturing) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Capturing...</span>
        </>
      )
    }
    
    return (
      <>
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Save Overview</span>
      </>
    )
  }

  return (
    <>
      {/* Trigger Button */}
      {variant === 'button' && (
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className={`inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {buttonContent()}
        </button>
      )}

      {variant === 'icon' && (
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className={`p-2.5 bg-white border border-stone-200 rounded-xl text-stone-600 hover:bg-stone-50 hover:border-stone-300 hover:text-stone-900 transition-all shadow-sm disabled:opacity-50 ${className}`}
          title="Save Overview"
        >
          {isCapturing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </button>
      )}

      {variant === 'minimal' && (
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className={`inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors disabled:opacity-50 ${className}`}
        >
          {isCapturing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Save</span>
        </button>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900">Overview Captured</h3>
                    <p className="text-xs text-stone-500">Preview your image before saving</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              {/* Preview Image */}
              <div className="flex-1 overflow-auto p-4 bg-stone-50">
                <div className="relative rounded-xl overflow-hidden shadow-lg border border-stone-200">
                  <img 
                    src={previewUrl} 
                    alt="Overview preview" 
                    className="w-full h-auto"
                  />
                  {/* Subtle overlay gradient */}
                  <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-xl" />
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-stone-100 bg-white">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-stone-400">
                    High-quality JPEG • {new Date().toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClose}
                      className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={showSuccess}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
                        showSuccess
                          ? 'bg-emerald-500 text-white'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      {showSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
