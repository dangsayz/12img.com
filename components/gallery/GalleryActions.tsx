'use client'

import { useState } from 'react'
import { Plus, ExternalLink, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadModal } from './UploadModal'
import JSZip from 'jszip'

interface GalleryActionsProps {
  galleryId: string
  gallerySlug: string
  images?: { signedUrl: string; originalFilename?: string }[]
  galleryTitle?: string
}

export function GalleryActions({ galleryId, gallerySlug, images = [], galleryTitle = 'gallery' }: GalleryActionsProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadZip = async () => {
    if (isDownloading || images.length === 0) return
    setIsDownloading(true)
    
    try {
      const zip = new JSZip()
      
      // Download each image and add to ZIP
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        try {
          const response = await fetch(image.signedUrl)
          if (!response.ok) continue
          
          const blob = await response.blob()
          const filename = `${String(i + 1).padStart(3, '0')}_${image.originalFilename || 'image.jpg'}`
          zip.file(filename, blob)
        } catch (err) {
          console.error(`Failed to fetch image ${i + 1}:`, err)
        }
      }
      
      // Generate ZIP and download
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${galleryTitle.replace(/[^a-z0-9]/gi, '_')}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Download failed. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="h-9 w-9 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          title="Add Images"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button 
          onClick={handleDownloadZip}
          disabled={isDownloading || images.length === 0}
          className="h-9 w-9 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={images.length === 0 ? "No images to download" : "Download ZIP"}
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
        <a
          href={`/g/${gallerySlug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="rounded-full h-9 bg-[#1C1917] hover:bg-[#292524] text-white font-medium px-4 text-sm">
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
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
