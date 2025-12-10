/**
 * TURBO DOWNLOAD ENDPOINT - World-Class Download Speed
 * 
 * GET /api/gallery/[galleryId]/download-turbo
 * 
 * STATE-OF-THE-ART OPTIMIZATIONS:
 * 
 * 1. TRUE STREAMING - Bytes flow to client as they're generated
 *    - No server buffering (saves RAM, faster start)
 *    - Client sees download start immediately
 * 
 * 2. PARALLEL FETCHING - 10 images fetched simultaneously
 *    - 10x faster than sequential
 * 
 * 3. STORE-ONLY ZIP - No compression (level 0)
 *    - JPEGs already compressed, re-compressing wastes CPU
 *    - 5-10x faster ZIP creation
 * 
 * 4. CHUNKED TRANSFER - No Content-Length required
 *    - Streaming starts before we know final size
 * 
 * This is how Dropbox, Google Drive, and WeTransfer do it.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPassword } from '@/lib/utils/password'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { createStreamingZip } from '@/lib/download/streaming-zip'
import { getSeoArchiveFilename } from '@/lib/seo/image-urls'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Increase timeout for large galleries
export const maxDuration = 300 // 5 minutes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await params
  const password = request.nextUrl.searchParams.get('password')

  try {
    // Get gallery
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('*')
      .eq('id', galleryId)
      .single()

    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }

    // Check download permission
    if (!gallery.download_enabled) {
      return NextResponse.json(
        { error: 'Downloads are disabled for this gallery' },
        { status: 403 }
      )
    }

    // Authenticate/authorize
    let isAuthorized = false

    // Method 1: Owner
    const { userId: clerkId } = await auth()
    if (clerkId) {
      const user = await getOrCreateUserByClerkId(clerkId)
      if (user && user.id === gallery.user_id) {
        isAuthorized = true
      }
    }

    // Method 2: Password
    if (!isAuthorized && gallery.password_hash) {
      if (password) {
        const isValidPassword = await verifyPassword(password, gallery.password_hash)
        if (isValidPassword) {
          isAuthorized = true
        } else {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }
      } else {
        const sessionToken = request.cookies.get(`gallery_access_${galleryId}`)?.value
        if (!sessionToken) {
          return NextResponse.json({ error: 'Password required' }, { status: 401 })
        }
        isAuthorized = true
      }
    }

    // Method 3: Public gallery
    if (!gallery.password_hash) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('images')
      .select('id, storage_path, original_filename, position')
      .eq('gallery_id', galleryId)
      .order('position', { ascending: true })

    if (imagesError || !images || images.length === 0) {
      return NextResponse.json({ error: 'Gallery has no images' }, { status: 400 })
    }

    console.log(`[TurboDownload] Starting streaming download for ${images.length} images`)

    // Create streaming ZIP
    const stream = createStreamingZip({
      galleryId,
      galleryTitle: gallery.title,
      images,
      onProgress: (current, total) => {
        if (current % 50 === 0) {
          console.log(`[TurboDownload] Progress: ${current}/${total}`)
        }
      }
    })

    // SEO-friendly filename
    const archiveFilename = getSeoArchiveFilename(gallery.title)

    // Return streaming response
    // Note: No Content-Length because we're streaming (chunked transfer)
    return new Response(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${archiveFilename}"`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        // Tell browser this is a download
        'X-Content-Type-Options': 'nosniff',
      },
    })

  } catch (error) {
    console.error('[TurboDownload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    )
  }
}
