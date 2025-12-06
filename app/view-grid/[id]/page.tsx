import { notFound } from 'next/navigation'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { GridPreview } from '@/components/grid/GridPreview'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GridViewPage({ params }: Props) {
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

  // Calculate total file size
  const totalFileSizeBytes = images.reduce((acc, img) => acc + (img.file_size_bytes || 0), 0)

  const gridImages = images.map((img) => {
    const urls = signedUrls.get(img.storage_path)
    return {
      id: img.id,
      url: urls?.preview || urls?.thumbnail || '',
      thumbnailUrl: urls?.thumbnail || '',
      originalUrl: urls?.original || urls?.preview || '',
      width: img.width || 1000,
      height: img.height || 1000,
    }
  })

  return (
    <GridPreview 
      images={gridImages}
      title={gallery.title}
      galleryId={gallery.id}
      gallerySlug={gallery.slug}
      downloadEnabled={gallery.download_enabled}
      totalFileSizeBytes={totalFileSizeBytes}
    />
  )
}
