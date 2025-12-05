'use server'

/**
 * Archive Actions
 * 
 * Server actions for archive management.
 * These are called from the frontend to trigger archive operations.
 */

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { enqueueArchiveJob, getGalleryArchiveStatus } from '@/server/services/job-queue.service'
import { getArchiveDownloadUrl, createGalleryArchive } from '@/server/services/archive.service'
import { sendArchiveNotificationEmail } from '@/server/services/email.service'
import type { Tables } from '@/types/database'

type Gallery = Tables<'galleries'>
type GalleryArchive = Tables<'gallery_archives'>

/**
 * Trigger archive creation for a gallery.
 * This is typically called when user clicks "Publish" or "Download All".
 * 
 * Uses the job queue for async processing to avoid blocking.
 */
export async function createArchive(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    // Enqueue the archive job
    const result = await enqueueArchiveJob(galleryId)

    if (!result.isNew) {
      // Archive already exists or job is already in progress
      return {
        success: true,
        archiveId: result.archiveId,
        jobId: result.jobId,
        message: result.jobId 
          ? 'Archive creation already in progress' 
          : 'Archive already exists for current image set',
      }
    }

    return {
      success: true,
      archiveId: result.archiveId,
      jobId: result.jobId,
      message: 'Archive creation started',
    }
  } catch (e) {
    console.error('[createArchive] Error:', e)
    if (e instanceof Error) {
      return { error: e.message }
    }
    return { error: 'Failed to create archive' }
  }
}

/**
 * Get download URL for the latest archive of a gallery.
 * Creates archive synchronously if none exists (for galleries with few images).
 */
export async function getDownloadAllUrl(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // Check download permission
  if (!gallery.download_enabled) {
    return { error: 'Downloads are disabled for this gallery' }
  }

  try {
    // Check current archive status
    const status = await getGalleryArchiveStatus(galleryId)

    if (status.status === 'ready' && status.archive) {
      // Archive is ready - return download URL
      const downloadUrl = await getArchiveDownloadUrl(status.archive.storage_path)
      return {
        success: true,
        downloadUrl,
        archive: {
          id: status.archive.id,
          imageCount: status.archive.image_count,
          sizeBytes: status.archive.file_size_bytes,
          createdAt: status.archive.created_at,
        },
      }
    }

    if (status.status === 'pending' || status.status === 'processing') {
      // Archive is being created
      return {
        success: true,
        pending: true,
        message: 'Archive is being created. You will receive an email when ready.',
      }
    }

    if (status.status === 'outdated' && status.archive) {
      // Archive exists but is outdated - return it but also trigger regeneration
      const downloadUrl = await getArchiveDownloadUrl(status.archive.storage_path)
      
      // Trigger new archive in background
      enqueueArchiveJob(galleryId).catch(console.error)

      return {
        success: true,
        downloadUrl,
        outdated: true,
        archive: {
          id: status.archive.id,
          imageCount: status.archive.image_count,
          sizeBytes: status.archive.file_size_bytes,
          createdAt: status.archive.created_at,
        },
        message: 'Archive is outdated. A new version is being created.',
      }
    }

    // No archive exists - check image count to decide if we should create sync or async
    const { count } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', galleryId)

    if (!count || count === 0) {
      return { error: 'Gallery has no images to download' }
    }

    // For small galleries (<20 images), create synchronously
    if (count <= 20) {
      const result = await createGalleryArchive(galleryId)
      const downloadUrl = await getArchiveDownloadUrl(result.storagePath)
      return {
        success: true,
        downloadUrl,
        archive: {
          id: result.archiveId,
          imageCount: result.imageCount,
          sizeBytes: result.fileSizeBytes,
          createdAt: new Date().toISOString(),
        },
      }
    }

    // For larger galleries, queue async job
    const jobResult = await enqueueArchiveJob(galleryId)
    return {
      success: true,
      pending: true,
      jobId: jobResult.jobId,
      message: 'Archive creation started. You will receive an email when ready.',
    }
  } catch (e) {
    console.error('[getDownloadAllUrl] Error:', e)
    if (e instanceof Error) {
      return { error: e.message }
    }
    return { error: 'Failed to get download URL' }
  }
}

/**
 * Get archive status for a gallery.
 */
export async function getArchiveStatus(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    const status = await getGalleryArchiveStatus(galleryId)
    return { success: true, ...status }
  } catch (e) {
    console.error('[getArchiveStatus] Error:', e)
    return { error: 'Failed to get archive status' }
  }
}

/**
 * Add a client email to receive archive notifications.
 */
export async function addGalleryClient(
  galleryId: string,
  email: string,
  name?: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: 'Invalid email address' }
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_clients')
      .upsert({
        gallery_id: galleryId,
        email: email.toLowerCase().trim(),
        name: name?.trim() || null,
        notify_on_archive: true,
      }, {
        onConflict: 'gallery_id,email',
      })
      .select()
      .single()

    if (error) {
      console.error('[addGalleryClient] Error:', error)
      return { error: 'Failed to add client' }
    }

    revalidatePath(`/gallery/${galleryId}`)
    return { success: true, client: data }
  } catch (e) {
    console.error('[addGalleryClient] Error:', e)
    return { error: 'Failed to add client' }
  }
}

/**
 * Remove a client from gallery notifications.
 */
export async function removeGalleryClient(galleryId: string, clientId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    const { error } = await supabaseAdmin
      .from('gallery_clients')
      .delete()
      .eq('id', clientId)
      .eq('gallery_id', galleryId)

    if (error) {
      return { error: 'Failed to remove client' }
    }

    revalidatePath(`/gallery/${galleryId}`)
    return { success: true }
  } catch (e) {
    console.error('[removeGalleryClient] Error:', e)
    return { error: 'Failed to remove client' }
  }
}

/**
 * Get all clients for a gallery.
 */
export async function getGalleryClients(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    const { data, error } = await supabaseAdmin
      .from('gallery_clients')
      .select('*')
      .eq('gallery_id', galleryId)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch clients' }
    }

    return { success: true, clients: data || [] }
  } catch (e) {
    console.error('[getGalleryClients] Error:', e)
    return { error: 'Failed to fetch clients' }
  }
}

/**
 * Manually resend archive email to a specific recipient.
 */
export async function resendArchiveEmail(
  galleryId: string,
  archiveId: string,
  recipientEmail: string
) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    // Get archive
    const { data: archive, error: archiveError } = await supabaseAdmin
      .from('gallery_archives')
      .select('*')
      .eq('id', archiveId)
      .eq('gallery_id', galleryId)
      .eq('status', 'completed')
      .single()

    if (archiveError || !archive) {
      return { error: 'Archive not found or not ready' }
    }

    // Send email
    const result = await sendArchiveNotificationEmail(
      archive,
      gallery,
      recipientEmail
    )

    if (!result.success) {
      return { error: result.error || 'Failed to send email' }
    }

    return { success: true, messageId: result.messageId }
  } catch (e) {
    console.error('[resendArchiveEmail] Error:', e)
    return { error: 'Failed to send email' }
  }
}

/**
 * Regenerate archive for a gallery (force new archive even if one exists).
 */
export async function regenerateArchive(galleryId: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }

  try {
    const result = await enqueueArchiveJob(galleryId, 1) // Higher priority

    return {
      success: true,
      archiveId: result.archiveId,
      jobId: result.jobId,
      message: result.isNew 
        ? 'Archive regeneration started' 
        : 'Archive creation already in progress',
    }
  } catch (e) {
    console.error('[regenerateArchive] Error:', e)
    if (e instanceof Error) {
      return { error: e.message }
    }
    return { error: 'Failed to regenerate archive' }
  }
}
