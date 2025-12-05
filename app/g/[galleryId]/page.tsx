import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getGalleryBySlug } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { verifyUnlockToken } from '@/lib/utils/password'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'

export const revalidate = 60

interface Props {
  params: { galleryId: string }
}

export default async function GalleryPage({ params }: Props) {
  const gallery = await getGalleryBySlug(params.galleryId)

  if (!gallery) {
    notFound()
  }

  // Password protection check
  if (gallery.password_hash) {
    const cookieStore = await cookies()
    const unlockCookie = cookieStore.get(`gallery_unlock_${gallery.id}`)

    if (!unlockCookie || !verifyUnlockToken(unlockCookie.value, gallery.id)) {
      redirect(`/g/${params.galleryId}/password`)
    }
  }

  const images = await getGalleryImages(gallery.id)

  if (images.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">This gallery is empty.</p>
      </div>
    )
  }

  const signedUrls = await getSignedUrlsBatch(
    images.map((img) => img.storage_path)
  )

  const imagesWithUrls = images.map((img) => ({
    id: img.id,
    signedUrl: signedUrls.get(img.storage_path) || '',
    width: img.width,
    height: img.height,
  }))

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-xl font-semibold">{gallery.title}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <MasonryGrid images={imagesWithUrls} />
      </div>
    </main>
  )
}
