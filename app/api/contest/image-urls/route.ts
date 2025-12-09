/**
 * API route to get signed URLs for contest image selection
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'

export async function POST(request: NextRequest) {
  try {
    const { paths } = await request.json()
    
    if (!paths || !Array.isArray(paths)) {
      return NextResponse.json({ error: 'Invalid paths' }, { status: 400 })
    }
    
    const signedUrls = await getSignedUrlsWithSizes(paths)
    
    // Convert Map to object for JSON serialization
    const urls: Record<string, { thumbnail: string; preview: string; original: string }> = {}
    signedUrls.forEach((value, key) => {
      urls[key] = value
    })
    
    return NextResponse.json({ urls })
  } catch (error) {
    console.error('[Contest] Image URLs error:', error)
    return NextResponse.json({ error: 'Failed to get URLs' }, { status: 500 })
  }
}
