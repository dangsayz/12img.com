/**
 * ============================================================================
 * SIGNED URL GENERATION - Cost Optimized (No Transformations)
 * ============================================================================
 * 
 * This module handles signed URL generation for Supabase Storage images.
 * 
 * IMPORTANT: We DO NOT use Supabase image transformations!
 * Supabase charges per transformation and has strict limits (100/month on Pro).
 * Instead, we serve original images and let Next.js Image optimize them
 * on Vercel's edge network (free with Vercel hosting).
 * 
 * ARCHITECTURE:
 * - Get signed URLs for ORIGINAL images only (no transforms)
 * - Next.js <Image> component handles resizing via Vercel Image Optimization
 * - This eliminates Supabase transformation costs entirely
 * 
 * CACHING:
 * - Signed URLs expire after 1 hour (SIGNED_URL_EXPIRY.VIEW)
 * - Browser caches images via Cache-Control headers
 * - Vercel caches optimized images at the edge
 * 
 * @see lib/utils/constants.ts for IMAGE_SIZES configuration
 * ============================================================================
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { SIGNED_URL_EXPIRY, ARCHIVE_CONFIG, IMAGE_SIZES, ImageSizePreset } from '@/lib/utils/constants'
import type { DerivativeSizeCode, ProcessingStatus } from '@/types/database'

// Transform options for Supabase Storage image transformations
export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: number
  resize?: 'cover' | 'contain' | 'fill'
}

export async function getSignedDownloadUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW,
  transform?: ImageTransformOptions
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrl(storagePath, expiresIn, {
      transform: transform ? {
        width: transform.width,
        height: transform.height,
        quality: transform.quality,
        resize: transform.resize || 'contain',
      } : undefined,
    })

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

export async function getSignedUploadUrl(
  storagePath: string
): Promise<{ signedUrl: string; token: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUploadUrl(storagePath)

  if (error) {
    throw new Error(`Failed to create upload URL: ${error.message}`)
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
  }
}

/**
 * Get signed URLs for original images (NO transformations)
 * 
 * We don't use Supabase transforms to avoid hitting their 100/month limit.
 * Next.js Image component handles resizing on Vercel's edge (free).
 */
export async function getSignedUrlsBatch(
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW,
  _sizePreset: ImageSizePreset = 'ORIGINAL' // Size preset ignored - always get original
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()

  console.log('[SignedUrls] Requesting ORIGINAL URLs (no transforms) for:', paths.length, 'images')

  // ALWAYS use batch endpoint with NO transforms to avoid Supabase charges
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrls(paths, expiresIn)

  if (error) {
    console.error('[SignedUrls] Error:', error)
    throw new Error(`Failed to create signed URLs: ${error.message}`)
  }

  const urlMap = new Map<string, string>()
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap.set(item.path, item.signedUrl)
    } else if (item.error) {
      console.error('[SignedUrls] Error for path:', item.path, item.error)
    }
  }

  console.log('[SignedUrls] URL map size:', urlMap.size)
  return urlMap
}

/**
 * Get URLs for images - returns same URL for all sizes
 * 
 * COST OPTIMIZATION: We only fetch ONE URL per image (the original).
 * Next.js Image component handles resizing on Vercel's edge for FREE.
 * This eliminates Supabase's transformation charges entirely.
 * 
 * Previously: 3 URLs per image × transforms = 3 Supabase transformations
 * Now: 1 URL per image × no transforms = 0 Supabase transformations
 */
export async function getSignedUrlsWithSizes(
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW
): Promise<Map<string, { thumbnail: string; preview: string; original: string }>> {
  if (paths.length === 0) return new Map()

  console.log('[SignedUrls] Getting ORIGINAL URLs for:', paths.length, '(Next.js handles resizing)')

  // Get ONE URL per image - no transformations
  const originalUrls = await getSignedUrlsBatch(paths, expiresIn, 'ORIGINAL')

  const result = new Map<string, { thumbnail: string; preview: string; original: string }>()
  for (const path of paths) {
    const url = originalUrls.get(path)
    
    if (url) {
      // Use the same original URL for all sizes
      // Next.js <Image> component will handle resizing via Vercel Image Optimization
      result.set(path, { 
        thumbnail: url, 
        preview: url, 
        original: url 
      })
    } else {
      console.error('[SignedUrls] Failed to get URL for path:', path)
    }
  }
  
  // Log summary
  const failedCount = paths.length - result.size
  if (failedCount > 0) {
    console.warn(`[SignedUrls] ${failedCount}/${paths.length} paths failed to get URLs`)
  }

  return result
}

/**
 * Get a signed download URL for an archive from the archives bucket.
 */
export async function getSignedArchiveUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY.ARCHIVE_EMAIL
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(ARCHIVE_CONFIG.BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    throw new Error(`Failed to create archive signed URL: ${error.message}`)
  }

  return data.signedUrl
}

// ─────────────────────────────────────────────────────────────
// DERIVATIVE URL FETCHING
// ─────────────────────────────────────────────────────────────

export interface ImageDerivatives {
  xs?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  original: string
}

export interface ImageWithDerivatives {
  id: string
  galleryId: string
  originalFilename: string
  width: number | null
  height: number | null
  position: number
  processingStatus: ProcessingStatus
  derivatives: ImageDerivatives
}

/**
 * Get images with their derivative URLs for a gallery
 * Falls back to on-the-fly transforms if derivatives aren't ready
 */
export async function getGalleryImagesWithDerivatives(
  galleryId: string,
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW
): Promise<ImageWithDerivatives[]> {
  // 1. Fetch images with their derivatives
  const { data: images, error: imagesError } = await supabaseAdmin
    .from('images')
    .select(`
      id,
      gallery_id,
      storage_path,
      original_filename,
      width,
      height,
      position,
      processing_status,
      photo_derivatives (
        size_code,
        storage_path,
        status
      )
    `)
    .eq('gallery_id', galleryId)
    .order('position', { ascending: true })

  if (imagesError) {
    console.error('[SignedUrls] Error fetching images:', imagesError)
    throw new Error(`Failed to fetch images: ${imagesError.message}`)
  }

  if (!images || images.length === 0) {
    return []
  }

  // 2. Build result with signed URLs
  const results: ImageWithDerivatives[] = []

  for (const image of images) {
    const derivatives: ImageDerivatives = {
      original: '', // Will be set below
    }

    // Get ready derivatives
    const readyDerivatives = (image.photo_derivatives || [])
      .filter((d: any) => d.status === 'ready')

    // If we have pre-generated derivatives, use them
    if (readyDerivatives.length > 0) {
      // Generate signed URLs for each derivative
      for (const deriv of readyDerivatives) {
        const { data } = await supabaseAdmin.storage
          .from('gallery-images')
          .createSignedUrl(deriv.storage_path, expiresIn)
        
        if (data?.signedUrl) {
          derivatives[deriv.size_code as DerivativeSizeCode] = data.signedUrl
        }
      }
    }
    // NOTE: We no longer use on-the-fly transforms as fallback
    // This was burning through Supabase's 100/month transformation limit
    // Next.js Image component handles resizing for free on Vercel

    // Get original URL (no transforms)
    const { data: originalData } = await supabaseAdmin.storage
      .from('gallery-images')
      .createSignedUrl(image.storage_path, expiresIn)
    
    const originalUrl = originalData?.signedUrl || ''
    derivatives.original = originalUrl
    
    // If no pre-generated derivatives, use original for all sizes
    // Next.js <Image> will resize them on Vercel's edge (free)
    if (!derivatives.sm) derivatives.sm = originalUrl
    if (!derivatives.lg) derivatives.lg = originalUrl

    results.push({
      id: image.id,
      galleryId: image.gallery_id,
      originalFilename: image.original_filename,
      width: image.width,
      height: image.height,
      position: image.position,
      processingStatus: image.processing_status as ProcessingStatus,
      derivatives,
    })
  }

  return results
}

/**
 * Get derivative URLs for a single image
 */
export async function getImageDerivatives(
  imageId: string,
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW
): Promise<ImageDerivatives | null> {
  const { data: image, error } = await supabaseAdmin
    .from('images')
    .select(`
      storage_path,
      photo_derivatives (
        size_code,
        storage_path,
        status
      )
    `)
    .eq('id', imageId)
    .single()

  if (error || !image) {
    return null
  }

  const derivatives: ImageDerivatives = {
    original: '',
  }

  // Get ready derivatives
  const readyDerivatives = (image.photo_derivatives || [])
    .filter((d: any) => d.status === 'ready')

  for (const deriv of readyDerivatives) {
    const { data } = await supabaseAdmin.storage
      .from('gallery-images')
      .createSignedUrl(deriv.storage_path, expiresIn)
    
    if (data?.signedUrl) {
      derivatives[deriv.size_code as DerivativeSizeCode] = data.signedUrl
    }
  }

  // Original
  const { data: originalData } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrl(image.storage_path, expiresIn)
  
  derivatives.original = originalData?.signedUrl || ''

  return derivatives
}
