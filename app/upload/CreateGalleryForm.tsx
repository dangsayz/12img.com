'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Loader2, Plus, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { createGallery } from '@/server/actions/gallery.actions'
import { DatePicker } from '@/components/ui/DatePicker'

interface CreateGalleryFormProps {
  isAtLimit: boolean
  currentCount: number
  galleryLimit: number | 'unlimited'
  planName: string
}

export function CreateGalleryForm({ 
  isAtLimit, 
  currentCount, 
  galleryLimit,
  planName 
}: CreateGalleryFormProps) {
  const router = useRouter()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [galleryName, setGalleryName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-focus name input on mount (only if not at limit)
  useEffect(() => {
    if (!isAtLimit) {
      titleInputRef.current?.focus()
    }
  }, [isAtLimit])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isAtLimit) {
      setError(`You've reached your ${planName} plan limit of ${galleryLimit} galleries`)
      return
    }
    
    if (!galleryName.trim()) {
      setError('Please enter a gallery name')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('title', galleryName.trim())
      formData.set('downloadEnabled', 'true')
      
      const result = await createGallery(formData)
      
      if (result.error || !result.galleryId) {
        setError(result.error || 'Failed to create gallery')
        setIsCreating(false)
        return
      }

      // Navigate to the gallery page where they can add images
      router.push(`/gallery/${result.galleryId}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 pt-28 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-soft-xl border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-[#1C1917]">New Gallery</span>
            </div>
            <Link 
              href="/"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </Link>
          </div>

          {/* Form */}
          <form onSubmit={handleCreate} className="p-6 space-y-6">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Create New Gallery
              </h1>
              <p className="text-sm text-gray-500">
                Start a new collection for your photos
              </p>
            </div>

            {/* At Limit Warning */}
            {isAtLimit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-amber-50 border border-amber-200"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">
                      Gallery limit reached
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      You've used all {galleryLimit} galleries on your {planName} plan.
                    </p>
                    <Link 
                      href="/pricing" 
                      className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-900 mt-2"
                    >
                      Upgrade for more galleries →
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Gallery Name Field */}
            <div className="space-y-2">
              <label 
                htmlFor="gallery-name" 
                className="block text-sm font-medium text-gray-700"
              >
                Gallery Name
              </label>
              <input
                ref={titleInputRef}
                id="gallery-name"
                type="text"
                value={galleryName}
                onChange={(e) => setGalleryName(e.target.value)}
                placeholder="e.g. Sarah & John's Wedding"
                disabled={isAtLimit}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>

            {/* Event Date Field */}
            <div className="space-y-2">
              <label 
                className="block text-sm font-medium text-gray-700"
              >
                Event Date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <DatePicker
                value={eventDate}
                onChange={setEventDate}
                placeholder="Select event date"
                disabled={isAtLimit}
              />
            </div>

            {/* Error Message */}
            {error && !isAtLimit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center p-4 rounded-xl bg-red-50 border border-red-100"
              >
                <p className="text-sm text-red-600 mb-2">{error}</p>
                {error.includes('limit') && (
                  <Link 
                    href="/pricing" 
                    className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    View upgrade options →
                  </Link>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            {isAtLimit ? (
              <Link
                href="/pricing"
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                Upgrade Plan
              </Link>
            ) : (
              <button
                type="submit"
                disabled={isCreating || !galleryName.trim()}
                className="w-full py-3.5 px-6 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Gallery</span>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-xs text-gray-400 mt-6">
          {isAtLimit 
            ? `${currentCount}/${galleryLimit} galleries used on ${planName} plan`
            : 'You can add photos after creating your gallery'
          }
        </p>
      </motion.div>
    </main>
  )
}
