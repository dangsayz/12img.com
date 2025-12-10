'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MosaicView } from './MosaicView'
import { setCoverImage } from '@/server/actions/gallery.actions'
import { type PresentationData } from '@/lib/types/presentation'

interface GalleryImage {
  id: string
  storagePath?: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
}

interface MosaicViewWrapperProps {
  title: string
  images: GalleryImage[]
  downloadEnabled?: boolean
  photographerName?: string
  photographerLogo?: string
  galleryId: string
  gallerySlug?: string
  totalImages?: number
  isOwner?: boolean
  coverImageId?: string | null
  presentation?: PresentationData | null
}

export function MosaicViewWrapper({
  title,
  images,
  downloadEnabled,
  photographerName,
  photographerLogo,
  galleryId,
  gallerySlug,
  totalImages,
  isOwner,
  coverImageId,
  presentation,
}: MosaicViewWrapperProps) {
  const router = useRouter()

  const handleSetCover = useCallback(async (imageId: string) => {
    const result = await setCoverImage(galleryId, imageId)
    if (result.error) {
      console.error('Failed to set cover:', result.error)
      throw new Error(result.error)
    }
    // Refresh the page to show updated cover
    router.refresh()
  }, [galleryId, router])

  return (
    <MosaicView
      title={title}
      images={images}
      downloadEnabled={downloadEnabled}
      photographerName={photographerName}
      photographerLogo={photographerLogo}
      galleryId={galleryId}
      gallerySlug={gallerySlug}
      totalImages={totalImages}
      isOwner={isOwner}
      coverImageId={coverImageId}
      onSetCover={handleSetCover}
      presentation={presentation}
    />
  )
}
