import { NextRequest, NextResponse } from 'next/server'
import { getImageWithGallery } from '@/server/queries/image.queries'
import { getSignedDownloadUrl } from '@/lib/storage/signed-urls'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params
  
  // Get image with gallery info using admin client (bypasses RLS)
  const result = await getImageWithGallery(imageId)
  
  if (!result) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
  
  const { image, gallery } = result
  
  // Check if downloads are enabled for this gallery
  if (!gallery.download_enabled) {
    return NextResponse.json({ error: 'Downloads are disabled for this gallery' }, { status: 403 })
  }
  
  // Get the storage path and generate a signed URL for the original
  const storagePath = image.storage_path
  if (!storagePath) {
    return NextResponse.json({ error: 'Original image not available' }, { status: 404 })
  }
  
  try {
    // Generate signed URL for the original image (no transforms)
    const originalUrl = await getSignedDownloadUrl(storagePath)
    // Fetch the original image
    const imageResponse = await fetch(originalUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image')
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    
    // Generate SEO-friendly filename
    const slugify = (text: string) => text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50)
    
    const gallerySlug = slugify(gallery.title || 'gallery')
    const extension = contentType.includes('png') ? 'png' : 
                      contentType.includes('webp') ? 'webp' : 'jpg'
    const filename = `12img-${gallerySlug}-${image.original_filename || `photo-${imageId.slice(0, 8)}`}.${extension}`
    
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    console.error('Download error:', err)
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
  }
}
