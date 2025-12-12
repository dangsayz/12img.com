import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createHash } from 'crypto'

/**
 * Gallery view tracking endpoint.
 * Called from client-side when a gallery is viewed.
 * Uses visitor fingerprinting for deduplication (privacy-safe hash).
 * 
 * POST /api/track/view/[galleryId]
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await params
  
  try {
    // Get client info for visitor identification
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null
    
    // Create privacy-safe visitor ID (hash of IP + UA)
    const visitorId = createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex')
      .substring(0, 16)
    
    // Verify gallery exists (lightweight check)
    const { data: gallery, error: galleryError } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('id', galleryId)
      .single()
    
    if (galleryError || !gallery) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 })
    }
    
    // Record the view using database function
    const { data, error } = await supabaseAdmin.rpc('record_gallery_view', {
      p_gallery_id: galleryId,
      p_visitor_id: visitorId,
      p_ip_address: ip,
      p_user_agent: userAgent.substring(0, 500), // Truncate for storage
      p_referrer: referrer?.substring(0, 500) || null
    })
    
    if (error) {
      console.error('[Gallery View Tracking] Error:', error)
      // Don't expose internal errors
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ 
      success: true,
      isNewVisitor: data // Function returns boolean
    })
  } catch (error) {
    console.error('[Gallery View Tracking] Error:', error)
    // Always return success to not block the user experience
    return NextResponse.json({ success: true })
  }
}

// Also support GET for simple pixel tracking (1x1 transparent GIF)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  const { galleryId } = await params
  
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null
    
    const visitorId = createHash('sha256')
      .update(`${ip}:${userAgent}`)
      .digest('hex')
      .substring(0, 16)
    
    // Fire and forget - don't wait for response
    void supabaseAdmin.rpc('record_gallery_view', {
      p_gallery_id: galleryId,
      p_visitor_id: visitorId,
      p_ip_address: ip,
      p_user_agent: userAgent.substring(0, 500),
      p_referrer: referrer?.substring(0, 500) || null
    }).then(({ error }) => {
      if (error) console.error('[Gallery View Tracking] Error:', error)
    })
    
  } catch (error) {
    console.error('[Gallery View Tracking] Error:', error)
  }
  
  // Return 1x1 transparent GIF
  const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  
  return new NextResponse(gif, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}
