'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Image, Trash2, ExternalLink, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { deleteGallery } from '@/server/actions/gallery.actions'

interface Gallery {
  id: string
  title: string
  slug: string
  hasPassword: boolean
  downloadEnabled: boolean
  coverImageUrl: string | null
  imageCount: number
  createdAt: string
  updatedAt: string
}

interface GalleryCardProps {
  gallery: Gallery
}

export function GalleryCard({ gallery }: GalleryCardProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleted, setIsDeleted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/g/${gallery.slug}`
    : `/g/${gallery.slug}`

  const formattedDate = new Date(gallery.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = () => {
    setIsDeleted(true)
    setShowConfirm(false)

    startTransition(async () => {
      const result = await deleteGallery(gallery.id)
      if (result.error) {
        setIsDeleted(false)
      }
    })
  }

  if (isDeleted) return null

  return (
    <>
      <Link 
        href={`/gallery/${gallery.id}`} 
        className={`group block ${isPending ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 mb-3">
          {gallery.coverImageUrl ? (
            <img
              src={gallery.coverImageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-300" />
            </div>
          )}
          
          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex gap-1.5">
                <button
                  onClick={handleCopyLink}
                  className={`h-8 px-3 text-xs font-medium rounded-lg backdrop-blur-sm transition-all ${
                    copied 
                      ? 'bg-white text-gray-900' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    'Copy Link'
                  )}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowConfirm(true)
                }}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-red-500/80 backdrop-blur-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Private badge */}
          {gallery.hasPassword && (
            <div className="absolute top-3 left-3">
              <div className="h-6 w-6 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-0.5">
          <h3 className="font-medium text-gray-900 truncate">{gallery.title}</h3>
          <p className="text-xs text-gray-400">
            {gallery.imageCount} {gallery.imageCount === 1 ? 'image' : 'images'} • {formattedDate}
          </p>
        </div>
      </Link>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-base font-medium text-gray-900 mb-2">Delete "{gallery.title}"?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete the gallery and all {gallery.imageCount} images.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
