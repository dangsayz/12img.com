/**
 * Gallery Download Endpoint
 * 
 * GET /api/gallery/[galleryId]/download
 * 
 * Downloads all images from a gallery as a ZIP file.
 * Creates ZIP on-the-fly for simplicity.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { verifyPassword } from '@/lib/utils/password'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import archiver from 'archiver'
import { SIGNED_URL_EXPIRY } from '@/lib/utils/constants'
import { getSeoDownloadFilename, getSeoArchiveFilename } from '@/lib/seo/image-urls'

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
      return NextResponse.json(
        { error: 'Gallery not found' },
        { status: 404 }
      )
    }

    // Check download permission
    if (!gallery.download_enabled) {
      return NextResponse.json(
        { error: 'Downloads are disabled for this gallery' },
        { status: 403 }
      )
    }

    // Authenticate/authorize the request
    let isAuthorized = false

    // Method 1: Check if user is owner
    const { userId: clerkId } = await auth()
    if (clerkId) {
      const user = await getOrCreateUserByClerkId(clerkId)
      if (user && user.id === gallery.user_id) {
        isAuthorized = true
      }
    }

    // Method 2: Password authentication for password-protected galleries
    if (!isAuthorized && gallery.password_hash) {
      if (password) {
        const isValidPassword = await verifyPassword(password, gallery.password_hash)
        if (isValidPassword) {
          isAuthorized = true
        } else {
          return NextResponse.json(
            { error: 'Invalid password' },
            { status: 401 }
          )
        }
      } else {
        // Check for session cookie (set when user unlocks gallery in UI)
        const sessionToken = request.cookies.get(`gallery_access_${galleryId}`)?.value
        if (!sessionToken) {
          return NextResponse.json(
            { error: 'Password required' },
            { status: 401 }
          )
        }
        isAuthorized = true
      }
    }

    // Method 3: Public gallery (no password required)
    if (!gallery.password_hash) {
      isAuthorized = true
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get images
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('position', { ascending: true })

    if (imagesError || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'Gallery has no images' },
        { status: 400 }
      )
    }

    // Fetch all images first
    console.log(`[Download] Fetching ${images.length} images...`)
    const imageBuffers: { filename: string; buffer: Buffer }[] = []
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      
      try {
        // Get signed URL for the image
        const { data: signedData, error: signedError } = await supabaseAdmin.storage
          .from('gallery-images')
          .createSignedUrl(image.storage_path, SIGNED_URL_EXPIRY.DOWNLOAD)

        if (signedError || !signedData) {
          console.error(`[Download] Failed to get signed URL for image ${image.id}:`, signedError)
          continue
        }

        // Fetch the image
        const response = await fetch(signedData.signedUrl)
        if (!response.ok) {
          console.error(`[Download] Failed to fetch image ${image.id}: ${response.status}`)
          continue
        }

        const arrayBuffer = await response.arrayBuffer()
        // SEO-friendly filename: 12img-{gallery-slug}-photo-001.jpg
        const extension = image.original_filename?.split('.').pop() || 'jpg'
        const filename = getSeoDownloadFilename(gallery.title, i + 1, extension)
        imageBuffers.push({ filename, buffer: Buffer.from(arrayBuffer) })
        console.log(`[Download] Fetched image ${i + 1}/${images.length}`)
      } catch (err) {
        console.error(`[Download] Error fetching image ${image.id}:`, err)
      }
    }

    if (imageBuffers.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch any images' },
        { status: 500 }
      )
    }

    // Create ZIP
    console.log(`[Download] Creating ZIP with ${imageBuffers.length} images...`)
    const archive = archiver('zip', { zlib: { level: 6 } })
    const chunks: Buffer[] = []

    // Create promise to wait for archive completion
    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('end', () => {
        console.log('[Download] Archive complete')
        resolve(Buffer.concat(chunks))
      })
      archive.on('error', (err) => {
        console.error('[Download] Archive error:', err)
        reject(err)
      })
    })

    // Add all images to archive
    for (const { filename, buffer } of imageBuffers) {
      archive.append(buffer, { name: filename })
    }

    // Finalize and wait
    archive.finalize()
    const zipBuffer = await archivePromise
    
    console.log(`[Download] ZIP size: ${zipBuffer.length} bytes`)
    
    // SEO-friendly archive filename: 12img-{gallery-slug}-gallery-{date}.zip
    const archiveFilename = getSeoArchiveFilename(gallery.title)

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${archiveFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('[GalleryDownload] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process download request' },
      { status: 500 }
    )
  }
}
