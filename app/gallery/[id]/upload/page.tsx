import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { Header } from '@/components/layout/Header'
import { UploadInterface } from '@/components/upload/UploadInterface'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function UploadPage({ params }: Props) {
  const { id } = await params
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    redirect('/sign-in')
  }

  const gallery = await getGalleryWithOwnershipCheck(id, user.id)
  if (!gallery) {
    notFound()
  }

  const images = await getGalleryImages(gallery.id)
  const signedUrls =
    images.length > 0
      ? await getSignedUrlsBatch(images.map((img) => img.storage_path))
      : new Map()

  const imagesWithUrls = images.map((img) => ({
    id: img.id,
    signedUrl: signedUrls.get(img.storage_path) || '',
    width: img.width,
    height: img.height,
  }))

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main>
        <UploadInterface 
          gallery={{
            id: gallery.id,
            title: gallery.title,
            slug: gallery.slug
          }} 
          images={imagesWithUrls} 
        />
      </main>
    </div>
  )
}
