'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedUploadUrl } from '@/lib/storage/signed-urls'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MIME_TO_EXT } from '@/lib/utils/constants'
import { getOrCreateUserByClerkId, getUserStorageUsage } from '@/server/queries/user.queries'
import { verifyGalleryOwnership, getGalleryById } from '@/server/queries/gallery.queries'
import { normalizePlanId, getStorageLimitBytes, getImageLimit } from '@/lib/config/pricing'

interface UploadFileMetadata {
  localId: string
  mimeType: string
  fileSize: number
  originalFilename: string
}

interface UploadUrlResponse {
  localId: string
  storagePath: string
  signedUrl: string
  token: string
}

export async function getExistingFilenames(galleryId: string): Promise<string[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const isOwner = await verifyGalleryOwnership(galleryId, user.id)
  if (!isOwner) throw new Error('Access denied')

  const { data, error } = await supabaseAdmin
    .from('images')
    .select('original_filename')
    .eq('gallery_id', galleryId)

  if (error) throw error
  return (data || []).map(img => img.original_filename)
}

export async function generateSignedUploadUrls(request: {
  galleryId: string
  files: UploadFileMetadata[]
}): Promise<UploadUrlResponse[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const isOwner = await verifyGalleryOwnership(request.galleryId, user.id)
  if (!isOwner) throw new Error('Access denied')

  // Get user's current usage and plan limits
  const usage = await getUserStorageUsage(clerkId)
  const planId = normalizePlanId(user.plan)
  
  // Calculate total size of this upload batch
  const batchSize = request.files.reduce((sum, f) => sum + f.fileSize, 0)
  const batchCount = request.files.length
  
  // Check storage limit
  const storageLimit = getStorageLimitBytes(planId)
  if (storageLimit !== Infinity && (usage.totalBytes + batchSize) > storageLimit) {
    const usedGB = (usage.totalBytes / (1024 * 1024 * 1024)).toFixed(1)
    const limitGB = storageLimit / (1024 * 1024 * 1024)
    throw new Error(`Storage limit exceeded. You've used ${usedGB}GB of ${limitGB}GB. Please upgrade your plan.`)
  }
  
  // Check image count limit
  const imageLimit = getImageLimit(planId)
  if (imageLimit !== Infinity && (usage.imageCount + batchCount) > imageLimit) {
    throw new Error(`Image limit exceeded. You have ${usage.imageCount} of ${imageLimit} images. Please upgrade your plan.`)
  }

  // Validate all files first
  for (const file of request.files) {
    if (file.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${file.originalFilename}`)
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      throw new Error(`Invalid file type: ${file.mimeType}`)
    }
  }

  // Generate all signed URLs in parallel for speed
  const responses = await Promise.all(
    request.files.map(async (file) => {
      const imageId = uuidv4()
      const ext = MIME_TO_EXT[file.mimeType]
      const storagePath = `${request.galleryId}/${imageId}.${ext}`

      const { signedUrl, token } = await getSignedUploadUrl(storagePath)

      return {
        localId: file.localId,
        storagePath,
        signedUrl,
        token,
      }
    })
  )

  return responses
}

interface ConfirmUploadData {
  storagePath: string
  token: string
  originalFilename: string
  fileSize: number
  mimeType: string
  width?: number
  height?: number
}

export async function confirmUploads(request: {
  galleryId: string
  uploads: ConfirmUploadData[]
}): Promise<{ imageIds: string[] }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const isOwner = await verifyGalleryOwnership(request.galleryId, user.id)
  if (!isOwner) throw new Error('Access denied')

  // Insert all images in parallel for speed
  const results = await Promise.all(
    request.uploads.map(async (upload) => {
      const { data, error } = await supabaseAdmin.rpc('insert_image_at_position', {
        p_gallery_id: request.galleryId,
        p_storage_path: upload.storagePath,
        p_original_filename: upload.originalFilename,
        p_file_size_bytes: upload.fileSize,
        p_mime_type: upload.mimeType,
        p_width: upload.width || null,
        p_height: upload.height || null,
      })

      if (error) throw new Error('Failed to save image')
      return data as string
    })
  )

  const imageIds = results

  // Set first image as cover if no cover exists
  const gallery = await getGalleryById(request.galleryId)
  if (gallery && !gallery.cover_image_id && imageIds.length > 0) {
    await supabaseAdmin
      .from('galleries')
      .update({ cover_image_id: imageIds[0] })
      .eq('id', request.galleryId)
  }

  // Revalidate paths
  if (gallery) {
    revalidatePath(`/view-reel/${gallery.id}`)
  }
  revalidatePath(`/gallery/${request.galleryId}/upload`)
  revalidatePath('/')

  return { imageIds }
}
