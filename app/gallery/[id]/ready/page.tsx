import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { GalleryReadyClient } from './GalleryReadyClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GalleryReadyPage({ params }: Props) {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    redirect('/sign-in')
  }

  const { id } = await params
  const gallery = await getGalleryById(id)
  
  if (!gallery) {
    notFound()
  }

  // Verify ownership
  const user = await getUserByClerkId(clerkId)
  if (!user || gallery.user_id !== user.id) {
    notFound()
  }

  // Fetch images for preview
  const dbImages = await getGalleryImages(gallery.id)
  const signedUrls = dbImages.length > 0
    ? await getSignedUrlsWithSizes(dbImages.slice(0, 6).map(img => img.storage_path))
    : new Map()

  // Get first 6 images for the preview grid
  const previewImages = dbImages.slice(0, 6).map(img => {
    const urls = signedUrls.get(img.storage_path)
    return {
      id: img.id,
      thumbnailUrl: urls?.thumbnail || '',
      previewUrl: urls?.preview || '',
    }
  })

  // Get cover image (first image or designated cover) with dimensions
  const firstImage = dbImages[0]
  const coverImage = firstImage ? {
    id: firstImage.id,
    thumbnailUrl: signedUrls.get(firstImage.storage_path)?.thumbnail || '',
    previewUrl: signedUrls.get(firstImage.storage_path)?.preview || '',
    width: firstImage.width || undefined,
    height: firstImage.height || undefined,
  } : null

  return (
    <GalleryReadyClient
      gallery={{
        id: gallery.id,
        title: gallery.title,
        slug: gallery.slug,
        imageCount: dbImages.length,
      }}
      coverImage={coverImage}
      previewImages={previewImages}
      photographerName={user.display_name || 'Photographer'}
    />
  )
}
