import { supabaseAdmin } from '@/lib/supabase/admin'
import { SIGNED_URL_EXPIRY, ARCHIVE_CONFIG, IMAGE_SIZES, ImageSizePreset } from '@/lib/utils/constants'

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
    for (let i = 0; i < paths.length; i += batchSize) {
      const batch = paths.slice(i, i + batchSize)
      const results = await Promise.all(
        batch.map(async (path) => {
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
              console.error('[SignedUrls] Error for path:', path, error?.message)
              return { path, url: null }
            }
            return { path, url: data.signedUrl }
          } catch (err) {
            console.error('[SignedUrls] Exception for path:', path, err)
            return { path, url: null }
          }
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
