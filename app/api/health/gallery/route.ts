import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedUrlsWithSizes } from '@/lib/storage/signed-urls'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Health check endpoint for gallery image loading.
 * Tests the full image loading pipeline:
 * 1. Database connectivity
 * 2. Storage bucket access
 * 3. Signed URL generation
 * 4. Image transform capability
 * 
 * Use with external monitoring (UptimeRobot, Checkly, etc.)
 * to get alerted when image loading breaks.
 * 
 * Returns 200 if healthy, 500 if any check fails.
 */
export async function GET() {
  const checks: {
    name: string
    status: 'pass' | 'fail'
    message?: string
    durationMs?: number
  }[] = []

  const startTime = Date.now()

  // Check 1: Database connectivity
  try {
    const dbStart = Date.now()
    const { data, error } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .limit(1)
    
    if (error) throw error
    
    checks.push({
      name: 'database',
      status: 'pass',
      durationMs: Date.now() - dbStart,
    })
  } catch (err) {
    checks.push({
      name: 'database',
      status: 'fail',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }

  // Check 2: Get a real image to test with
  let testImagePath: string | null = null
  try {
    const { data: image, error } = await supabaseAdmin
      .from('images')
      .select('storage_path')
      .limit(1)
      .single()
    
    if (error) throw error
    testImagePath = image?.storage_path || null
    
    checks.push({
      name: 'image_record',
      status: testImagePath ? 'pass' : 'fail',
      message: testImagePath ? undefined : 'No images in database',
    })
  } catch (err) {
    checks.push({
      name: 'image_record',
      status: 'fail',
      message: err instanceof Error ? err.message : 'Unknown error',
    })
  }

  // Check 3: Storage bucket access
  if (testImagePath) {
    try {
      const storageStart = Date.now()
      const { data, error } = await supabaseAdmin.storage
        .from('gallery-images')
        .createSignedUrl(testImagePath, 60)
      
      if (error) throw error
      if (!data?.signedUrl) throw new Error('No signed URL returned')
      
      checks.push({
        name: 'storage_signed_url',
        status: 'pass',
        durationMs: Date.now() - storageStart,
      })
    } catch (err) {
      checks.push({
        name: 'storage_signed_url',
        status: 'fail',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }

    // Check 4: Image transform (thumbnail generation)
    try {
      const transformStart = Date.now()
      const { data, error } = await supabaseAdmin.storage
        .from('gallery-images')
        .createSignedUrl(testImagePath, 60, {
          transform: {
            width: 600,
            quality: 80,
            resize: 'contain',
          },
        })
      
      if (error) throw error
      if (!data?.signedUrl) throw new Error('No transformed URL returned')
      
      checks.push({
        name: 'image_transform',
        status: 'pass',
        durationMs: Date.now() - transformStart,
      })
    } catch (err) {
      checks.push({
        name: 'image_transform',
        status: 'fail',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  // Check 5: Full signed URL pipeline
  if (testImagePath) {
    try {
      const pipelineStart = Date.now()
      const urls = await getSignedUrlsWithSizes([testImagePath])
      
      if (urls.size === 0) throw new Error('No URLs generated')
      
      const urlSet = urls.get(testImagePath)
      if (!urlSet?.thumbnail || !urlSet?.preview || !urlSet?.original) {
        throw new Error('Missing URL sizes')
      }
      
      checks.push({
        name: 'url_pipeline',
        status: 'pass',
        durationMs: Date.now() - pipelineStart,
      })
    } catch (err) {
      checks.push({
        name: 'url_pipeline',
        status: 'fail',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const allPassed = checks.every(c => c.status === 'pass')
  const totalDuration = Date.now() - startTime

  const response = {
    status: allPassed ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    totalDurationMs: totalDuration,
    checks,
  }

  return NextResponse.json(response, { 
    status: allPassed ? 200 : 500 
  })
}
