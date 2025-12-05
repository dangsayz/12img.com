'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ImageIcon, Lock, Trash2, Share2, Check } from 'lucide-react'
import { deleteGallery } from '@/server/actions/gallery.actions'
import { Button } from '@/components/ui/button'

interface Gallery {
  id: string
  title: string
  slug: string
  hasPassword: boolean
  downloadEnabled: boolean
  coverImageUrl: string | null
  imageCount: number
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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
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
        alert(result.error)
      }
    })
  }

  if (isDeleted) return null

  return (
    <div className={`group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isPending ? 'opacity-50' : ''}`}>
      <Link href={`/gallery/${gallery.id}/upload`} className="block">
        <div className="aspect-[4/3] bg-gray-100 overflow-hidden relative">
          {gallery.coverImageUrl ? (
            <>
              <img
                src={gallery.coverImageUrl}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
              <ImageIcon className="w-12 h-12 opacity-50" />
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-medium text-gray-900 truncate pr-8">{gallery.title}</h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 font-medium">
            <span>
              {gallery.imageCount} {gallery.imageCount === 1 ? 'image' : 'images'}
            </span>
            {gallery.hasPassword && (
              <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
        <button
          onClick={handleShare}
          className={`p-2 backdrop-blur-sm rounded-full shadow-sm transition-all duration-200 ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-white/90 hover:bg-white text-gray-600 hover:text-indigo-600'
          }`}
          aria-label="Copy share link"
        >
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault()
            setShowConfirm(true)
          }}
          className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white shadow-sm hover:text-red-600 transition-all duration-200"
          aria-label="Delete gallery"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>


      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Gallery</h3>
            <p className="text-gray-600 mb-4">
              Delete &quot;{gallery.title}&quot; and all its images? This cannot
              be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
