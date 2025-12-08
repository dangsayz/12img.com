import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { UploadInterface } from '@/components/upload/UploadInterface'

interface Props {
  params: Promise<{ id: string }>
}

export default async function UploadPage({ params }: Props) {
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

  // Fetch existing images
  const dbImages = await getGalleryImages(gallery.id)
  const signedUrls = dbImages.length > 0
    ? await getSignedUrlsWithSizes(dbImages.map(img => img.storage_path))
    : new Map()

  const images = dbImages.map(img => {
    const urls = signedUrls.get(img.storage_path)
    return {
      id: img.id,
      thumbnailUrl: urls?.thumbnail || '',
      previewUrl: urls?.preview || '',
      originalUrl: urls?.original || '',
      width: img.width,
      height: img.height,
    }
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <UploadInterface 
        gallery={{
          id: gallery.id,
          title: gallery.title,
          slug: gallery.slug,
        }}
        images={images}
      />
    </div>
  )
}
