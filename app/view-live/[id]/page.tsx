import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { LayoutEngine } from '@/lib/editorial/engine'
import { EditorialViewer } from '@/components/editorial/EditorialViewer'
import { PasswordGate } from '@/components/gallery/PasswordGate'

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

  // Check if gallery is password protected
  if (gallery.password_hash) {
    const cookieStore = await cookies()
    const accessCookie = cookieStore.get(`gallery_access_${gallery.id}`)
    
    // If no valid access cookie, show password gate
    if (!accessCookie || accessCookie.value !== 'granted') {
      return (
        <div className="min-h-screen bg-stone-50 flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-xl font-semibold text-stone-900 mb-2">{gallery.title}</h1>
              <p className="text-sm text-stone-500">This gallery is protected</p>
            </div>
            <PasswordGate galleryId={gallery.id} gallerySlug={gallery.slug} />
          </div>
        </div>
      )
    }
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

  // Extract presentation data if available
  const presentationData = (gallery as { presentation_data?: { 
    location?: string
    eventDate?: string 
  } }).presentation_data

  return (
    <EditorialViewer 
      spreads={spreads} 
      title={gallery.title} 
      galleryId={gallery.id}
      imageCount={images.length}
      eventDate={presentationData?.eventDate}
      location={presentationData?.location}
    />
  )
}
