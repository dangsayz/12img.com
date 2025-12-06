'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { getGalleryById, verifyGalleryOwnership } from '@/server/queries/gallery.queries'
import { getImageWithOwnershipCheck } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'

export async function deleteImage(imageId: string) {
  console.log('[deleteImage] Starting delete for image:', imageId)
  
  const { userId: clerkId } = await auth()
  if (!clerkId) {
    console.log('[deleteImage] No clerkId - unauthorized')
    return { error: 'Unauthorized' }
  }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    console.log('[deleteImage] User not found for clerkId:', clerkId)
    return { error: 'User not found' }
  }

  const image = await getImageWithOwnershipCheck(imageId, user.id)
  if (!image) {
    console.log('[deleteImage] Image not found or not owned:', imageId)
    return { error: 'Image not found' }
  }

  console.log('[deleteImage] Found image with storage_path:', image.storage_path)

  const gallery = await getGalleryById(image.gallery_id)

  // Delete from storage
  const { error: storageError } = await supabaseAdmin.storage
    .from('gallery-images')
    .remove([image.storage_path])

  if (storageError) {
    console.error('[deleteImage] Storage delete error:', storageError)
    // Continue anyway - we still want to remove the DB record
  }

  // Delete from database
  const { error } = await supabaseAdmin
    .from('images')
    .delete()
    .eq('id', imageId)

  if (error) {
    console.error('[deleteImage] DB delete error:', error)
    return { error: 'Failed to delete image' }
  }

  console.log('[deleteImage] Successfully deleted image from DB')

  // If this was the cover image, set new cover
  if (gallery && gallery.cover_image_id === imageId) {
    const { data: nextImage } = await supabaseAdmin
      .from('images')
      .select('id')
      .eq('gallery_id', gallery.id)
      .order('position', { ascending: true })
      .limit(1)
      .single()

    await supabaseAdmin
      .from('galleries')
      .update({ cover_image_id: nextImage?.id || null })
      .eq('id', gallery.id)
  }

  // Revalidate all relevant paths
  if (gallery) {
    revalidatePath(`/gallery/${gallery.id}`)
    revalidatePath(`/view-reel/${gallery.id}`)
  }
  revalidatePath('/')

  console.log('[deleteImage] Revalidation complete')

  return { success: true }
}

export async function setCoverImage(galleryId: string, imageId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const isOwner = await verifyGalleryOwnership(galleryId, user.id)
  if (!isOwner) return { error: 'Access denied' }

  // Verify image belongs to gallery
  const { data: image } = await supabaseAdmin
    .from('images')
    .select('id')
    .eq('id', imageId)
    .eq('gallery_id', galleryId)
    .single()

  if (!image) return { error: 'Image not found in gallery' }

  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ cover_image_id: imageId })
    .eq('id', galleryId)

  if (error) return { error: 'Failed to set cover image' }

  revalidatePath('/')

  return { success: true }
}

/**
 * Get a fresh thumbnail URL for an image (for retry on load failure)
 */
export async function getThumbnailUrl(
  storagePath: string
): Promise<{ url: string | null; error?: string }> {
  try {
    const urlMap = await getSignedUrlsBatch([storagePath], undefined, 'THUMBNAIL')
    const url = urlMap.get(storagePath)
    return { url: url || null }
  } catch (e) {
    console.error('[getThumbnailUrl] Error:', e)
    return { url: null, error: 'Failed to get URL' }
  }
}
