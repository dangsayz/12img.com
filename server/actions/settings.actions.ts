'use server'

import { auth, clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { 
  updateSettingsSchema, 
  updateBrandingSchema, 
  updateNotificationsSchema 
} from '@/lib/validation/settings.schema'
import { getOrCreateUserByClerkId, getUserByClerkId } from '@/server/queries/user.queries'

export async function updateUserSettings(formData: FormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const expiryValue = formData.get('defaultGalleryExpiryDays')
  
  const rawInput = {
    defaultPasswordEnabled: formData.get('defaultPasswordEnabled') === 'true',
    defaultDownloadEnabled: formData.get('defaultDownloadEnabled') === 'true',
    defaultGalleryExpiryDays: expiryValue ? parseInt(expiryValue as string, 10) : null,
    defaultWatermarkEnabled: formData.get('defaultWatermarkEnabled') === 'true',
  }

  const parseResult = updateSettingsSchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { error: parseResult.error.errors[0].message }
  }

  const input = parseResult.data

  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({
      default_password_enabled: input.defaultPasswordEnabled,
      default_download_enabled: input.defaultDownloadEnabled,
      default_gallery_expiry_days: input.defaultGalleryExpiryDays,
      default_watermark_enabled: input.defaultWatermarkEnabled,
    })
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update settings' }

  revalidatePath('/settings')

  return { success: true }
}

export async function updateBrandingSettings(formData: FormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const rawInput = {
    businessName: formData.get('businessName') as string || null,
    contactEmail: formData.get('contactEmail') as string || null,
    websiteUrl: formData.get('websiteUrl') as string || null,
    brandColor: formData.get('brandColor') as string || '#000000',
  }

  // Clean empty strings to null
  if (rawInput.contactEmail === '') rawInput.contactEmail = null
  if (rawInput.websiteUrl === '') rawInput.websiteUrl = null
  if (rawInput.businessName === '') rawInput.businessName = null

  const parseResult = updateBrandingSchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { error: parseResult.error.errors[0].message }
  }

  const input = parseResult.data

  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({
      business_name: input.businessName,
      contact_email: input.contactEmail,
      website_url: input.websiteUrl,
      brand_color: input.brandColor,
    })
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update branding settings' }

  revalidatePath('/settings')

  return { success: true }
}

export async function updateNotificationSettings(formData: FormData) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  const rawInput = {
    notifyGalleryViewed: formData.get('notifyGalleryViewed') === 'true',
    notifyImagesDownloaded: formData.get('notifyImagesDownloaded') === 'true',
    notifyArchiveReady: formData.get('notifyArchiveReady') === 'true',
    emailDigestFrequency: formData.get('emailDigestFrequency') as 'immediate' | 'daily' | 'weekly' | 'never',
  }

  const parseResult = updateNotificationsSchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { error: parseResult.error.errors[0].message }
  }

  const input = parseResult.data

  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({
      notify_gallery_viewed: input.notifyGalleryViewed,
      notify_images_downloaded: input.notifyImagesDownloaded,
      notify_archive_ready: input.notifyArchiveReady,
      email_digest_frequency: input.emailDigestFrequency,
    })
    .eq('user_id', user.id)

  if (error) return { error: 'Failed to update notification settings' }

  revalidatePath('/settings')

  return { success: true }
}

export async function deleteAccount() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // 1. Get all galleries for the user
    const { data: galleries } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('user_id', user.id)

    const galleryIds = galleries?.map(g => g.id) || []

    // 2. Delete all images (storage files will need manual cleanup via cron)
    if (galleryIds.length > 0) {
      await supabaseAdmin
        .from('images')
        .delete()
        .in('gallery_id', galleryIds)

      // 3. Delete gallery archives
      await supabaseAdmin
        .from('gallery_archives')
        .delete()
        .in('gallery_id', galleryIds)

      // 4. Delete gallery clients
      await supabaseAdmin
        .from('gallery_clients')
        .delete()
        .in('gallery_id', galleryIds)

      // 5. Delete archive jobs
      await supabaseAdmin
        .from('archive_jobs')
        .delete()
        .in('gallery_id', galleryIds)

      // 6. Delete galleries
      await supabaseAdmin
        .from('galleries')
        .delete()
        .eq('user_id', user.id)
    }

    // 7. Delete user settings
    await supabaseAdmin
      .from('user_settings')
      .delete()
      .eq('user_id', user.id)

    // 8. Delete user from database
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', user.id)

    // 9. Delete user from Clerk
    const clerk = await clerkClient()
    await clerk.users.deleteUser(clerkId)

    return { success: true }
  } catch (error) {
    console.error('Delete account error:', error)
    return { error: 'Failed to delete account. Please contact support.' }
  }
}

export async function exportAccountData() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Gather all user data
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const { data: galleries } = await supabaseAdmin
      .from('galleries')
      .select('*, images(*)')
      .eq('user_id', user.id)

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        email: user.email,
        plan: user.plan,
        createdAt: user.created_at,
      },
      settings,
      galleries: galleries || [],
    }

    return { success: true, data: exportData }
  } catch (error) {
    console.error('Export data error:', error)
    return { error: 'Failed to export data' }
  }
}
