import { supabaseAdmin } from '@/lib/supabase/admin'
import { SIGNED_URL_EXPIRY, ARCHIVE_CONFIG } from '@/lib/utils/constants'

export async function getSignedDownloadUrl(
  storagePath: string,
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrl(storagePath, expiresIn)

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
  expiresIn: number = SIGNED_URL_EXPIRY.VIEW
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()

  console.log('[SignedUrls] Requesting URLs for paths:', paths.length)

  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrls(paths, expiresIn)

  if (error) {
    console.error('[SignedUrls] Error:', error)
    throw new Error(`Failed to create signed URLs: ${error.message}`)
  }

  console.log('[SignedUrls] Response data:', JSON.stringify(data, null, 2))

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
