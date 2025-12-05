'use server'

import { auth } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserByClerkId } from '@/server/queries/user.queries'
import { getGalleryById, verifyGalleryOwnership } from '@/server/queries/gallery.queries'
import { getImageWithOwnershipCheck } from '@/server/queries/image.queries'

export async function deleteImage(imageId: string) {
  const { userId: clerkId } = auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const image = await getImageWithOwnershipCheck(imageId, user.id)
  if (!image) return { error: 'Image not found' }

  const gallery = await getGalleryById(image.gallery_id)

  // Delete from storage
  const { error: storageError } = await supabaseAdmin.storage
    .from('gallery-images')
    .remove([image.storage_path])

  if (storageError) {
    console.error('Storage delete error:', storageError)
  }

  // Delete from database
  const { error } = await supabaseAdmin
    .from('images')
    .delete()
    .eq('id', imageId)

  if (error) return { error: 'Failed to delete image' }

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

  if (gallery) {
    revalidatePath(`/g/${gallery.slug}`)
  }
  revalidatePath('/')

  return { success: true }
}

export async function setCoverImage(galleryId: string, imageId: string) {
  const { userId: clerkId } = auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getUserByClerkId(clerkId)
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
