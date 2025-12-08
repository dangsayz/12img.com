'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Share2, Copy, Check, Download, X, Loader2, Gift } from 'lucide-react'
import Image from 'next/image'

interface CardData {
  id: string
  url: string
  imageUrl: string
}

export function DemoCardGenerator() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image')
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('Image must be under 50MB')
      return
    }

    setError(null)
    
    // Create local preview immediately
    const localPreview = URL.createObjectURL(file)
    setPreviewUrl(localPreview)
    setIsUploading(true)

    try {
      // Step 1: Get signed upload URL from our API
      const params = new URLSearchParams({
        filename: file.name,
        contentType: file.type,
        fileSize: file.size.toString(),
      })
      
      const prepareRes = await fetch(`/api/demo-card?${params}`)
      const prepareData = await prepareRes.json()
      
      if (!prepareRes.ok) {
        throw new Error(prepareData.error || 'Failed to prepare upload')
      }

      const { id, storagePath, signedUrl } = prepareData

      // Step 2: Upload directly to Supabase Storage (bypasses Vercel limit)
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error('Upload failed. Please try again.')
      }

      // Step 3: Confirm upload and create database record
      const confirmRes = await fetch('/api/demo-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          storagePath,
          filename: file.name,
          fileSize: file.size,
          contentType: file.type,
        }),
      })

      const confirmData = await confirmRes.json()

      if (!confirmRes.ok) {
        throw new Error(confirmData.error || 'Failed to create card')
      }

      // Get public URL for the image
      const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/demo-cards/${storagePath}`
      
      setCardData({
        id: confirmData.id,
        url: confirmData.url,
        imageUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreviewUrl(null)
    } finally {
      setIsUploading(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const copyToClipboard = async () => {
    if (!cardData?.url) return
    await navigator.clipboard.writeText(cardData.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setCardData(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!previewUrl ? (
          // Upload State
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative"
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer
                transition-all duration-300 overflow-hidden group
                ${isDragging 
                  ? 'border-stone-900 bg-stone-100 scale-[1.02]' 
                  : 'border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50'
                }
              `}
            >
              {/* Elegant background pattern */}
              <div className="absolute inset-0 opacity-[0.03]">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -5 } : { scale: 1, y: 0 }}
                  className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 group-hover:bg-stone-200 transition-colors"
                >
                  <Upload className={`w-7 h-7 transition-colors ${isDragging ? 'text-stone-900' : 'text-stone-400 group-hover:text-stone-600'}`} />
                </motion.div>
                
                <h3 className="text-lg font-medium text-stone-900 mb-1">
                  Drop your photo here
                </h3>
                <p className="text-sm text-stone-500 text-center">
                  or <span className="underline decoration-stone-300 hover:text-stone-700">browse files</span>
                </p>
                
                <div className="mt-4 flex items-center gap-2 text-xs text-stone-400">
                  <Gift className="w-3.5 h-3.5" />
                  <span>Free beautiful card to share</span>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-sm text-red-600 text-center"
              >
                {error}
              </motion.p>
            )}
          </motion.div>
        ) : (
          // Card Preview State
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {/* Beautiful Print Card Mockup */}
            <div className="relative aspect-[4/3] bg-gradient-to-br from-stone-100 via-stone-50 to-white rounded-2xl overflow-hidden">
              {/* Subtle shadow/depth effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-200/50 to-transparent" />
              
              {/* The "print" card with 3D effect */}
              <div 
                className="absolute inset-4 sm:inset-6 lg:inset-8"
                style={{
                  perspective: '1000px',
                }}
              >
                <motion.div
                  initial={{ rotateX: 15, rotateY: -5 }}
                  animate={{ rotateX: 5, rotateY: -2 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="relative w-full h-full"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Paper stack effect */}
                  <div className="absolute -bottom-1 -right-1 w-full h-full bg-white rounded-sm shadow-sm border border-stone-200/50" />
                  <div className="absolute -bottom-2 -right-2 w-full h-full bg-white rounded-sm shadow-sm border border-stone-200/30" />
                  
                  {/* Main card */}
                  <div className="relative w-full h-full bg-white rounded-sm shadow-xl border border-stone-100 overflow-hidden">
                    {/* White mat/border around image */}
                    <div className="absolute inset-0 p-3 sm:p-4 lg:p-6">
                      <div className="relative w-full h-full rounded-sm overflow-hidden bg-stone-100">
                        {previewUrl && (
                          <Image
                            src={previewUrl}
                            alt="Your photo"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                        
                        {/* Loading overlay */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 text-stone-600 animate-spin" />
                              <span className="text-sm text-stone-600 font-medium">Creating your card...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Subtle paper texture */}
                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                      <div className="w-full h-full" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                      }} />
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* 12img watermark */}
              <div className="absolute bottom-2 right-3 flex items-center gap-1 opacity-40">
                <div className="w-4 h-4 rounded-full bg-stone-900 flex items-center justify-center">
                  <span className="text-white font-bold text-[6px]">12</span>
                </div>
                <span className="text-[10px] font-medium text-stone-600">img</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 space-y-3">
              {cardData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Link
                      </>
                    )}
                  </button>
                  
                  <a
                    href={cardData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-medium rounded-xl transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    View
                  </a>
                </motion.div>
              )}
              
              <button
                onClick={reset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-stone-500 hover:text-stone-700 text-sm transition-colors"
              >
                <X className="w-4 h-4" />
                Create another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
