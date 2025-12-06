import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getImageWithGallery } from '@/server/queries/image.queries'
import { getSignedDownloadUrl } from '@/lib/storage/signed-urls'
import { verifyUnlockToken } from '@/lib/utils/password'
import { SingleImageView } from '@/components/gallery/SingleImageView'

export const revalidate = 60

interface Props {
  params: Promise<{ galleryId: string; imageId: string }>
}

// Generate dynamic OG metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { imageId } = await params
  const result = await getImageWithGallery(imageId)
  
  if (!result) {
    return { title: 'Image Not Found' }
  }

  const { image, gallery } = result
  const signedUrl = await getSignedDownloadUrl(image.storage_path)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'

  return {
    title: `${gallery.title} | 12img`,
    description: `View this photo from ${gallery.title}`,
    openGraph: {
      title: gallery.title,
      description: `View this photo from ${gallery.title}`,
      type: 'website',
      siteName: '12img',
      images: [
        {
          url: signedUrl,
          width: image.width || 1200,
          height: image.height || 800,
          alt: gallery.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: gallery.title,
      description: `View this photo from ${gallery.title}`,
      images: [signedUrl],
    },
  }
}

export default async function SingleImagePage({ params }: Props) {
  const { galleryId, imageId } = await params
  
  const result = await getImageWithGallery(imageId)
  
  if (!result) {
    notFound()
  }

  const { image, gallery } = result

  // Verify the galleryId matches (security + SEO canonical)
  if (gallery.slug !== galleryId && gallery.id !== galleryId) {
    notFound()
  }

  // Password protection check
  if (gallery.password_hash) {
    const cookieStore = await cookies()
    const unlockCookie = cookieStore.get(`gallery_unlock_${gallery.id}`)

    if (!unlockCookie || !verifyUnlockToken(unlockCookie.value, gallery.id)) {
      redirect(`/g/${gallery.slug}/password`)
    }
  }

  const signedUrl = await getSignedDownloadUrl(image.storage_path)

  return (
    <SingleImageView
      imageUrl={signedUrl}
      imageWidth={image.width}
      imageHeight={image.height}
      galleryTitle={gallery.title}
      gallerySlug={gallery.slug}
      imageId={image.id}
      downloadEnabled={gallery.download_enabled}
    />
  )
}
