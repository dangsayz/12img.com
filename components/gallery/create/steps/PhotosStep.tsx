'use client'

import { useRouter } from 'next/navigation'
import { UploadZone } from '@/components/upload/UploadZone'

interface PhotosStepProps {
  galleryId: string
  gallerySlug: string
  onComplete: () => void
}

export function PhotosStep({ galleryId, gallerySlug, onComplete }: PhotosStepProps) {
  const router = useRouter()

  // Go straight to public gallery after upload
  const handleUploadComplete = () => {
    router.push(`/view-reel/${gallerySlug}`)
  }

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
