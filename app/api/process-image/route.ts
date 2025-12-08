/**
 * Image Processing API Route
 * 
 * Receives requests to process uploaded images and generate derivatives.
 * Called asynchronously after upload confirmation.
 * 
 * In production, this would be replaced by a proper queue worker
 * (Supabase Edge Function, AWS Lambda, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { processImage } from '@/lib/processing/derivatives'

// Simple auth check - in production use proper API key validation
const PROCESSING_SECRET = process.env.PROCESSING_API_SECRET || 'dev-secret'

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('Authorization')
    if (authHeader !== `Bearer ${PROCESSING_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imageId, galleryId, storagePath } = body

    if (!imageId || !galleryId || !storagePath) {
      return NextResponse.json(
        { error: 'Missing required fields: imageId, galleryId, storagePath' },
        { status: 400 }
      )
    }

    console.log('[ProcessImage API] Processing request', { imageId, galleryId })

    // Process the image (generates all derivatives)
    const result = await processImage(imageId, galleryId, storagePath)

    if (result.success) {
      return NextResponse.json({
        success: true,
        derivatives: result.derivatives.length,
        message: `Generated ${result.derivatives.length} derivatives`,
      })
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[ProcessImage API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'image-processing' })
}
