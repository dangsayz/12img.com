import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Email download tracking endpoint.
 * Records the download event and redirects to the actual download URL.
 * 
 * Usage in email: href="https://12img.com/api/track/download/{emailId}?url={encodedDownloadUrl}"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params
  const { searchParams } = new URL(request.url)
  const downloadUrl = searchParams.get('url')
  
  // Validate download URL
  if (!downloadUrl) {
    return new NextResponse('Download URL not provided', { status: 400 })
  }
  
  // Decode and validate URL
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(downloadUrl)
    // Basic URL validation
    new URL(decodedUrl)
  } catch {
    return new NextResponse('Invalid download URL', { status: 400 })
  }
  
  try {
    // Get client info for analytics
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Record the download event using the database function
    await supabaseAdmin.rpc('record_email_download', {
      p_email_log_id: emailId,
      p_ip_address: ip,
      p_user_agent: userAgent
    })
    
    console.log(`[Email Tracking] Download recorded for email: ${emailId}`)
  } catch (error) {
    // Don't fail the redirect - just log the error
    console.error('[Email Tracking] Failed to record download:', error)
  }
  
  // Redirect to the actual download URL
  return NextResponse.redirect(decodedUrl)
}
