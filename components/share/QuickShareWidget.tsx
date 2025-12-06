'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import { 
  Zap, 
  X, 
  Upload, 
  Check, 
  Copy, 
  ExternalLink, 
  RotateCcw,
  Sparkles,
  Mail,
  MessageSquare
} from 'lucide-react'

type Status = 'idle' | 'uploading' | 'success' | 'error'

interface QuickShareWidgetProps {
  className?: string
}

export function QuickShareWidget({ className }: QuickShareWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [shareUrl, setShareUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Spring-based progress for smooth animation
  const progressSpring = useSpring(0, { stiffness: 100, damping: 20 })
  const progressStrokeDashoffset = useTransform(progressSpring, [0, 100], [75.4, 0])
  
  useEffect(() => {
    progressSpring.set(progress)
  }, [progress, progressSpring])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen && status !== 'idle') {
      const timer = setTimeout(() => {
        if (!isOpen) reset()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, status])

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

  const handleUpload = useCallback(async (file: File) => {
    // Validate file size client-side first
    if (file.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10MB')
      setStatus('error')
      return
    }

    setError('')
    setStatus('uploading')
    setProgress(0)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Simulate progress with easing
    let currentProgress = 0
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 15
      setProgress(Math.min(currentProgress, 90))
    }, 150)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/share/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      // Handle non-JSON error responses (e.g., "Request Entity Too Large" from proxy)
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        throw new Error(text.length > 100 ? 'File too large for server' : text || `Upload failed (${response.status})`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setProgress(100)
      await new Promise(resolve => setTimeout(resolve, 300)) // Let animation complete
      setShareUrl(data.url)
      setStatus('success')
    } catch (err) {
      clearInterval(progressInterval)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setStatus('error')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    } else {
      setError('Please drop an image file')
      setStatus('error')
    }
  }, [handleUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set isDragging to false if leaving the dropzone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (rect) {
      const { clientX, clientY } = e
      if (
        clientX < rect.left ||
        clientX > rect.right ||
        clientY < rect.top ||
        clientY > rect.bottom
      ) {
        setIsDragging(false)
      }
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }, [handleUpload])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const reset = () => {
    setStatus('idle')
    setShareUrl('')
    setError('')
    setPreview(null)
    setProgress(0)
    setCopied(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const shareOptions = [
    {
      name: 'Text',
      icon: MessageSquare,
      href: `sms:?&body=Check this out ${shareUrl}`,
      color: 'bg-green-500',
    },
    {
      name: 'Email',
      icon: Mail,
      href: `mailto:?subject=Photo for you&body=Here's something I wanted to share: ${shareUrl}`,
      color: 'bg-blue-500',
    },
    {
      name: 'Copy',
      icon: copied ? Check : Copy,
      onClick: copyToClipboard,
      color: copied ? 'bg-emerald-500' : 'bg-gray-700',
    },
    {
      name: 'Open',
      icon: ExternalLink,
      href: shareUrl,
      external: true,
      color: 'bg-purple-500',
    },
  ]

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 text-gray-700 shadow-lg shadow-gray-900/10 hover:shadow-xl hover:border-gray-300 transition-all ${className}`}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        title="Quick Share"
        aria-label="Open Quick Share"
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Zap className="w-5 h-5" />
        </motion.div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal Container - Responsive positioning */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ 
                type: 'spring', 
                damping: 30, 
                stiffness: 400,
              }}
              className="fixed z-[61] inset-0 flex items-end md:items-center justify-center p-0 md:p-6 pointer-events-none"
            >
              <motion.div
                className="bg-white rounded-t-[28px] md:rounded-[24px] shadow-2xl shadow-black/20 overflow-hidden flex flex-col w-full md:w-[420px] max-h-[90vh] md:max-h-[85vh] pointer-events-auto"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.98 }}
              >
                {/* Header - Always visible, ergonomic close button */}
                <div className="relative px-6 pt-4 pb-3 flex items-center justify-between border-b border-gray-100/80">
                  {/* Drag handle for mobile */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-200 md:hidden" />
                  
                  <div className="flex items-center gap-3 pt-2 md:pt-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">Quick Share</h2>
                      <p className="text-xs text-gray-500">Instant image sharing</p>
                    </div>
                  </div>
                  
                  {/* Close button - Large touch target (48px) */}
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="w-12 h-12 -mr-2 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    whileTap={{ scale: 0.9 }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 pb-6">
                  <AnimatePresence mode="wait">
                    {/* Idle State - Upload Zone */}
                    {status === 'idle' && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div
                          ref={dropZoneRef}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onClick={() => fileInputRef.current?.click()}
                          className={`
                            relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200
                            ${isDragging 
                              ? 'border-orange-400 bg-orange-50 scale-[1.02]' 
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50'
                            }
                          `}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handleFileSelect}
                            className="hidden"
                          />

                          {/* Upload zone content */}
                          <div className="flex flex-col items-center justify-center py-8 px-4">
                            <motion.div 
                              className={`
                                w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors
                                ${isDragging ? 'bg-orange-100' : 'bg-gray-100'}
                              `}
                              animate={{ 
                                scale: isDragging ? 1.1 : 1,
                                rotate: isDragging ? 5 : 0
                              }}
                              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                            >
                              <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} />
                            </motion.div>
                            
                            <p className="text-gray-900 font-medium text-center mb-1">
                              {isDragging ? 'Drop to upload' : 'Drop image or tap to browse'}
                            </p>
                            <p className="text-gray-400 text-sm text-center">
                              JPG, PNG, WebP, GIF up to 10MB
                            </p>
                          </div>

                          {/* Animated border when dragging */}
                          <AnimatePresence>
                            {isDragging && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 rounded-2xl border-2 border-orange-400 pointer-events-none"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(251,146,60,0.1) 0%, rgba(251,146,60,0.05) 100%)'
                                }}
                              />
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Features badges */}
                        <div className="flex items-center justify-center gap-3 mt-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            No sign-up
                          </span>
                          <span>•</span>
                          <span>Instant link</span>
                          <span>•</span>
                          <span>Free forever</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Uploading State */}
                    {status === 'uploading' && (
                      <motion.div
                        key="uploading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center py-8"
                      >
                        {/* Preview with loading overlay */}
                        <div className="relative mb-6">
                          {preview && (
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-32 h-32 rounded-2xl overflow-hidden shadow-xl shadow-gray-900/10 bg-gray-100"
                            >
                              <img
                                src={preview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                              {/* Shimmer overlay */}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            </motion.div>
                          )}
                          
                          {/* Circular progress indicator */}
                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
                            <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                              <circle
                                cx="16"
                                cy="16"
                                r="12"
                                fill="none"
                                stroke="#e5e7eb"
                                strokeWidth="3"
                              />
                              <motion.circle
                                cx="16"
                                cy="16"
                                r="12"
                                fill="none"
                                stroke="url(#progress-gradient)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={75.4}
                                style={{ strokeDashoffset: progressStrokeDashoffset }}
                              />
                              <defs>
                                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#f59e0b" />
                                  <stop offset="100%" stopColor="#f97316" />
                                </linearGradient>
                              </defs>
                            </svg>
                          </div>
                        </div>

                        <p className="text-gray-900 font-medium mb-1">Uploading...</p>
                        <motion.p 
                          className="text-gray-400 text-sm tabular-nums"
                          key={Math.floor(progress)}
                        >
                          {Math.floor(progress)}%
                        </motion.p>
                      </motion.div>
                    )}

                    {/* Success State - Compact, no scroll */}
                    {status === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col"
                      >
                        {/* Preview with floating success badge */}
                        {preview && (
                          <motion.div 
                            className="relative flex justify-center mb-4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                          >
                            <div className="relative max-w-[160px] max-h-[180px] rounded-2xl overflow-hidden shadow-xl bg-gray-100">
                              <img
                                src={preview}
                                alt="Uploaded"
                                className="w-full h-full object-contain"
                              />
                              {/* Success badge overlay */}
                              <motion.div
                                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
                              >
                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                              </motion.div>
                            </div>
                          </motion.div>
                        )}

                        {/* Compact URL bar with integrated copy */}
                        <motion.div
                          className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <div className="flex-1 truncate text-sm text-gray-600 font-mono">
                            {shareUrl.replace('https://', '')}
                          </div>
                          <motion.button
                            onClick={copyToClipboard}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              copied 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            {copied ? 'Copied!' : 'Copy'}
                          </motion.button>
                        </motion.div>

                        {/* Share buttons - Compact horizontal row */}
                        <motion.div 
                          className="flex items-center justify-center gap-3 mb-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          {shareOptions.filter(o => o.name !== 'Copy').map((option, index) => {
                            const Icon = option.icon
                            const button = (
                              <motion.div 
                                className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center shadow-md`}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Icon className="w-5 h-5 text-white" />
                              </motion.div>
                            )

                            if (option.onClick) {
                              return (
                                <button key={option.name} onClick={option.onClick} className="focus:outline-none">
                                  {button}
                                </button>
                              )
                            }

                            return (
                              <a
                                key={option.name}
                                href={option.href}
                                target={option.external ? '_blank' : undefined}
                                rel={option.external ? 'noopener noreferrer' : undefined}
                                className="focus:outline-none"
                              >
                                {button}
                              </a>
                            )
                          })}
                        </motion.div>

                        {/* Upload another - Subtle link style */}
                        <motion.button
                          onClick={reset}
                          className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.25 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Upload another
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Error State */}
                    {status === 'error' && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center py-8"
                      >
                        <motion.div
                          className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          <X className="w-8 h-8 text-red-500" />
                        </motion.div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Upload failed
                        </h3>
                        <p className="text-gray-500 text-sm text-center mb-6 max-w-[280px]">
                          {error}
                        </p>
                        
                        <motion.button
                          onClick={reset}
                          className="px-6 py-3 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <RotateCcw className="w-4 h-4" />
                          Try again
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Safe area padding for mobile */}
                <div className="shrink-0 h-[max(env(safe-area-inset-bottom,0px),8px)] md:h-2" />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Global styles for shimmer animation */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </>
  )
}
