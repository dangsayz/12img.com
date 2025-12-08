import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getGalleryById } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { GridPreview } from '@/components/grid/GridPreview'
import { PasswordGate } from '@/components/gallery/PasswordGate'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GridViewPage({ params }: Props) {
  const { id } = await params
  const gallery = await getGalleryById(id)
  
  if (!gallery) {
    notFound()
  }

  // Check if gallery is private (not public)
  if (gallery.is_public === false) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-stone-700/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 text-center max-w-md">
          <div className="relative mx-auto mb-8">
            <div className="w-20 h-20 rounded-full border border-stone-700/50 flex items-center justify-center mx-auto backdrop-blur-sm bg-stone-900/50">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border border-stone-600/30 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extralight text-white tracking-tight mb-4">
            Private Gallery
          </h1>
          <p className="text-stone-400 text-base leading-relaxed mb-8">
            This gallery is not publicly available.<br />
            Please contact the photographer for access.
          </p>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-stone-700/50" />
            <span className="text-stone-600 text-xs uppercase tracking-widest">12img</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-stone-700/50" />
          </div>
          
          <a
            href="/"
            className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-white transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Return home
          </a>
        </div>
        
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-stone-700 text-xs">
            Powered by <span className="text-stone-500">12img</span>
          </p>
        </div>
      </div>
    )
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

  const images = await getGalleryImages(gallery.id)
  const signedUrls =
    images.length > 0
      ? await getSignedUrlsWithSizes(images.map((img) => img.storage_path))
      : new Map()

  // Calculate total file size
  const totalFileSizeBytes = images.reduce((acc, img) => acc + (img.file_size_bytes || 0), 0)

  const gridImages = images.map((img) => {
    const urls = signedUrls.get(img.storage_path)
    return {
      id: img.id,
      url: urls?.preview || urls?.thumbnail || '',
      thumbnailUrl: urls?.thumbnail || '',
      originalUrl: urls?.original || urls?.preview || '',
      width: img.width || 1000,
      height: img.height || 1000,
    }
  })

  return (
    <GridPreview 
      images={gridImages}
      title={gallery.title}
      galleryId={gallery.id}
      gallerySlug={gallery.slug}
      downloadEnabled={gallery.download_enabled}
      totalFileSizeBytes={totalFileSizeBytes}
    />
  )
}
