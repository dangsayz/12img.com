'use client'

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Upload, X } from 'lucide-react'

type Status = 'idle' | 'uploading' | 'success' | 'error'

export default function SharePage() {
  const [status, setStatus] = useState<Status>('idle')
  const [progress, setProgress] = useState(0)
  const [shareUrl, setShareUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(async (file: File) => {
    // Reset state
    setError('')
    setStatus('uploading')
    setProgress(0)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Simulate progress (real progress would need XMLHttpRequest)
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90))
    }, 100)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/share/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setProgress(100)
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
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleUpload(file)
    } else {
      setError('Please drop an image file')
      setStatus('error')
    }
  }, [handleUpload])

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <header className="py-6 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">12</span>
            </div>
            <span className="text-neutral-600 font-medium">img</span>
          </Link>
          <Link
            href="/sign-up"
            className="text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Create galleries →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-12 sm:py-20">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-neutral-900 mb-3">
            Quick Share
          </h1>
          <p className="text-neutral-500 mb-10">
            Upload an image, get a link. No sign-up required.
          </p>

          {/* Upload Area */}
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`
                  relative border-2 border-dashed rounded-2xl p-12 sm:p-16 transition-colors cursor-pointer
                  ${isDragging 
                    ? 'border-neutral-900 bg-neutral-50' 
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }
                `}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-neutral-900 font-medium">
                      Drop image here or click to upload
                    </p>
                    <p className="text-neutral-400 text-sm mt-1">
                      JPG, PNG, WebP, GIF up to 10MB
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {status === 'uploading' && (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-neutral-200 rounded-2xl p-8 sm:p-12"
              >
                {preview && (
                  <div className="mb-6">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-xl mx-auto"
                    />
                  </div>
                )}
                <div className="w-full bg-neutral-100 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-neutral-900 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-neutral-600 text-sm">Uploading... {progress}%</p>
              </motion.div>
            )}

            {status === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8"
              >
                {/* 3:4 Vertical Image Preview */}
                {preview && (
                  <div className="mb-6">
                    <div className="relative w-48 mx-auto aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-neutral-100">
                      <img
                        src={preview}
                        alt="Uploaded"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                <p className="text-neutral-900 font-medium mb-4">
                  Ready to share
                </p>

                {/* Copy Link */}
                <button
                  onClick={copyToClipboard}
                  className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors mb-4"
                >
                  {copied ? 'Copied to clipboard' : 'Copy link'}
                </button>

                {/* Share Options - Text only, no icons */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <a
                    href={`sms:?&body=Check this out ${shareUrl}`}
                    className="py-2.5 px-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors text-center"
                  >
                    Text
                  </a>
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors text-center"
                  >
                    Facebook
                  </a>
                  <a
                    href={`https://x.com/intent/tweet?text=Shared via 12img.com&url=${encodeURIComponent(shareUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors text-center"
                  >
                    X
                  </a>
                  <a
                    href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=Shared via 12img.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors text-center"
                  >
                    Pinterest
                  </a>
                  <a
                    href={`mailto:?subject=Photo for you&body=Here's something I wanted to share: ${shareUrl}`}
                    className="py-2.5 px-3 bg-neutral-100 text-neutral-700 rounded-xl text-sm font-medium hover:bg-neutral-200 transition-colors text-center col-span-2"
                  >
                    Email
                  </a>
                </div>

                {/* Secondary actions */}
                <div className="flex items-center justify-center gap-4 text-sm">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Open link
                  </a>
                  <span className="text-neutral-300">|</span>
                  <button
                    onClick={reset}
                    className="text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Upload another
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-red-200 rounded-2xl p-8 sm:p-12"
              >
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                  Upload failed
                </h2>
                <p className="text-neutral-500 mb-6">{error}</p>
                <button
                  onClick={reset}
                  className="px-5 py-2.5 bg-neutral-900 text-white rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors"
                >
                  Try again
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Info */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
            <span>No sign-up</span>
            <span className="text-neutral-300">·</span>
            <span>Instant link</span>
            <span className="text-neutral-300">·</span>
            <span>Free forever</span>
          </div>
        </div>
      </main>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-neutral-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">
            Need more than quick sharing?
          </h2>
          <p className="text-neutral-500 mb-6">
            Create beautiful galleries for your photography clients.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex px-6 py-3 bg-neutral-900 text-white rounded-full font-medium hover:bg-neutral-800 transition-colors"
          >
            Get Started — Free
          </Link>
        </div>
      </section>
    </div>
  )
}
