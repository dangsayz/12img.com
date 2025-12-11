'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
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
  isArchived?: boolean
  archivedReason?: string | null
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
    ? `${window.location.origin}/view-reel/${gallery.slug}`
    : `/view-reel/${gallery.slug}`

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
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          {gallery.coverImageUrl ? (
            <img
              src={gallery.coverImageUrl}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
              <Image className="w-8 h-8 text-gray-600" />
            </div>
          )}
          
          {/* Permanent gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Title overlay on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-bold text-white text-xl leading-tight mb-1.5 drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {gallery.title}
            </h3>
            <p className="text-xs text-white/70 flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-400" />
              {gallery.imageCount} {gallery.imageCount === 1 ? 'item' : 'items'}
              <span className="text-white/40">·</span>
              {formattedDate}
            </p>
          </div>

          {/* Hover overlay with actions */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="absolute top-3 right-3 flex gap-1.5">
              <button
                onClick={handleCopyLink}
                className={`h-8 px-3 text-xs font-medium backdrop-blur-sm transition-all ${
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
                className="h-8 w-8 flex items-center justify-center bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowConfirm(true)
                }}
                className="h-8 w-8 flex items-center justify-center bg-white/20 text-white hover:bg-red-500/80 backdrop-blur-sm transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            {/* Archived badge */}
            {gallery.isArchived && (
              <div className="h-6 px-2 bg-amber-500/90 backdrop-blur-sm flex items-center justify-center gap-1">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
                <span className="text-[10px] font-medium text-white uppercase tracking-wide">Archived</span>
              </div>
            )}
            {/* Private badge */}
            {gallery.hasPassword && !gallery.isArchived && (
              <div className="h-6 w-6 bg-white/90 backdrop-blur-sm flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
          </div>

          {/* Archived overlay */}
          {gallery.isArchived && (
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />
          )}
        </div>
      </Link>

      {/* Delete confirmation modal - Portal to body to escape transform context */}
      {showConfirm && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
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
              className="bg-white p-6 max-w-sm w-full shadow-xl"
            >
              <h3 className="text-base font-medium text-gray-900 mb-2">Delete "{gallery.title}"?</h3>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete the gallery and all {gallery.imageCount} images.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
