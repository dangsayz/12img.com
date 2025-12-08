'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { UploadZone } from '@/components/upload/UploadZone'

interface PhotosStepProps {
  galleryId: string
  onComplete: () => void
}

export function PhotosStep({ galleryId, onComplete }: PhotosStepProps) {
  const router = useRouter()
  const [hasUploaded, setHasUploaded] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(2)

  const handleUploadComplete = () => {
    setHasUploaded(true)
  }

  // Auto-redirect to gallery after upload completes
  useEffect(() => {
    if (!hasUploaded) return

    const timer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasUploaded])

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (hasUploaded && redirectCountdown === 0) {
      router.push(`/gallery/${galleryId}`)
    }
  }, [hasUploaded, redirectCountdown, galleryId, router])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-serif text-stone-900 mb-2">
          Add your photos
        </h1>
        <p className="text-stone-500">
          Drag and drop your images or click to browse
        </p>
      </div>

      {/* Upload Zone - Uses the existing fast upload system */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <UploadZone 
          galleryId={galleryId} 
          onUploadComplete={handleUploadComplete}
        />
      </div>

      {/* Success Message - Auto redirects */}
      {hasUploaded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-emerald-900">Photos uploaded!</p>
            <p className="text-sm text-emerald-700">Taking you to your gallery...</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">{redirectCountdown}s</span>
          </div>
        </motion.div>
      )}

      {/* Skip Option */}
      <div className="text-center">
        <button
          onClick={onComplete}
          className="text-sm text-stone-400 hover:text-stone-600 underline underline-offset-4"
        >
          Skip for now, add photos later
        </button>
      </div>
    </div>
  )
}
