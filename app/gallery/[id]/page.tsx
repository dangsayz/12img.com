import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { getOrCreateUserByClerkId, getUserWithUsage } from '@/server/queries/user.queries'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { Header } from '@/components/layout/Header'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { GalleryControlPanel } from '@/components/gallery/GalleryControlPanel'
import { EditableTitle } from '@/components/gallery/EditableTitle'
import { Button } from '@/components/ui/button'
import { GalleryActions, AddImagesButton } from '@/components/gallery/GalleryActions'

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

  const [user, userData] = await Promise.all([
    getOrCreateUserByClerkId(clerkId),
    getUserWithUsage(clerkId),
  ])
  
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
    originalFilename: img.original_filename,
  }))

  const galleryData = {
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    password_hash: gallery.password_hash,
    download_enabled: gallery.download_enabled,
    created_at: gallery.created_at,
    imageCount: images.length,
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header 
        userPlan={userData?.plan || 'free'}
        galleryCount={userData?.usage.galleryCount || 0}
        imageCount={userData?.usage.imageCount || 0}
        storageUsed={userData?.usage.totalBytes || 0}
        userRole={userData?.role}
      />
      
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <EditableTitle 
                galleryId={gallery.id} 
                initialTitle={gallery.title}
                currentSlug={gallery.slug}
                className="text-2xl text-gray-900"
              />
              <p className="text-sm text-gray-500">{images.length} images</p>
            </div>
          </div>

          <GalleryActions 
            galleryId={gallery.id} 
            gallerySlug={gallery.slug}
            images={imagesWithUrls}
            galleryTitle={gallery.title}
          />
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Gallery Grid */}
          <div className="flex-1 min-w-0">
            {images.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                <MasonryGrid images={imagesWithUrls} editable galleryId={gallery.id} galleryTitle={gallery.title} />
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 md:p-16">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border border-gray-100">
                    <Plus className="w-8 h-8 text-gray-300" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Your gallery is empty</h2>
                  <p className="text-gray-500 mb-6 max-w-sm">
                    Start by adding some images to your gallery. They'll appear here beautifully arranged.
                  </p>
                  <AddImagesButton galleryId={gallery.id} />
                </div>
              </div>
            )}
          </div>

          {/* Control Panel Sidebar */}
          <div className="lg:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-28">
              <GalleryControlPanel gallery={galleryData} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
