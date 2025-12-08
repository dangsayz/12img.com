import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * Email click tracking endpoint.
 * Records the click event and redirects to the target URL.
 * 
 * Usage in email: href="https://12img.com/api/track/click/{emailId}?url={encodedTargetUrl}"
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')
  
  // Validate target URL
  if (!targetUrl) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // Decode and validate URL
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(targetUrl)
    // Basic URL validation
    new URL(decodedUrl)
  } catch {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  try {
    // Get client info for analytics
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Record the click event using the database function
    await supabaseAdmin.rpc('record_email_click', {
      p_email_log_id: emailId,
      p_link_url: decodedUrl,
      p_ip_address: ip,
      p_user_agent: userAgent
    })
    
    console.log(`[Email Tracking] Click recorded for email: ${emailId}, url: ${decodedUrl}`)
  } catch (error) {
    // Don't fail the redirect - just log the error
    console.error('[Email Tracking] Failed to record click:', error)
  }
  
  // Redirect to the target URL
  return NextResponse.redirect(decodedUrl)
}
