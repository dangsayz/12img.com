/**
 * ============================================================================
 * SUBMISSION FORM CLIENT
 * ============================================================================
 * 
 * Client component for selecting a photo to submit to the contest.
 * Mobile-first with large touch targets.
 * 
 * @see docs/COMMUNITY_SPOTLIGHT_CHECKLIST.md
 * ============================================================================
 */

'use client'

import { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Loader2, ChevronDown } from 'lucide-react'
import { submitEntry } from '@/server/actions/contest.actions'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'

interface Gallery {
  id: string
  title: string
  images: {
    id: string
    storage_path: string
    width: number | null
    height: number | null
  }[]
}

interface SubmissionFormClientProps {
  contestId: string
  galleries: Gallery[]
}

export function SubmissionFormClient({
  contestId,
  galleries,
}: SubmissionFormClientProps) {
  const router = useRouter()
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(
    galleries.length === 1 ? galleries[0] : null
  )
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imageUrls, setImageUrls] = useState<Map<string, { thumbnail: string; preview: string }>>(new Map())
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  // Auto-load images if only one gallery (pre-selected)
  useEffect(() => {
    if (galleries.length === 1 && selectedGallery && imageUrls.size === 0) {
      handleGallerySelect(galleries[0])
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load image URLs when gallery is selected - batch for performance
  const BATCH_SIZE = 24 // Load 24 at a time for fast initial render
  
  const handleGallerySelect = async (gallery: Gallery) => {
    setSelectedGallery(gallery)
    setSelectedImageId(null)
    setLoadingUrls(true)
    setImageUrls(new Map()) // Clear previous
    
    try {
      // Get signed URLs in batches for better performance
      const allPaths = gallery.images.map(img => img.storage_path)
      const firstBatch = allPaths.slice(0, BATCH_SIZE)
      
      // Load first batch immediately
      const response = await fetch('/api/contest/image-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: firstBatch }),
      })
      
      if (response.ok) {
        const data = await response.json()
        const urlMap = new Map<string, { thumbnail: string; preview: string }>()
        for (const [path, urls] of Object.entries(data.urls)) {
          urlMap.set(path, {
            thumbnail: (urls as any).thumbnail,
            preview: (urls as any).preview,
          })
        }
        setImageUrls(urlMap)
        setLoadingUrls(false)
        
        // Load remaining batches in background
        if (allPaths.length > BATCH_SIZE) {
          loadRemainingImages(allPaths.slice(BATCH_SIZE), urlMap)
        }
      }
    } catch (err) {
      console.error('Failed to load image URLs:', err)
      setLoadingUrls(false)
    }
  }
  
  // Background loader for remaining images
  const loadRemainingImages = async (paths: string[], existingMap: Map<string, { thumbnail: string; preview: string }>) => {
    for (let i = 0; i < paths.length; i += BATCH_SIZE) {
      const batch = paths.slice(i, i + BATCH_SIZE)
      try {
        const response = await fetch('/api/contest/image-urls', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: batch }),
        })
        
        if (response.ok) {
          const data = await response.json()
          const newMap = new Map(existingMap)
          for (const [path, urls] of Object.entries(data.urls)) {
            newMap.set(path, {
              thumbnail: (urls as any).thumbnail,
              preview: (urls as any).preview,
            })
          }
          setImageUrls(newMap)
          existingMap = newMap
        }
      } catch (err) {
        console.error('Failed to load batch:', err)
      }
    }
  }

  const handleSubmit = async () => {
    console.log('[Submit] handleSubmit called, selectedImageId:', selectedImageId)
    if (!selectedImageId) {
      console.log('[Submit] No image selected, returning')
      return
    }
    
    setError(null)
    console.log('[Submit] Calling submitEntry with:', { contestId, selectedImageId, caption })
    
    startTransition(async () => {
      try {
        const result = await submitEntry(contestId, selectedImageId, caption || undefined)
        console.log('[Submit] Result:', result)
        
        console.log('[Submit] result.success:', result.success)
        if (result.success) {
          console.log('[Submit] Setting success to true')
          setShowConfirmation(false) // Hide confirmation first
          setSuccess(true)
          setTimeout(() => {
            console.log('[Submit] Redirecting to contest page')
            router.push(`/contest/${contestId}`)
          }, 2500) // Give more time to see success message
        } else {
          console.log('[Submit] Error:', result.error)
          setError(result.error || 'Failed to submit')
        }
      } catch (err) {
        console.error('[Submit] Error:', err)
        setError('An unexpected error occurred')
      }
    })
  }

  // Get selected image data for confirmation
  const selectedImage = selectedGallery?.images.find(img => img.id === selectedImageId)
  const selectedImageUrls = selectedImage ? imageUrls.get(selectedImage.storage_path) : null
  const selectedImageUrl = selectedImageUrls?.preview || selectedImageUrls?.thumbnail || null

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20"
      >
        {/* Celebratory checkmark */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-24 h-24 mx-auto mb-10 rounded-full bg-stone-900 flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-white" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-light text-stone-900 mb-4"
        >
          You're In
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-stone-600 mb-2"
        >
          Your entry has been submitted successfully.
        </motion.p>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-stone-400 text-sm mb-8"
        >
          Good luck! Winners announced when voting ends.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <button
            onClick={() => router.push(`/contest/${contestId}`)}
            className="px-8 py-3 bg-stone-900 text-white text-sm hover:bg-stone-800 transition-colors"
          >
            View All Entries
          </button>
        </motion.div>
      </motion.div>
    )
  }

  // Confirmation Modal
  if (showConfirmation && selectedImageId && selectedImageUrl) {
    // Calculate actual aspect ratio from image dimensions
    const imgWidth = selectedImage?.width || 4
    const imgHeight = selectedImage?.height || 3
    const aspectRatio = imgWidth / imgHeight
    const isPortrait = aspectRatio < 1
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto"
      >
        {/* Elegant Image Frame */}
        <div className="relative mb-10">
          {/* Image Container - Uses actual aspect ratio */}
          <div 
            className="relative mx-auto"
            style={{ 
              aspectRatio: `${imgWidth} / ${imgHeight}`,
              maxWidth: isPortrait ? '340px' : '100%',
              maxHeight: '55vh',
            }}
          >
            {/* Subtle shadow */}
            <div className="absolute inset-0 shadow-xl shadow-stone-300/50" />
            
            <Image
              src={selectedImageUrl}
              alt="Selected entry"
              fill
              className="object-contain bg-stone-50"
              sizes="(max-width: 640px) 100vw, 512px"
              priority
            />
          </div>
        </div>

        {/* Confirmation Text */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-light text-stone-900 mb-3 tracking-tight">
            Is this your best shot?
          </h3>
          <p className="text-stone-400 text-sm">
            One entry per contest. Make it count.
          </p>
        </div>

        {/* Caption Input */}
        <div className="mb-8">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Caption (optional)"
            className="w-full px-4 py-3 bg-transparent border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none resize-none text-center"
            rows={2}
            maxLength={200}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 mb-6 bg-red-50 border border-red-100 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Action Buttons - Stacked for elegance */}
        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full py-4 text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit This Entry'
            )}
          </button>
          <button
            onClick={() => {
              setShowConfirmation(false)
              setSelectedImageId(null)
            }}
            className="w-full py-3 text-sm text-stone-400 hover:text-stone-600 transition-colors"
          >
            Choose a different photo
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Gallery Selection - Only if multiple */}
      {galleries.length > 1 && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">
            Select Gallery
          </p>
          <div className="grid grid-cols-2 gap-3">
            {galleries.map((gallery) => (
              <button
                key={gallery.id}
                onClick={() => handleGallerySelect(gallery)}
                className={`p-4 text-left border transition-all ${
                  selectedGallery?.id === gallery.id
                    ? 'border-stone-900 bg-stone-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <p className="font-medium text-stone-900 truncate">
                  {gallery.title}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {gallery.images.length} photos
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Photo Grid */}
      {selectedGallery && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-4">
            Choose Your Entry
          </p>
          
          {loadingUrls ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {selectedGallery.images.map((image) => {
                const urls = imageUrls.get(image.storage_path)
                const thumbnailUrl = urls?.thumbnail
                const isSelected = selectedImageId === image.id
                
                return (
                  <button
                    key={image.id}
                    onClick={() => {
                      setSelectedImageId(image.id)
                      setShowConfirmation(true)
                    }}
                    className={`relative aspect-square overflow-hidden transition-all ${
                      isSelected 
                        ? 'ring-2 ring-stone-900 ring-offset-2 scale-[0.98]' 
                        : 'hover:opacity-80'
                    }`}
                  >
                    {thumbnailUrl ? (
                      <Image
                        src={thumbnailUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 25vw, 150px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-stone-100 animate-pulse" />
                    )}
                    
                    {isSelected && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg">
                          <Check className="w-5 h-5 text-stone-900" />
                        </div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Caption - Optional */}
      {selectedImageId && (
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-4">
            Caption <span className="normal-case tracking-normal text-stone-600">(optional)</span>
          </p>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Tell the story behind this shot..."
            className="w-full px-4 py-3 bg-stone-900 border border-stone-800 text-white placeholder:text-stone-600 focus:border-stone-700 focus:outline-none resize-none"
            rows={2}
            maxLength={200}
          />
          <p className="text-xs text-stone-600 mt-2 text-right">
            {caption.length}/200
          </p>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-900/50 text-red-400 text-sm">
          {error}
        </div>
      )}
      
      {/* Submit Button */}
      <div className="pt-4">
        <button
          onClick={handleSubmit}
          disabled={!selectedImageId || isPending}
          className={`w-full py-4 text-sm font-medium transition-all min-h-[56px] flex items-center justify-center gap-2 ${
            selectedImageId && !isPending
              ? 'bg-white text-stone-900 hover:bg-stone-100'
              : 'bg-stone-800 text-stone-600 cursor-not-allowed'
          }`}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Entry'
          )}
        </button>
        
        {!selectedImageId && (
          <p className="text-center text-xs text-stone-600 mt-3">
            Select a photo to continue
          </p>
        )}
      </div>
    </div>
  )
}

export default SubmissionFormClient
