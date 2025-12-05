'use client'

import { useState } from 'react'
import { Plus, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadModal } from './UploadModal'

interface GalleryActionsProps {
  galleryId: string
  gallerySlug: string
}

export function GalleryActions({ galleryId, gallerySlug }: GalleryActionsProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          className="rounded-full h-10 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium px-5"
          onClick={() => setIsUploadModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Images
        </Button>
        <a
          href={`/g/${gallerySlug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="rounded-full h-10 bg-gray-900 hover:bg-gray-800 text-white font-medium px-5">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Live
          </Button>
        </a>
      </div>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        galleryId={galleryId}
      />
    </>
  )
}

// Standalone upload button for empty state
interface AddImagesButtonProps {
  galleryId: string
  className?: string
}

export function AddImagesButton({ galleryId, className }: AddImagesButtonProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  return (
    <>
      <Button 
        className={className || "rounded-full h-11 px-6 bg-gray-900 hover:bg-gray-800"}
        onClick={() => setIsUploadModalOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Your First Images
      </Button>

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        galleryId={galleryId}
      />
    </>
  )
}
