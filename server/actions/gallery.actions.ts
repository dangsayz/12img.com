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
import { getPlan, normalizePlanId } from '@/lib/config/pricing'
import { sendGalleryInviteEmail } from '@/server/services/email.service'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import type { PresentationData } from '@/lib/types/presentation'

export async function createGallery(formData: FormData) {
  const { userId: clerkId } = await auth()
  console.log('createGallery - clerkId:', clerkId)
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  console.log('createGallery - user:', user?.id)
  if (!user) return { error: 'User not found' }

  // Check gallery limit based on user's plan
  const userPlan = normalizePlanId(user.plan)
  const plan = getPlan(userPlan)
  
  if (plan && plan.limits.gallery_limit !== 'unlimited') {
    const { count: currentGalleryCount } = await supabaseAdmin
      .from('galleries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (currentGalleryCount !== null && currentGalleryCount >= (plan.limits.gallery_limit as number)) {
      return { 
        error: `You've reached the ${plan.limits.gallery_limit} gallery limit for the ${plan.name} plan. Upgrade to create more galleries.`,
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

    const template = formData.get('template') as string || 'editorial'

    const insertData = {
      user_id: user.id,
      title: validated.title,
      slug,
      password_hash: passwordHash,
      download_enabled: validated.downloadEnabled,
      template,
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
    revalidatePath(`/view-reel/${galleryId}`)

    return { success: true, slug: data?.slug }
  } catch (e) {
    if (e instanceof Error) {
      return { error: e.message }
    }
    return { error: 'An error occurred' }
  }
}

/**
 * Toggle gallery public/private visibility
 */
export async function toggleGalleryVisibility(galleryId: string, isPublic: boolean) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ is_public: isPublic })
    .eq('id', galleryId)

  if (error) return { error: 'Failed to update visibility' }

  revalidatePath('/')
  revalidatePath(`/gallery/${galleryId}`)
  revalidatePath(`/view-reel/${gallery.slug}`)
  revalidatePath(`/view-live/${gallery.slug}`)

  return { success: true, isPublic }
}

/**
 * Toggle gallery downloads enabled/disabled
 */
export async function toggleGalleryDownloads(galleryId: string, enabled: boolean) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ download_enabled: enabled })
    .eq('id', galleryId)

  if (error) return { error: 'Failed to update download settings' }

  revalidatePath('/')
  revalidatePath(`/gallery/${galleryId}`)
  revalidatePath(`/view-reel/${gallery.slug}`)
  revalidatePath(`/view-live/${gallery.slug}`)

  return { success: true, downloadEnabled: enabled }
}

/**
 * Update or remove gallery password
 */
export async function updateGalleryPassword(galleryId: string, password: string | null) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // Hash the new password or set to null to remove
  const passwordHash = password ? await hashPassword(password) : null
  const isLocked = !!password

  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ 
      password_hash: passwordHash,
      password_plain: password, // Store plain for owner display
      is_locked: isLocked
    })
    .eq('id', galleryId)

  if (error) return { error: 'Failed to update password' }

  revalidatePath('/')
  revalidatePath(`/gallery/${galleryId}`)
  revalidatePath(`/view-reel/${gallery.slug}`)
  revalidatePath(`/view-live/${gallery.slug}`)

  return { success: true, isLocked, password }
}

export async function updateGalleryTemplate(galleryId: string, template: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  const validTemplates = ['mosaic', 'clean-grid', 'cinematic', 'editorial']
  if (!validTemplates.includes(template)) {
    return { error: 'Invalid template' }
  }

  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ template })
    .eq('id', galleryId)

  if (error) return { error: 'Failed to update template' }

  revalidatePath(`/gallery/${galleryId}`)
  revalidatePath(`/view-reel/${gallery.slug}`)
  revalidatePath(`/view-live/${gallery.slug}`)

  return { success: true, template }
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
  revalidatePath(`/view-reel/${galleryId}`)

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
 * Gallery template type for URL routing
 */
type GalleryTemplate = 'mosaic' | 'clean-grid' | 'cinematic' | 'editorial'

/**
 * Map template to the correct view URL path (using slug for clean URLs)
 */
function getTemplateUrl(gallerySlug: string, template: GalleryTemplate): string {
  switch (template) {
    case 'cinematic':
      return `/view-reel/${gallerySlug}`
    case 'editorial':
      return `/view-live/${gallerySlug}`
    case 'mosaic':
    case 'clean-grid':
    default:
      return `/view-reel/${gallerySlug}`
  }
}

/**
 * Send gallery to a client via email.
 */
export async function sendGalleryToClient(
  galleryId: string,
  clientEmail: string,
  personalMessage?: string,
  password?: string,  // Include PIN in email if provided
  template: GalleryTemplate = 'mosaic'  // Template for gallery view
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

  // Build gallery URL based on selected template (using slug for clean URLs)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'
  const galleryPath = getTemplateUrl(gallery.slug, template)

  try {
    const result = await sendGalleryInviteEmail(
      gallery,
      clientEmail.toLowerCase().trim(),
      {
        photographerName,
        photographerEmail,
        personalMessage: personalMessage?.trim() || undefined,
        baseUrl,
        password,  // Include PIN if provided
        galleryPath,  // Custom path based on template
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

/**
 * Get preview URLs for images on-demand (for fullscreen viewing)
 * This is called when user opens fullscreen viewer, not on page load
 */
export async function getPreviewUrls(
  storagePaths: string[]
): Promise<{ urls: Record<string, string> } | { error: string }> {
  try {
    const urlMap = await getSignedUrlsBatch(storagePaths, undefined, 'PREVIEW')
    const urls: Record<string, string> = {}
    urlMap.forEach((url, path) => {
      urls[path] = url
    })
    return { urls }
  } catch (e) {
    console.error('[getPreviewUrls] Error:', e)
    return { error: 'Failed to get preview URLs' }
  }
}

/**
 * Get original URL for a single image (for downloads)
 */
export async function getOriginalUrl(
  storagePath: string
): Promise<{ url: string } | { error: string }> {
  try {
    const urlMap = await getSignedUrlsBatch([storagePath], undefined, 'ORIGINAL')
    const url = urlMap.get(storagePath)
    if (!url) return { error: 'URL not found' }
    return { url }
  } catch (e) {
    console.error('[getOriginalUrl] Error:', e)
    return { error: 'Failed to get original URL' }
  }
}

/**
 * Update focal point for an image
 * Allows users to set a custom crop center point (0-100% for both X and Y)
 */
export async function updateImageFocalPoint(
  imageId: string,
  focalX: number | null,
  focalY: number | null
): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { success: false, error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { success: false, error: 'User not found' }

  // Get image and verify ownership through gallery
  const { data: image, error: imageError } = await supabaseAdmin
    .from('images')
    .select('id, gallery_id')
    .eq('id', imageId)
    .single()

  if (imageError || !image) {
    return { success: false, error: 'Image not found' }
  }

  // Verify gallery ownership
  const gallery = await getGalleryWithOwnershipCheck(image.gallery_id, user.id)
  if (!gallery) {
    return { success: false, error: 'Not authorized to edit this image' }
  }

  // Validate focal point values (0-100 or null)
  const validX = focalX === null || (focalX >= 0 && focalX <= 100)
  const validY = focalY === null || (focalY >= 0 && focalY <= 100)
  
  if (!validX || !validY) {
    return { success: false, error: 'Focal point must be between 0 and 100' }
  }

  // Update the image
  const { error: updateError } = await supabaseAdmin
    .from('images')
    .update({
      focal_x: focalX,
      focal_y: focalY,
    })
    .eq('id', imageId)

  if (updateError) {
    console.error('[updateImageFocalPoint] Error:', updateError)
    return { success: false, error: 'Failed to update focal point' }
  }

  // Revalidate gallery pages
  revalidatePath(`/gallery/${image.gallery_id}`)
  revalidatePath(`/view-reel/${gallery.slug}`)
  revalidatePath(`/view-live/${gallery.slug}`)

  return { success: true }
}

/**
 * Update gallery presentation metadata
 * Used for premium gallery delivery customization
 */
export async function updateGalleryPresentation(
  galleryId: string,
  presentationData: PresentationData
): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { success: false, error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { success: false, error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { success: false, error: 'Gallery not found' }

  // Validate cover image if provided
  if (presentationData.coverImageId) {
    const { data: image, error: imageError } = await supabaseAdmin
      .from('images')
      .select('id')
      .eq('id', presentationData.coverImageId)
      .eq('gallery_id', galleryId)
      .single()

    if (imageError || !image) {
      return { success: false, error: 'Cover image not found in this gallery' }
    }
  }

  // Update both presentation_data and cover_image_id
  const updatePayload: Record<string, unknown> = {
    presentation_data: presentationData,
  }
  
  if (presentationData.coverImageId !== undefined) {
    updatePayload.cover_image_id = presentationData.coverImageId || null
  }

  const { error } = await supabaseAdmin
    .from('galleries')
    .update(updatePayload)
    .eq('id', galleryId)

  if (error) {
    console.error('[updateGalleryPresentation] Error:', error)
    return { success: false, error: 'Failed to update presentation settings' }
  }

  // Revalidate all gallery views
  revalidatePath('/')
  revalidatePath(`/gallery/${galleryId}`)
  revalidatePath(`/view-reel/${gallery.slug}`)
  revalidatePath(`/view-live/${gallery.slug}`)

  return { success: true }
}

/**
 * Get location suggestions for autocomplete
 * Returns unique venues and locations from user's galleries
 */
export async function getLocationSuggestions(): Promise<{
  venues: string[]
  locations: string[]
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { venues: [], locations: [] }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { venues: [], locations: [] }

  const { data: galleries, error } = await supabaseAdmin
    .from('galleries')
    .select('presentation_data')
    .eq('user_id', user.id)
    .not('presentation_data', 'is', null)

  if (error || !galleries) {
    return { venues: [], locations: [] }
  }

  const venueSet = new Set<string>()
  const locationSet = new Set<string>()

  for (const gallery of galleries) {
    const presentation = gallery.presentation_data as PresentationData | null
    if (presentation?.venue) {
      venueSet.add(presentation.venue)
    }
    if (presentation?.location) {
      locationSet.add(presentation.location)
    }
  }

  return {
    venues: Array.from(venueSet).sort(),
    locations: Array.from(locationSet).sort(),
  }
}

/**
 * Get gallery presentation data
 */
export async function getGalleryPresentation(
  galleryId: string
): Promise<{ data: PresentationData | null; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('presentation_data, cover_image_id')
    .eq('id', galleryId)
    .single()

  if (error) {
    console.error('[getGalleryPresentation] Error:', error)
    return { data: null, error: 'Failed to fetch presentation data' }
  }

  const presentationData = (data?.presentation_data as PresentationData) || null
  
  // Merge cover_image_id into presentation data if it exists
  if (presentationData && data?.cover_image_id) {
    presentationData.coverImageId = data.cover_image_id
  }

  return { data: presentationData }
}
