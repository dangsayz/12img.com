import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ galleryId: string }>
}

/**
 * Public API to fetch paginated image URLs for a gallery.
 * Used for lazy loading images in public gallery views.
 * Only works for public galleries.
 */
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { galleryId } = await params
    
    // Verify gallery exists and is public
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, is_public')
      .eq('id', galleryId)
      .single()
    
    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }
    
    if (gallery.is_public === false) {
      return NextResponse.json({ error: 'Gallery is private' }, { status: 403 })
    }

    // Get pagination params
    const searchParams = request.nextUrl.searchParams
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = Math.min(parseInt(searchParams.get('limit') || '24'), 50) // Max 50 per request

    // Get images with pagination
    const { data: images, error: imagesError, count } = await supabaseAdmin
      .from('images')
      .select('id, storage_path, width, height, focal_x, focal_y', { count: 'exact' })
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
    
    if (imagesError) {
      console.error('Error fetching images:', imagesError)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    // Generate signed URLs for this batch
    const signedUrls = images && images.length > 0
      ? await getSignedUrlsWithSizes(images.map((img) => img.storage_path))
      : new Map()

    const imagesWithUrls = (images || []).map((img) => {
      const urls = signedUrls.get(img.storage_path)
      return {
        id: img.id,
        storagePath: img.storage_path,
        thumbnailUrl: urls?.thumbnail || '',
        previewUrl: urls?.preview || '',
        originalUrl: urls?.original || '',
        width: img.width,
        height: img.height,
        focalX: img.focal_x,
        focalY: img.focal_y,
      }
    })

    return NextResponse.json({
      images: imagesWithUrls,
      total: count || 0,
      offset,
      limit,
      hasMore: (count || 0) > offset + limit,
    })
  } catch (error) {
    console.error('Error in public gallery images API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
