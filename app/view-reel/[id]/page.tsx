import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { EditorialGallery } from '@/components/gallery/EditorialGallery'
import { PublicGalleryView } from '@/components/gallery/PublicGalleryView'
import { CinematicGallery } from '@/components/gallery/CinematicGallery'
import { PasswordGate } from '@/components/gallery/PasswordGate'
import { type PresentationData } from '@/lib/types/presentation'
import { type GalleryTemplate } from '@/components/gallery/templates'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PublicViewPage({ params }: Props) {
  const { id } = await params
  
  // Redirect demo to the dedicated demo page
  if (id === 'demo') {
    redirect('/demo')
  }
  
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

  // Get template
  const template = ((gallery as { template?: string }).template || 'mosaic') as GalleryTemplate

  // For editorial template, redirect to view-live (magazine engine)
  if (template === 'editorial') {
    redirect(`/view-live/${id}`)
  }

  const images = await getGalleryImages(gallery.id)
  const signedUrls =
    images.length > 0
      ? await getSignedUrlsWithSizes(images.map((img) => img.storage_path))
      : new Map()

  // Calculate total file size in bytes
  const totalFileSizeBytes = images.reduce((acc, img) => acc + (img.file_size_bytes || 0), 0)

  // Map images with signed URLs
  const galleryImages = images.map((img) => {
    const urls = signedUrls.get(img.storage_path)
    return {
      id: img.id,
      thumbnailUrl: urls?.thumbnail || '',
      previewUrl: urls?.preview || '',
      originalUrl: urls?.original || '',
      width: img.width,
      height: img.height,
      focalX: (img as { focal_x?: number | null }).focal_x ?? null,
      focalY: (img as { focal_y?: number | null }).focal_y ?? null,
    }
  })

  // Get presentation data if available
  const presentation = (gallery as { presentation_data?: PresentationData | null }).presentation_data

  // Cinematic template - dark, moody, editorial scroll layout
  if (template === 'cinematic') {
    return (
      <CinematicGallery
        title={gallery.title}
        images={galleryImages}
        galleryId={gallery.id}
        gallerySlug={gallery.slug}
        downloadEnabled={gallery.download_enabled}
        totalFileSizeBytes={totalFileSizeBytes}
        presentation={presentation}
      />
    )
  }

  // Mosaic and Clean Grid templates
  return (
    <PublicGalleryView
      title={gallery.title}
      images={galleryImages}
      downloadEnabled={gallery.download_enabled}
      galleryId={gallery.id}
      gallerySlug={gallery.slug}
      template={template as 'mosaic' | 'clean-grid'}
    />
  )
}
