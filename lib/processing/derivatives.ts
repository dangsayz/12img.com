/**
 * Derivative Processing Service
 * 
 * Generates pre-sized derivatives for uploaded images.
 * Called by the Supabase Edge Function or API route.
 */

import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { DERIVATIVE_SPECS, getDerivativePath, PROCESSING_CONFIG } from './constants'
import type { DerivativeSizeCode, ProcessingStatus } from '@/types/database'

// Logger
const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[Derivatives] ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg: string, err?: unknown, data?: Record<string, unknown>) =>
    console.error(`[Derivatives] ERROR: ${msg}`, err, data ? JSON.stringify(data) : ''),
}

export interface ProcessImageResult {
  success: boolean
  derivatives: {
    sizeCode: DerivativeSizeCode
    storagePath: string
    width: number
    height: number
    byteSize: number
  }[]
  error?: string
}

/**
 * Process a single image and generate all derivatives
 */
export async function processImage(
  imageId: string,
  galleryId: string,
  originalStoragePath: string
): Promise<ProcessImageResult> {
  log.info('Starting derivative generation', { imageId, galleryId })

  try {
    // 1. Update status to processing
    await updateImageStatus(imageId, 'processing')

    // 2. Download original image
    const { data: originalData, error: downloadError } = await supabaseAdmin.storage
      .from('gallery-images')
      .download(originalStoragePath)

    if (downloadError || !originalData) {
      throw new Error(`Failed to download original: ${downloadError?.message}`)
    }

    // 3. Convert to buffer for Sharp
    const originalBuffer = Buffer.from(await originalData.arrayBuffer())

    // 4. Get image metadata
    const metadata = await sharp(originalBuffer).metadata()
    const originalWidth = metadata.width || 0
    const originalHeight = metadata.height || 0

    log.info('Original image metadata', { 
      imageId, 
      width: originalWidth, 
      height: originalHeight,
      format: metadata.format 
    })

    // 5. Generate derivatives in parallel (with concurrency limit)
    const derivatives: ProcessImageResult['derivatives'] = []
    const errors: string[] = []

    // Process in batches to control memory
    for (let i = 0; i < DERIVATIVE_SPECS.length; i += PROCESSING_CONFIG.MAX_CONCURRENT_DERIVATIVES) {
      const batch = DERIVATIVE_SPECS.slice(i, i + PROCESSING_CONFIG.MAX_CONCURRENT_DERIVATIVES)
      
      const batchResults = await Promise.allSettled(
        batch.map(spec => generateDerivative(
          imageId,
          galleryId,
          originalBuffer,
          spec.code,
          spec.width,
          spec.quality,
          originalWidth,
          originalHeight
        ))
      )

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          derivatives.push(result.value)
        } else {
          errors.push(result.reason?.message || 'Unknown error')
        }
      }
    }

    // 6. Update image status
    if (errors.length === 0) {
      await updateImageStatus(imageId, 'ready')
      log.info('Derivative generation complete', { imageId, count: derivatives.length })
    } else if (derivatives.length > 0) {
      // Partial success - some derivatives generated
      await updateImageStatus(imageId, 'ready')
      log.info('Derivative generation partial success', { 
        imageId, 
        success: derivatives.length, 
        failed: errors.length 
      })
    } else {
      // Complete failure
      await updateImageStatus(imageId, 'failed')
      throw new Error(`All derivatives failed: ${errors.join(', ')}`)
    }

    return { success: true, derivatives }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Derivative generation failed', err, { imageId })
    
    await updateImageStatus(imageId, 'failed')
    
    return { success: false, derivatives: [], error: errorMessage }
  }
}

/**
 * Generate a single derivative at the specified size
 */
async function generateDerivative(
  imageId: string,
  galleryId: string,
  originalBuffer: Buffer,
  sizeCode: DerivativeSizeCode,
  targetWidth: number,
  quality: number,
  originalWidth: number,
  originalHeight: number
): Promise<ProcessImageResult['derivatives'][0]> {
  
  // Don't upscale - if original is smaller than target, use original size
  const width = Math.min(targetWidth, originalWidth)
  
  // Calculate height maintaining aspect ratio
  const aspectRatio = originalHeight / originalWidth
  const height = Math.round(width * aspectRatio)

  log.info('Generating derivative', { imageId, sizeCode, width, height })

  // Process with Sharp
  const derivativeBuffer = await sharp(originalBuffer)
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .rotate() // Auto-rotate based on EXIF
    .jpeg({ quality, progressive: true })
    .toBuffer()

  const byteSize = derivativeBuffer.length
  const storagePath = getDerivativePath(galleryId, imageId, sizeCode)

  // Upload to storage
  const { error: uploadError } = await supabaseAdmin.storage
    .from('gallery-images')
    .upload(storagePath, derivativeBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload ${sizeCode}: ${uploadError.message}`)
  }

  // Record in database
  await supabaseAdmin.from('photo_derivatives').upsert({
    photo_id: imageId,
    size_code: sizeCode,
    storage_path: storagePath,
    width,
    height,
    byte_size: byteSize,
    is_watermarked: false,
    status: 'ready' as ProcessingStatus,
  }, {
    onConflict: 'photo_id,size_code,is_watermarked',
  })

  log.info('Derivative uploaded', { imageId, sizeCode, storagePath, byteSize })

  return { sizeCode, storagePath, width, height, byteSize }
}

/**
 * Update image processing status
 */
async function updateImageStatus(imageId: string, status: ProcessingStatus): Promise<void> {
  const { error } = await supabaseAdmin
    .from('images')
    .update({ processing_status: status })
    .eq('id', imageId)

  if (error) {
    log.error('Failed to update image status', error, { imageId, status })
  }
}

/**
 * Queue an image for processing
 * Called after upload confirmation
 */
export async function queueImageForProcessing(
  imageId: string,
  galleryId: string,
  storagePath: string
): Promise<void> {
  log.info('Queueing image for processing', { imageId, galleryId })

  // For now, process synchronously via API route
  // In production, this would push to a queue (SQS, Redis, etc.)
  
  // Call the processing API endpoint
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    const response = await fetch(`${baseUrl}/api/process-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PROCESSING_API_SECRET || 'dev-secret'}`,
      },
      body: JSON.stringify({ imageId, galleryId, storagePath }),
    })

    if (!response.ok) {
      log.error('Failed to queue processing', null, { 
        imageId, 
        status: response.status 
      })
    }
  } catch (err) {
    // Don't fail the upload if processing queue fails
    // Image will remain in 'pending' status and can be retried
    log.error('Failed to call processing API', err, { imageId })
  }
}

/**
 * Reprocess an image (regenerate all derivatives)
 */
export async function reprocessImage(imageId: string): Promise<ProcessImageResult> {
  // Get image details
  const { data: image, error } = await supabaseAdmin
    .from('images')
    .select('id, gallery_id, storage_path')
    .eq('id', imageId)
    .single()

  if (error || !image) {
    return { success: false, derivatives: [], error: 'Image not found' }
  }

  // Delete existing derivatives
  await supabaseAdmin
    .from('photo_derivatives')
    .delete()
    .eq('photo_id', imageId)

  // Increment processing version
  await supabaseAdmin
    .from('images')
    .update({ processing_version: supabaseAdmin.rpc('increment_processing_version', { p_image_id: imageId }) })
    .eq('id', imageId)

  // Reprocess
  return processImage(imageId, image.gallery_id, image.storage_path)
}
