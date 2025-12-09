import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params
  
  const supabase = createServerClient()
  
  // Get image details
  const { data: image, error } = await supabase
    .from('images')
    .select(`
      id,
      original_url,
      file_name,
      galleries!inner (
        id,
        title,
        slug,
        download_enabled
      )
    `)
    .eq('id', imageId)
    .single()
  
  if (error || !image) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })
  }
  
  // Check if downloads are enabled for this gallery
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gallery = (image.galleries as any)
  if (!gallery?.download_enabled) {
    return NextResponse.json({ error: 'Downloads are disabled for this gallery' }, { status: 403 })
  }
  
  // Get the original image URL
  const originalUrl = image.original_url
  if (!originalUrl) {
    return NextResponse.json({ error: 'Original image not available' }, { status: 404 })
  }
  
  try {
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
    const filename = `12img-${gallerySlug}-${image.file_name || `photo-${imageId.slice(0, 8)}`}.${extension}`
    
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
