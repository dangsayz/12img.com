'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
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
import { getPlan, type PlanId } from '@/lib/config/pricing'
import { sendGalleryInviteEmail } from '@/server/services/email.service'

export async function createGallery(formData: FormData) {
  const { userId: clerkId } = await auth()
  console.log('createGallery - clerkId:', clerkId)
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  console.log('createGallery - user:', user?.id)
  if (!user) return { error: 'User not found' }

  // Check gallery limit based on user's plan
  const userPlan = (user.plan || 'free') as PlanId
  const plan = getPlan(userPlan)
  
  if (plan && plan.limits.galleries !== 'unlimited') {
    const { count: currentGalleryCount } = await supabaseAdmin
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (currentGalleryCount !== null && currentGalleryCount >= plan.limits.galleries) {
      return { 
        error: `You've reached the ${plan.limits.galleries} gallery limit for the ${plan.name} plan. Upgrade to create more galleries.`,
        limitReached: true,
      }
    }
  }

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
    // Handle password specially - empty string means remove password
    const passwordValue = formData.get('password')
    const removePassword = formData.get('removePassword') === 'true'
    
    const validated = updateGallerySchema.parse({
      title: formData.get('title') || undefined,
      password: passwordValue && passwordValue !== '' ? passwordValue : undefined,
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

    // Handle password update or removal
    if (removePassword) {
      // Explicitly remove password
      updateData.password_hash = null
    } else if (validated.password) {
      updateData.password_hash = await hashPassword(validated.password)
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

/**
 * Send gallery to a client via email.
 */
export async function sendGalleryToClient(
  galleryId: string,
  clientEmail: string,
  personalMessage?: string,
  baseUrl?: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(clientEmail)) {
    return { error: 'Invalid email address' }
  }

  // Get current user info from Clerk for the email
  const clerkUser = await currentUser()
  const photographerName = clerkUser?.fullName || clerkUser?.firstName || undefined
  const photographerEmail = clerkUser?.primaryEmailAddress?.emailAddress || user.email

  try {
    const result = await sendGalleryInviteEmail(
      gallery,
      clientEmail.toLowerCase().trim(),
      {
        photographerName,
        photographerEmail,
        personalMessage: personalMessage?.trim() || undefined,
        baseUrl: baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com',
      }
    )

    if (!result.success) {
      return { error: result.error || 'Failed to send email' }
    }

    // Optionally save the client to gallery_clients for future notifications
    await supabaseAdmin
      .from('gallery_clients')
      .upsert({
        gallery_id: galleryId,
        email: clientEmail.toLowerCase().trim(),
        notify_on_archive: true,
      }, {
        onConflict: 'gallery_id,email',
      })

    return { success: true }
  } catch (e) {
    console.error('[sendGalleryToClient] Error:', e)
    return { error: 'Failed to send gallery' }
  }
}
