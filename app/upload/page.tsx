'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Calendar, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { createGallery } from '@/server/actions/gallery.actions'
import { Header } from '@/components/layout/Header'

export default function CreateGalleryPage() {
  const router = useRouter()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [galleryName, setGalleryName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-focus name input on mount
  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      
      <main className="min-h-screen flex items-center justify-center px-4 pt-20 pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-soft-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-soft-lime/50 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-gray-700" />
                </div>
                <span className="font-medium text-gray-900">New Gallery</span>
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all"
                />
              </div>

              {/* Event Date Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="event-date" 
                  className="block text-sm font-medium text-gray-700"
                >
                  Event Date <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    id="event-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 transition-all appearance-none"
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 text-center"
                >
                  {error}
                </motion.p>
              )}

              {/* Submit Button */}
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
            </form>
          </div>

          {/* Bottom hint */}
          <p className="text-center text-xs text-gray-400 mt-6">
            You can add photos after creating your gallery
          </p>
        </motion.div>
      </main>
    </div>
  )
}
