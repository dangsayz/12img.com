/**
 * Archive Download Endpoint
 * 
 * GET /api/download/[archiveId]
 * 
 * Returns a redirect to a signed download URL for the archive.
 * Supports authentication via:
 * 1. Clerk session (for gallery owners)
 * 2. Signed token in query param (for email links)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createHmac } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getArchiveDownloadUrl } from '@/server/services/archive.service'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'

// Token secret for signed download URLs
const TOKEN_SECRET = process.env.GALLERY_TOKEN_SECRET || ''

/**
 * Verify a signed download token.
 */
function verifyDownloadToken(archiveId: string, token: string, maxAgeMs = 7 * 24 * 60 * 60 * 1000): boolean {
  try {
    // Token format: timestamp:signature
    const [timestampStr, signature] = token.split(':')
    const timestamp = parseInt(timestampStr, 10)
    
    // Check expiry
    if (Date.now() - timestamp > maxAgeMs) {
      return false
    }
    
    // Verify signature
    const expectedSignature = createHmac('sha256', TOKEN_SECRET)
      .update(`${archiveId}:${timestamp}`)
      .digest('hex')
    
    return signature === expectedSignature
  } catch {
    return false
  }
}

/**
 * Generate a signed download token for an archive.
 * Used in email links.
 */
export function generateDownloadToken(archiveId: string): string {
  const timestamp = Date.now()
  const signature = createHmac('sha256', TOKEN_SECRET)
    .update(`${archiveId}:${timestamp}`)
    .digest('hex')
  return `${timestamp}:${signature}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  const { archiveId } = await params
  const token = request.nextUrl.searchParams.get('token')
  
  try {
    // Get archive info
    const { data: archive, error: archiveError } = await supabaseAdmin
      .from('gallery_archives')
      .select('*, galleries!inner(id, user_id, title, download_enabled)')
      .eq('id', archiveId)
      .eq('status', 'completed')
      .single()

    if (archiveError || !archive) {
      return NextResponse.json(
        { error: 'Archive not found or not ready' },
        { status: 404 }
      )
    }

    // Type the joined gallery data
    const gallery = archive.galleries as unknown as {
      id: string
      user_id: string
      title: string
      download_enabled: boolean
    }

    // Check download permission
    if (!gallery.download_enabled) {
      return NextResponse.json(
        { error: 'Downloads are disabled for this gallery' },
        { status: 403 }
      )
    }

    // Authenticate the request
    let isAuthorized = false

    // Method 1: Check signed token (for email links)
    if (token && verifyDownloadToken(archiveId, token)) {
      isAuthorized = true
    }

    // Method 2: Check Clerk session (for owners/logged-in users)
    if (!isAuthorized) {
      const { userId: clerkId } = await auth()
      if (clerkId) {
        const user = await getOrCreateUserByClerkId(clerkId)
        if (user && user.id === gallery.user_id) {
          isAuthorized = true
        }
      }
    }

    // Method 3: For public galleries, allow download without auth
    // (This could be controlled by a gallery setting)
    // For now, we require either token or owner auth

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate signed download URL
    const downloadUrl = await getArchiveDownloadUrl(archive.storage_path)

    // Log download
    console.log('[Download] Archive downloaded', {
      archiveId,
      galleryId: gallery.id,
      method: token ? 'token' : 'session',
    })

    // Redirect to signed URL
    return NextResponse.redirect(downloadUrl)
  } catch (error) {
    console.error('[Download] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}

/**
 * HEAD request to check if archive is ready without downloading.
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ archiveId: string }> }
) {
  const { archiveId } = await params
  
  const { data: archive, error } = await supabaseAdmin
    .from('gallery_archives')
    .select('status, file_size_bytes')
    .eq('id', archiveId)
    .single()

  if (error || !archive) {
    return new NextResponse(null, { status: 404 })
  }

  if (archive.status !== 'completed') {
    return new NextResponse(null, { 
      status: 202, // Accepted but not ready
      headers: {
        'X-Archive-Status': archive.status,
      }
    })
  }

  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Content-Length': String(archive.file_size_bytes || 0),
      'Content-Type': 'application/zip',
    }
  })
}
