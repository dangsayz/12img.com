import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getGalleryBySlug } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { verifyUnlockToken } from '@/lib/utils/password'
import { PublicGalleryView } from '@/components/gallery/PublicGalleryView'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'

export const revalidate = 60

interface Props {
  params: Promise<{ galleryId: string }>
}

export default async function GalleryPage({ params }: Props) {
  const { galleryId } = await params
  const gallery = await getGalleryBySlug(galleryId)

  if (!gallery) {
    notFound()
  }

  // Password protection check
  if (gallery.password_hash) {
    const cookieStore = await cookies()
    const unlockCookie = cookieStore.get(`gallery_unlock_${gallery.id}`)

    if (!unlockCookie || !verifyUnlockToken(unlockCookie.value, gallery.id)) {
      redirect(`/g/${galleryId}/password`)
    }
  }

  // Check if current user is the owner
  const { userId: clerkId } = await auth()
  let isOwner = false
  if (clerkId) {
    const user = await getOrCreateUserByClerkId(clerkId)
    if (user && user.id === gallery.user_id) {
      isOwner = true
    }
  }

  const images = await getGalleryImages(gallery.id)

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F8F9FA] to-[#F2F3F5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-gray-900 mb-2">{gallery.title}</h1>
          <p className="text-gray-500">This gallery is empty.</p>
        </div>
      </div>
    )
  }

  const storagePaths = images.map((img) => img.storage_path)
  console.log('[Gallery] Storage paths:', storagePaths)
  
  const signedUrls = await getSignedUrlsBatch(storagePaths)
  console.log('[Gallery] Signed URLs map size:', signedUrls.size)

  const imagesWithUrls = images.map((img) => {
    const url = signedUrls.get(img.storage_path)
    if (!url) {
      console.log('[Gallery] Missing URL for path:', img.storage_path)
    }
    return {
      id: img.id,
      signedUrl: url || '',
      width: img.width,
      height: img.height,
    }
  })

  return (
    <PublicGalleryView
      title={gallery.title}
      images={imagesWithUrls}
      downloadEnabled={gallery.download_enabled}
      isOwner={isOwner}
      galleryId={gallery.id}
      coverImageId={gallery.cover_image_id}
    />
  )
}
