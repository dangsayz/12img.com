import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { type Metadata } from 'next'
import { getGalleryById, getGalleryBySlug } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'
import { LayoutEngine } from '@/lib/editorial/engine'
import { EditorialViewer } from '@/components/editorial/EditorialViewer'
import { PasswordGate } from '@/components/gallery/PasswordGate'
import { getProxyImageUrl, getSeoDownloadFilename } from '@/lib/seo/image-urls'
import { ImageGalleryJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

// Helper to get gallery by slug or UUID (backwards compatibility)
async function getGalleryBySlugOrId(slugOrId: string) {
  // Try slug first
  const bySlug = await getGalleryBySlug(slugOrId)
  if (bySlug) return bySlug
  
  // Fallback to UUID for old links
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId)
  if (isUUID) {
    return await getGalleryById(slugOrId)
  }
  
  return null
}

// Generate OG metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const gallery = await getGalleryBySlugOrId(slug)
  
  if (!gallery) {
    return {
      title: 'Gallery Not Found | 12img',
    }
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.12img.com'
  const galleryUrl = `${baseUrl}/view-live/${gallery.slug}`
  
  // Use OG image API which handles cover image or first image fallback
  const ogImageUrl = `${baseUrl}/api/og/gallery/${gallery.id}`
  
  // Get photographer name for better SEO
  const photographerName = (gallery as { photographer_name?: string }).photographer_name || '12img'
  const description = `View ${gallery.title} - a stunning photo gallery by ${photographerName}. Delivered with 12img, the minimal gallery platform for photographers.`
  
  return {
    title: `${gallery.title} | ${photographerName} | 12img`,
    description,
    openGraph: {
      title: `${gallery.title} | ${photographerName}`,
      description,
      url: galleryUrl,
      siteName: '12img',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${gallery.title} - Photo gallery by ${photographerName}`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${gallery.title} | ${photographerName}`,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: galleryUrl,
    },
  }
}

export default async function EditorialLiveViewPage({ params }: Props) {
  const { slug } = await params
  const gallery = await getGalleryBySlugOrId(slug)
  
  if (!gallery) {
    notFound()
  }

  // Check if gallery is private (not public)
  if (gallery.is_public === false) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-stone-950 to-black" />
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-800/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-stone-700/10 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative z-10 text-center max-w-md">
          {/* Elegant lock icon */}
          <div className="relative mx-auto mb-8">
            <div className="w-20 h-20 rounded-full border border-stone-700/50 flex items-center justify-center mx-auto backdrop-blur-sm bg-stone-900/50">
              <svg className="w-8 h-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            {/* Subtle ring animation */}
            <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border border-stone-600/30 animate-ping" style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Typography */}
          <h1 className="text-3xl sm:text-4xl font-extralight text-white tracking-tight mb-4">
            Private Gallery
          </h1>
          <p className="text-stone-400 text-base leading-relaxed mb-8">
            This gallery is not publicly available.<br />
            Please contact the photographer for access.
          </p>
          
          {/* Divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-stone-700/50" />
            <span className="text-stone-600 text-xs uppercase tracking-widest">12img</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-stone-700/50" />
          </div>
          
          {/* Action */}
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
        
        {/* Bottom branding */}
        <div className="absolute bottom-6 left-0 right-0 text-center">
          <p className="text-stone-700 text-xs">
            Powered by <span className="text-stone-500">12img</span>
          </p>
        </div>
      </div>
    )
  }

  // Check if gallery is password protected
  // Debug: Log password protection status
  console.log('[view-live] Gallery password check:', {
    galleryId: gallery.id,
    hasPasswordHash: !!gallery.password_hash,
    isLocked: gallery.is_locked,
    passwordHashLength: gallery.password_hash?.length || 0,
  })
  
  if (gallery.password_hash) {
    const cookieStore = await cookies()
    const accessCookie = cookieStore.get(`gallery_access_${gallery.id}`)
    
    console.log('[view-live] Cookie check:', {
      hasCookie: !!accessCookie,
      cookieValue: accessCookie?.value,
    })
    
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

  const imagesWithUrls = images.map((img, index) => {
    const urls = signedUrls.get(img.storage_path)
    // Use proxy URL for SEO-friendly filenames on right-click save
    const proxyUrl = getProxyImageUrl(gallery.id, img.id)
    const seoFilename = getSeoDownloadFilename(gallery.title, index + 1, 'jpg')
    
    return {
      id: img.id,
      url: urls?.preview || urls?.thumbnail || '', // Prefer preview (1920px) for editorial
      thumbnailUrl: urls?.thumbnail || '',
      // SEO proxy URL for downloads
      proxyUrl,
      seoFilename,
      width: img.width,
      height: img.height,
    }
  })

  // Server-Side Layout Generation
  const engine = new LayoutEngine()
  const spreads = engine.createLayout(imagesWithUrls, gallery.title)

  // Extract presentation data if available
  const presentationData = (gallery as { presentation_data?: { 
    location?: string
    eventDate?: string 
  } }).presentation_data

  // Get first 4 images for share card preview
  const previewImages = imagesWithUrls.slice(0, 4).map(img => ({
    id: img.id,
    url: img.url,
  }))

  // Base URL for structured data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.12img.com'
  const galleryUrl = `${baseUrl}/view-live/${gallery.slug}`
  const photographerName = (gallery as { photographer_name?: string }).photographer_name || '12img'

  // Prepare images for structured data (first 10 for performance)
  const structuredDataImages = imagesWithUrls.slice(0, 10).map((img, index) => ({
    url: img.url,
    name: `${gallery.title} - Photo ${index + 1}`,
    description: `Photo ${index + 1} from ${gallery.title} by ${photographerName}`,
  }))

  return (
    <>
      <ImageGalleryJsonLd
        name={gallery.title}
        description={`${gallery.title} - a stunning photo gallery by ${photographerName}. Delivered with 12img.`}
        url={galleryUrl}
        images={structuredDataImages}
        author={{ name: photographerName }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: baseUrl },
          { name: 'Galleries', url: `${baseUrl}/profiles` },
          { name: gallery.title, url: galleryUrl },
        ]}
      />
      <EditorialViewer 
        spreads={spreads} 
        title={gallery.title} 
        galleryId={gallery.id}
        imageCount={images.length}
        eventDate={presentationData?.eventDate}
        location={presentationData?.location}
        previewImages={previewImages}
      />
    </>
  )
}
