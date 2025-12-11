import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getOrCreateUserByClerkId, getUserWithUsage, getUserSettings } from '@/server/queries/user.queries'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { GalleryEditor } from '@/components/gallery/GalleryEditor'
import { getProxyImageUrl, getSeoDownloadFilename } from '@/lib/seo/image-urls'
import { ensureGalleryCover } from '@/server/actions/gallery.actions'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GalleryViewPage({ params }: Props) {
  const { id } = await params
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const [user, userData, userSettings] = await Promise.all([
    getOrCreateUserByClerkId(clerkId),
    getUserWithUsage(clerkId),
    getUserSettings(clerkId),
  ])
  
  if (!user) {
    redirect('/sign-in')
  }

  const gallery = await getGalleryWithOwnershipCheck(id, user.id)
  if (!gallery) {
    notFound()
  }

  const images = await getGalleryImages(gallery.id)
  
  // Ensure gallery has a cover image set (auto-selects portrait image if available)
  const { coverImageId } = await ensureGalleryCover(gallery.id)
  const effectiveCoverId = coverImageId || (gallery as { cover_image_id?: string | null }).cover_image_id
  
  // Only fetch signed URLs for the first batch (50 images) for fast initial load
  // The rest will be loaded on-demand via client-side pagination
  const INITIAL_BATCH_SIZE = 50
  const initialImages = images.slice(0, INITIAL_BATCH_SIZE)
  
  const signedUrls =
    initialImages.length > 0
      ? await getSignedUrlsWithSizes(initialImages.map((img) => img.storage_path))
      : new Map()

  const imagesWithUrls = images.map((img, index) => {
    // Generate SEO-friendly proxy URL and filename for downloads
    const proxyUrl = getProxyImageUrl(gallery.id, img.id)
    const seoFilename = getSeoDownloadFilename(gallery.title, index + 1, 'jpg')
    
    // Only include URLs for the first batch
    if (index < INITIAL_BATCH_SIZE) {
      const urls = signedUrls.get(img.storage_path)
      return {
        id: img.id,
        storagePath: img.storage_path,
        thumbnailUrl: urls?.thumbnail || '',
        previewUrl: urls?.preview || '',
        originalUrl: urls?.original || '',
        // SEO download URLs
        proxyUrl,
        seoFilename,
        width: img.width,
        height: img.height,
        originalFilename: img.original_filename,
        focalX: (img as { focal_x?: number | null }).focal_x ?? null,
        focalY: (img as { focal_y?: number | null }).focal_y ?? null,
      }
    }
    // For remaining images, we'll fetch URLs on-demand
    return {
      id: img.id,
      storagePath: img.storage_path,
      thumbnailUrl: '', // Will be fetched on-demand
      previewUrl: '',
      originalUrl: '',
      // SEO download URLs
      proxyUrl,
      seoFilename,
      width: img.width,
      height: img.height,
      originalFilename: img.original_filename,
      focalX: (img as { focal_x?: number | null }).focal_x ?? null,
      focalY: (img as { focal_y?: number | null }).focal_y ?? null,
    }
  })

  // Calculate total file size for download prompt
  const totalFileSizeBytes = images.reduce((sum, img) => sum + (img.file_size_bytes || 0), 0)

  const galleryData = {
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    password_hash: gallery.password_hash,
    download_enabled: gallery.download_enabled,
    is_public: (gallery as { is_public?: boolean }).is_public ?? true,
    is_locked: (gallery as { is_locked?: boolean }).is_locked ?? false,
    template: (gallery as { template?: string }).template || 'mosaic',
    created_at: gallery.created_at,
    imageCount: images.length,
    presentation_data: (gallery as { presentation_data?: unknown }).presentation_data || null,
    cover_image_id: effectiveCoverId || null,
  }

  return (
    <GalleryEditor 
      gallery={galleryData}
      images={imagesWithUrls}
      photographerName={userSettings?.businessName || undefined}
      totalFileSizeBytes={totalFileSizeBytes}
      profileSlug={(user as { profile_slug?: string | null }).profile_slug || undefined}
    />
  )
}
