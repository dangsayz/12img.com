import { auth } from '@clerk/nextjs/server'
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
  const { userId: clerkId } = await auth()

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
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{gallery.title}</h1>
              <p className="text-sm text-gray-500">Manage your gallery content</p>
            </div>
          </div>

          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="rounded-full h-10 shadow-sm bg-white hover:bg-gray-50 border-gray-200">
              <ExternalLink className="w-4 h-4 mr-2" />
              View Live
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
          {/* Left Sidebar: Upload */}
          <div className="lg:sticky lg:top-24 lg:h-fit space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Images</h2>
              <ImageUploader galleryId={gallery.id} />
            </div>
            
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Pro Tip</h3>
              <p className="text-sm text-indigo-700 leading-relaxed">
                Drag and drop multiple images at once. Images are automatically optimized for web viewing.
              </p>
            </div>
          </div>

          {/* Right Content: Gallery Grid */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900">
                Gallery Images <span className="text-gray-400 font-normal ml-2">({images.length})</span>
              </h2>
            </div>
            
            {images.length > 0 ? (
              <MasonryGrid images={imagesWithUrls} editable />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                  <ExternalLink className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-900 font-medium">No images yet</p>
                <p className="text-sm text-gray-500 mt-1">Upload images to see them appear here.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
