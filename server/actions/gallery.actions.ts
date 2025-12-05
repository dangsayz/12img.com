'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashPassword } from '@/lib/utils/password'
import { generateUniqueSlug } from '@/lib/utils/slug'
import { createGallerySchema, updateGallerySchema } from '@/lib/validation/gallery.schema'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import {
  getGalleryById,
  getGalleryWithOwnershipCheck,
  verifyGalleryOwnership,
} from '@/server/queries/gallery.queries'

export async function createGallery(formData: FormData) {
  const { userId: clerkId } = await auth()
  console.log('createGallery - clerkId:', clerkId)
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  console.log('createGallery - user:', user?.id)
  if (!user) return { error: 'User not found' }

  try {
    const validated = createGallerySchema.parse({
      title: formData.get('title'),
      password: formData.get('password') || null,
      downloadEnabled: formData.get('downloadEnabled') === 'true',
    })

    const slug = await generateUniqueSlug(validated.title)
    console.log('createGallery - slug generated:', slug)
    
    const passwordHash = validated.password
      ? await hashPassword(validated.password)
      : null

    const insertData = {
      user_id: user.id,
      title: validated.title,
      slug,
      password_hash: passwordHash,
      download_enabled: validated.downloadEnabled,
    }
    console.log('createGallery - inserting:', insertData)

    const { data, error } = await supabaseAdmin
      .from('galleries')
      .insert(insertData)
      .select('id, slug')
      .single()

    if (error) {
      console.error('Gallery creation error:', error)
      return { error: `Failed to create gallery: ${error.message}` }
    }
    
    console.log('createGallery - success:', data)

    revalidatePath('/')

    return { galleryId: data.id, slug: data.slug }
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message }
    }
    return { error: 'An error occurred' }
  }
}

export async function updateGallery(galleryId: string, formData: FormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    const validated = updateGallerySchema.parse({
      title: formData.get('title') || undefined,
      password: formData.get('password') || undefined,
      downloadEnabled:
        formData.get('downloadEnabled') !== null
          ? formData.get('downloadEnabled') === 'true'
          : undefined,
    })

    const updateData: Record<string, unknown> = {}

    if (validated.title && validated.title !== gallery.title) {
      updateData.title = validated.title
      // Regenerate slug when title changes
      const newSlug = await generateUniqueSlug(validated.title)
      updateData.slug = newSlug
    }

    if (validated.password !== undefined) {
      updateData.password_hash = validated.password
        ? await hashPassword(validated.password)
        : null
    }

    if (validated.downloadEnabled !== undefined) {
      updateData.download_enabled = validated.downloadEnabled
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true }
    }

    const { data, error } = await supabaseAdmin
      .from('galleries')
      .update(updateData)
      .eq('id', galleryId)
      .select('slug')
      .single()

    if (error) return { error: 'Failed to update gallery' }

    revalidatePath('/')
    revalidatePath(`/gallery/${galleryId}`)
    // Revalidate both old and new slug paths
    revalidatePath(`/g/${gallery.slug}`)
    if (data?.slug && data.slug !== gallery.slug) {
      revalidatePath(`/g/${data.slug}`)
    }

    return { success: true, slug: data?.slug }
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message }
    }
    return { error: 'An error occurred' }
  }
}

export async function setCoverImage(galleryId: string, imageId: string | null) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // If imageId is provided, verify it belongs to this gallery
  if (imageId) {
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('id')
      .eq('id', imageId)
      .eq('gallery_id', galleryId)
      .single()

    if (imageError || !image) {
      return { error: 'Image not found in this gallery' }
    }
  }

  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ cover_image_id: imageId })
    .eq('id', galleryId)

  if (error) return { error: 'Failed to set cover image' }

  revalidatePath('/')
  revalidatePath(`/gallery/${galleryId}`)
  revalidatePath(`/g/${gallery.slug}`)

  return { success: true }
}

export async function deleteGallery(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // Get all image paths for storage cleanup
  const { data: images } = await supabaseAdmin
    .from('images')
    .select('storage_path')
    .eq('gallery_id', galleryId)

  // Delete from storage
  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path)
    await supabaseAdmin.storage.from('gallery-images').remove(paths)
  }

  // Delete gallery (cascades to images)
  const { error } = await supabaseAdmin
    .from('galleries')
    .delete()
    .eq('id', galleryId)

  if (error) return { error: 'Failed to delete gallery' }

  revalidatePath('/')

  return { success: true }
}
