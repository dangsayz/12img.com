import { auth } from '@clerk/nextjs'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { Header } from '@/components/layout/Header'
import { ImageUploader } from '@/components/gallery/ImageUploader'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function UploadPage({ params }: Props) {
  const { userId: clerkId } = auth()

  if (!clerkId) {
    redirect('/sign-in')
  }

  const user = await getUserByClerkId(clerkId)
  if (!user) {
    redirect('/sign-in')
  }

  const gallery = await getGalleryWithOwnershipCheck(params.id, user.id)
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
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-500 hover:text-black">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold">{gallery.title}</h1>
          </div>

          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Gallery
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-lg font-medium mb-4">Upload Images</h2>
            <ImageUploader galleryId={gallery.id} />
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-lg font-medium mb-4">
              Gallery ({images.length} images)
            </h2>
            {images.length > 0 ? (
              <MasonryGrid images={imagesWithUrls} editable />
            ) : (
              <p className="text-gray-500">No images yet. Upload some above.</p>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
