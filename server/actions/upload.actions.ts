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

  // Insert images SEQUENTIALLY to preserve upload order
  // The insert_image_at_position function uses row locking to get the next position
  const imageIds: string[] = []
  for (const upload of request.uploads) {
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
    imageIds.push(data as string)
  }

  // Set cover image if no cover exists - prefer vertical/portrait images
  const gallery = await getGalleryById(request.galleryId)
  if (gallery && !gallery.cover_image_id && imageIds.length > 0) {
    // Find a portrait image (height > width) for better cover display
    let coverImageId = imageIds[0] // fallback to first image
    
    for (let i = 0; i < request.uploads.length; i++) {
      const upload = request.uploads[i]
      if (upload.width && upload.height && upload.height > upload.width) {
        coverImageId = imageIds[i]
        break // Use first portrait image found
      }
    }
    
    await supabaseAdmin
      .from('galleries')
      .update({ cover_image_id: coverImageId })
      .eq('id', request.galleryId)
  }

  // Queue images for derivative processing (async, non-blocking)
  queueImagesForProcessing(
    imageIds,
    request.galleryId,
    request.uploads.map(u => u.storagePath)
  )

  // Revalidate paths
  if (gallery) {
    revalidatePath(`/view-reel/${gallery.slug}`)
  }
  revalidatePath(`/gallery/${request.galleryId}/upload`)
  revalidatePath('/')

  return { imageIds }
}

/**
 * Queue images for derivative processing
 * Fires and forgets - doesn't block upload confirmation
 */
async function queueImagesForProcessing(
  imageIds: string[],
  galleryId: string,
  storagePaths: string[]
): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const secret = process.env.PROCESSING_API_SECRET || 'dev-secret'

  // Process each image asynchronously
  for (let i = 0; i < imageIds.length; i++) {
    // Don't await - fire and forget
    fetch(`${baseUrl}/api/process-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify({
        imageId: imageIds[i],
        galleryId,
        storagePath: storagePaths[i],
      }),
    }).catch(err => {
      console.error('[Upload] Failed to queue processing for image:', imageIds[i], err)
    })
  }
}

/**
 * Update image positions for drag-and-drop reordering
 * Uses optimized batch update with Promise.all for speed
 */
export async function updateImagePositions(
  galleryId: string,
  positions: { imageId: string; position: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId: clerkId } = await auth()
    if (!clerkId) return { success: false, error: 'Unauthorized' }

    const user = await getOrCreateUserByClerkId(clerkId)
    if (!user) return { success: false, error: 'User not found' }

    const isOwner = await verifyGalleryOwnership(galleryId, user.id)
    if (!isOwner) return { success: false, error: 'Access denied' }

    // Batch update using Promise.all for parallel execution
    // This is much faster than sequential updates
    const updatePromises = positions.map(({ imageId, position }) =>
      supabaseAdmin
        .from('images')
        .update({ position })
        .eq('id', imageId)
        .eq('gallery_id', galleryId)
    )

    const results = await Promise.all(updatePromises)
    
    // Check for any errors
    const failedUpdate = results.find(r => r.error)
    if (failedUpdate?.error) {
      console.error('[updateImagePositions] Batch update failed:', failedUpdate.error)
      return { success: false, error: 'Failed to update positions' }
    }

    // Revalidate gallery pages
    revalidatePath(`/gallery/${galleryId}`)
    revalidatePath(`/gallery/${galleryId}/upload`)

    return { success: true }
  } catch (error) {
    console.error('[updateImagePositions] Error:', error)
    return { success: false, error: 'An error occurred' }
  }
}
