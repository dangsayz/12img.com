'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { v4 as uuidv4 } from 'uuid'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedUploadUrl } from '@/lib/storage/signed-urls'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MIME_TO_EXT } from '@/lib/utils/constants'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { verifyGalleryOwnership, getGalleryById } from '@/server/queries/gallery.queries'

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

  const responses: UploadUrlResponse[] = []

  for (const file of request.files) {
    // Validate
    if (file.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${file.originalFilename}`)
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType as typeof ALLOWED_MIME_TYPES[number])) {
      throw new Error(`Invalid file type: ${file.mimeType}`)
    }

    const imageId = uuidv4()
    const ext = MIME_TO_EXT[file.mimeType]
    const storagePath = `${request.galleryId}/${imageId}.${ext}`

    const { signedUrl, token } = await getSignedUploadUrl(storagePath)

    responses.push({
      localId: file.localId,
      storagePath,
      signedUrl,
      token,
    })
  }

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

  const imageIds: string[] = []

  for (const upload of request.uploads) {
    // Insert into database using function for proper positioning
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

    imageIds.push(data)
  }

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
    revalidatePath(`/g/${gallery.slug}`)
  }
  revalidatePath(`/gallery/${request.galleryId}/upload`)
  revalidatePath('/')

  return { imageIds }
}
