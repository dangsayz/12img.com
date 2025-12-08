import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'

export const dynamic = 'force-dynamic'

/**
 * OG Image API - Returns the gallery cover image for social sharing
 * Facebook/Twitter/LinkedIn crawlers will fetch this URL for the og:image
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await params

  try {
    // Get gallery with cover image
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id, title, cover_image_id')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return new NextResponse('Gallery not found', { status: 404 })
    }

    // Get the cover image or first image
    let imageStoragePath: string | null = null

    if (gallery.cover_image_id) {
      const { data: coverImage } = await supabaseAdmin
        .from('images')
        .select('storage_path')
        .eq('id', gallery.cover_image_id)
        .single()
      
      imageStoragePath = coverImage?.storage_path || null
    }

    // If no cover image, get the first image
    if (!imageStoragePath) {
      const { data: firstImage } = await supabaseAdmin
        .from('images')
        .select('storage_path')
        .eq('gallery_id', galleryId)
        .order('position', { ascending: true })
        .limit(1)
        .single()
      
      imageStoragePath = firstImage?.storage_path || null
    }

    if (!imageStoragePath) {
      return new NextResponse('No images in gallery', { status: 404 })
    }

    // Get signed URL for the image (use COVER preset for optimal OG size)
    const signedUrls = await getSignedUrlsBatch([imageStoragePath], undefined, 'COVER')
    const imageUrl = signedUrls.get(imageStoragePath)

    if (!imageUrl) {
      return new NextResponse('Failed to generate image URL', { status: 500 })
    }

    // Fetch the actual image and proxy it
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      return new NextResponse('Failed to fetch image', { status: 500 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()
    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

    // Return the image with proper headers for social crawlers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=86400', // Cache for 1 hour client, 1 day CDN
      },
    })
  } catch (error) {
    console.error('OG image error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
