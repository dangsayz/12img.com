'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { ImageIcon, Lock, Trash2 } from 'lucide-react'
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
    <div className={`group relative ${isPending ? 'opacity-50' : ''}`}>
      <Link href={`/gallery/${gallery.id}/upload`} className="block">
        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          {gallery.coverImageUrl ? (
            <img
              src={gallery.coverImageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon className="w-12 h-12" />
            </div>
          )}
        </div>

        <div className="mt-3">
          <h3 className="font-medium truncate">{gallery.title}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            {gallery.imageCount} {gallery.imageCount === 1 ? 'image' : 'images'}
            {gallery.hasPassword && <Lock className="w-3 h-3" />}
          </p>
        </div>
      </Link>

      <button
        onClick={() => setShowConfirm(true)}
        className="absolute top-2 right-2 p-2 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        aria-label="Delete gallery"
      >
        <Trash2 className="w-4 h-4 text-gray-600" />
      </button>

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
