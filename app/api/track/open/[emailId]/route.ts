import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// 1x1 transparent GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// Known bot/scanner user agent patterns that cause false opens
const BOT_PATTERNS = [
  /googleimageproxy/i,
  /google-safety/i,
  /barracuda/i,
  /proofpoint/i,
  /mimecast/i,
  /symantec/i,
  /mcafee/i,
  /fortigate/i,
  /sophos/i,
  /spamassassin/i,
  /mailscanner/i,
  /messagelabs/i,
  /ironport/i,
  /fireeye/i,
  /microsoft office outlook/i,
  /ms-office/i,
  /outlookpreview/i,
  /mozilla\/4\.0.*msie/i, // Old IE used by scanners
  /wget/i,
  /curl/i,
  /python/i,
  /java\//i,
  /bot/i,
  /crawler/i,
  /spider/i,
  /scanner/i,
]

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some(pattern => pattern.test(userAgent))
}

/**
 * Email open tracking endpoint.
 * Returns a 1x1 transparent GIF and records the open event.
 * Filters out bot/scanner requests to reduce false positives.
 * 
 * Usage in email: <img src="https://12img.com/api/track/open/{emailId}" />
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ emailId: string }> }
) {
  const { emailId } = await params
  
  try {
    // Get client info for analytics
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    
    // Skip recording if this looks like a bot/scanner
    if (isBot(userAgent)) {
      console.log(`[Email Tracking] Skipped bot open for email: ${emailId} (UA: ${userAgent.slice(0, 50)})`)
    } else {
      // Record the open event using the database function
      await supabaseAdmin.rpc('record_email_open', {
        p_email_log_id: emailId,
        p_ip_address: ip,
        p_user_agent: userAgent
      })
      
      console.log(`[Email Tracking] Open recorded for email: ${emailId}`)
    }
  } catch (error) {
    // Don't fail the request - just log the error
    console.error('[Email Tracking] Failed to record open:', error)
  }
  
  // Always return the tracking pixel
  return new NextResponse(TRACKING_PIXEL, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRACKING_PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
