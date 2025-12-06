
import { notFound } from 'next/navigation'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { LayoutEngine } from '@/lib/editorial/engine'
import { EditorialViewer } from '@/components/editorial/EditorialViewer'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditorialLiveViewPage({ params }: Props) {
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

  const imagesWithUrls = images.map((img) => {
    const urls = signedUrls.get(img.storage_path)
    return {
      id: img.id,
      url: urls?.preview || urls?.thumbnail || '', // Prefer preview (1920px) for editorial
      thumbnailUrl: urls?.thumbnail || '',
      width: img.width,
      height: img.height,
    }
  })

  // Server-Side Layout Generation
  const engine = new LayoutEngine()
  const spreads = engine.createLayout(imagesWithUrls, gallery.title)

  return (
    <EditorialViewer 
      spreads={spreads} 
      title={gallery.title} 
      galleryId={gallery.id} 
    />
  )
}
