import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * SEO-optimized image proxy
 * 
 * Serves images with branded, keyword-rich filenames for SEO.
 * When users right-click → Save As, they get:
 * "12img-gallery-photo-001.jpg" instead of "uuid-uuid-uuid.jpg"
 * 
 * URL formats:
 * - /api/img/{storage-path} - Direct storage path access
 * - /api/img/g/{galleryId}/{imageId} - Gallery image with SEO filename
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    
    if (!path || path.length < 1) {
      return new NextResponse('Invalid path', { status: 400 })
    }

    // Check if this is a gallery image request: /api/img/g/{galleryId}/{imageId}
    if (path[0] === 'g' && path.length >= 3) {
      return handleGalleryImage(path[1], path[2])
    }

    // Otherwise, treat as direct storage path: /api/img/{userId}/{galleryId}/{filename}
    const storagePath = path.join('/')
    return handleDirectImage(storagePath, request)
  } catch (error) {
    console.error('[ImageProxy] Error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

/**
 * Handle gallery image with SEO filename lookup
 */
async function handleGalleryImage(galleryId: string, imageId: string) {
  // Fetch image details from database
  const { data: image, error: imageError } = await supabaseAdmin
    .from('images')
    .select(`
      id,
      storage_path,
      original_filename,
      position,
      gallery:galleries!inner (
        id,
        title,
        user_id
      )
    `)
    .eq('id', imageId)
    .eq('gallery_id', galleryId)
    .single()

  if (imageError || !image) {
    return new NextResponse('Image not found', { status: 404 })
  }

  // Get the actual image from Supabase storage
  const { data: fileData, error: fileError } = await supabaseAdmin.storage
    .from('gallery-images')
    .download(image.storage_path)

  if (fileError || !fileData) {
    console.error('[ImageProxy] Storage error:', fileError)
    return new NextResponse('Failed to fetch image', { status: 500 })
  }

  // Generate SEO-friendly filename
  const galleryTitle = (image.gallery as any)?.title || 'gallery'
  const position = image.position || 1
  const extension = getExtension(image.original_filename || image.storage_path)
  const seoFilename = generateSeoFilename(galleryTitle, position, extension)
  const contentType = getContentType(extension)

  return new NextResponse(fileData, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${seoFilename}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

/**
 * Handle direct storage path image with SEO filename from query param
 */
async function handleDirectImage(storagePath: string, request: NextRequest) {
  // Get optional SEO filename from query param
  const seoFilename = request.nextUrl.searchParams.get('filename') || undefined
  
  // Get the image from Supabase storage
  const { data: fileData, error: fileError } = await supabaseAdmin.storage
    .from('gallery-images')
    .download(storagePath)

  if (fileError || !fileData) {
    console.error('[ImageProxy] Storage error for path:', storagePath, fileError)
    return new NextResponse('Image not found', { status: 404 })
  }

  const extension = getExtension(storagePath)
  const contentType = getContentType(extension)
  const filename = seoFilename || `12img-photo.${extension}`

  return new NextResponse(fileData, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

/**
 * Generate SEO-friendly filename
 * Example: "12img-sarah-john-wedding-photo-001.jpg"
 */
function generateSeoFilename(galleryTitle: string, position: number, extension: string): string {
  // Slugify the gallery title
  const slug = galleryTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')          // Spaces to hyphens
    .replace(/-+/g, '-')           // Multiple hyphens to single
    .substring(0, 50)              // Limit length
    .replace(/^-|-$/g, '')         // Trim hyphens

  // Pad position for sorting
  const paddedPosition = String(position).padStart(3, '0')

  return `12img-${slug}-photo-${paddedPosition}.${extension}`
}

/**
 * Extract file extension
 */
function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  if (ext && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext
  }
  return 'jpg' // Default
}

/**
 * Get content type from extension
 */
function getContentType(extension: string): string {
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
  }
  return types[extension] || 'image/jpeg'
}
