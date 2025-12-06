
import { notFound } from 'next/navigation'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { ReelPlayer } from '@/components/reel/ReelPlayer'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReelViewPage({ params }: Props) {
  const { id } = await params
  const gallery = await getGalleryById(id)
  
  if (!gallery) {
    notFound()
  }

  const images = await getGalleryImages(gallery.id)
  const signedUrls =
    images.length > 0
      ? await getSignedUrlsWithSizes(images.map((img) => img.storage_path))
      : new Map()

  // Calculate total file size in bytes
  const totalFileSizeBytes = images.reduce((acc, img) => acc + (img.file_size_bytes || 0), 0)

  const reelImages = images
    .map((img) => {
      const urls = signedUrls.get(img.storage_path)
      return {
        id: img.id,
        url: urls?.preview || urls?.thumbnail || '',
        width: img.width || 1000,
        height: img.height || 1000,
        orientation: (img.width && img.height && img.width < img.height) ? 'portrait' : 'landscape'
      }
    })
    // Prioritize portrait images for the reel
    .sort((a, b) => {
      if (a.orientation === 'portrait' && b.orientation !== 'portrait') return -1
      if (a.orientation !== 'portrait' && b.orientation === 'portrait') return 1
      return 0
    })

  return (
    <ReelPlayer 
      images={reelImages}
      title={gallery.title}
      galleryId={gallery.id}
      gallerySlug={gallery.slug}
      totalImageCount={images.length}
      totalFileSizeBytes={totalFileSizeBytes}
      downloadEnabled={gallery.download_enabled}
    />
  )
}
