import { supabaseAdmin } from '@/lib/supabase/admin'
import { SIGNED_URL_EXPIRY } from '@/lib/utils/constants'

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

  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrls(paths, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URLs: ${error.message}`)
  }

  const urlMap = new Map<string, string>()
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return urlMap
}
