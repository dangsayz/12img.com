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

export async function getSignedUrlsBatch(
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW,
  sizePreset: ImageSizePreset = 'THUMBNAIL'
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()

  console.log('[SignedUrls] Requesting URLs for paths:', paths.length, 'size:', sizePreset)

  const transform = IMAGE_SIZES[sizePreset]
  
  // For transformed images, we need to create individual signed URLs
  // as createSignedUrls doesn't support transforms for all URLs
  if (transform) {
    const urlMap = new Map<string, string>()
    
    // Process in parallel batches to avoid overwhelming the API
    const batchSize = 20
    const maxRetries = 3
    
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (path) => {
          // Retry logic for transient failures
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const { data, error } = await supabaseAdmin.storage
                .from('gallery-images')
                .createSignedUrl(path, expiresIn, {
                  transform: {
                    width: transform.width,
                    quality: transform.quality,
                    resize: 'contain',
                  },
                })
              
              if (error || !data) {
                if (attempt < maxRetries) {
                  await new Promise(r => setTimeout(r, 100 * attempt)) // Backoff
                  continue
                }
                console.error('[SignedUrls] Error for path after retries:', path, error?.message)
                return { path, url: null }
              }
              return { path, url: data.signedUrl }
            } catch (err) {
              if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, 100 * attempt))
                continue
              }
              console.error('[SignedUrls] Exception for path after retries:', path, err)
              return { path, url: null }
            }
          }
          return { path, url: null }
        })
      )
      
      for (const { path, url } of results) {
        if (url) urlMap.set(path, url)
      }
    }
    
    console.log('[SignedUrls] URL map size:', urlMap.size)
    return urlMap
  }

  // For original (no transform), use batch endpoint
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
 * Get thumbnail, preview, and original URLs for images
 * - thumbnail: 400px for grid display (fast loading)
 * - preview: 1920px for fullscreen viewing (crisp but optimized)
 * - original: full resolution for downloads only
 */
export async function getSignedUrlsWithSizes(
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW
): Promise<Map<string, { thumbnail: string; preview: string; original: string }>> {
  if (paths.length === 0) return new Map()

  console.log('[SignedUrls] Getting thumbnail + preview + original URLs for:', paths.length)

  const [thumbnailUrls, previewUrls, originalUrls] = await Promise.all([
    getSignedUrlsBatch(paths, expiresIn, 'THUMBNAIL'),
    getSignedUrlsBatch(paths, expiresIn, 'PREVIEW'),
    getSignedUrlsBatch(paths, expiresIn, 'ORIGINAL'),
  ])

  const result = new Map<string, { thumbnail: string; preview: string; original: string }>()
  for (const path of paths) {
    const thumbnail = thumbnailUrls.get(path)
    const preview = previewUrls.get(path)
    const original = originalUrls.get(path)
    if (thumbnail && preview && original) {
      result.set(path, { thumbnail, preview, original })
    }
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
    } else {
      // Fallback to on-the-fly transforms (existing behavior)
      const sizes: { code: DerivativeSizeCode; width: number; quality: number }[] = [
        { code: 'sm', width: 400, quality: 75 },
        { code: 'lg', width: 1600, quality: 85 },
      ]

      for (const size of sizes) {
        const { data } = await supabaseAdmin.storage
          .from('gallery-images')
          .createSignedUrl(image.storage_path, expiresIn, {
            transform: {
              width: size.width,
              quality: size.quality,
              resize: 'contain',
            },
          })
        
        if (data?.signedUrl) {
          derivatives[size.code] = data.signedUrl
        }
      }
    }

    // Always get original URL
    const { data: originalData } = await supabaseAdmin.storage
      .from('gallery-images')
      .createSignedUrl(image.storage_path, expiresIn)
    
    derivatives.original = originalData?.signedUrl || ''

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
