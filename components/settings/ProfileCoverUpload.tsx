'use client'

import { useState, useRef, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Camera, Loader2, Trash2 } from 'lucide-react'
import { uploadProfileCover, removeProfileCover } from '@/server/actions/profile.actions'

interface ProfileCoverUploadProps {
  currentCoverUrl: string | null
  displayName: string | null
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ProfileCoverUpload({ currentCoverUrl, displayName }: ProfileCoverUploadProps) {
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadProfileCover(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.url) {
        setCoverUrl(result.url)
      }
    } catch (e) {
      setError('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeProfileCover()
      if (!result.error) {
        setCoverUrl(null)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-stone-900">Profile Cover</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Vertical image (3:4 ratio) shown on the Photographers directory
          </p>
        </div>
      </div>

      {/* Preview Card */}
      <div 
        className={`
          relative aspect-[3/4] max-w-[200px] rounded-lg overflow-hidden border-2 border-dashed transition-all cursor-pointer
          ${isDragging ? 'border-stone-400 bg-stone-100' : 'border-stone-200 hover:border-stone-300'}
          ${isUploading || isPending ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {coverUrl ? (
          <>
            <Image
              src={coverUrl}
              alt="Profile cover"
              fill
              className="object-cover"
              unoptimized
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
            
            {/* Name preview */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-sm font-medium text-white truncate">
                {displayName || 'Your Name'}
              </p>
            </div>

            {/* Hover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center"
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-stone-100 transition-colors"
                >
                  <Camera className="w-4 h-4 text-stone-700" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove() }}
                  className="p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </motion.div>
          </>
        ) : (
          /* Empty state with initials */
          <div className="absolute inset-0 bg-gradient-to-br from-stone-600 to-stone-800 flex flex-col items-center justify-center">
            {/* Initials circle */}
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 mb-3">
              <span className="text-2xl font-serif text-white/80">
                {getInitials(displayName)}
              </span>
            </div>
            
            {/* Upload prompt */}
            <div className="text-center px-4">
              <Upload className="w-5 h-5 text-white/60 mx-auto mb-1" />
              <p className="text-xs text-white/60">
                Drop image or click
              </p>
            </div>

            {/* Name preview */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-sm font-medium text-white/70 truncate text-center">
                {displayName || 'Your Name'}
              </p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        <AnimatePresence>
          {(isUploading || isPending) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-red-500 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Help text */}
      <p className="text-xs text-stone-400">
        Recommended: 600×800px or larger. JPEG, PNG, or WebP. Max 10MB.
      </p>
    </div>
  )
}
