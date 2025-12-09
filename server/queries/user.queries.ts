import { supabaseAdmin } from '@/lib/supabase/admin'
import { currentUser } from '@clerk/nextjs/server'

export async function getUserByClerkId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single()

  if (error) {
    console.log('getUserByClerkId - no user found for:', clerkId)
    return null
  }
  return data
}

/**
 * Get user by Clerk ID, creating them if they don't exist (just-in-time provisioning).
 * This handles cases where the Clerk webhook failed or wasn't configured.
 */
export async function getOrCreateUserByClerkId(clerkId: string) {
  // First try to get existing user
  const existingUser = await getUserByClerkId(clerkId)
  if (existingUser) {
    console.log('getOrCreateUserByClerkId - found existing user:', existingUser.id)
    return existingUser
  }

  // User doesn't exist, create them
  const clerkUser = await currentUser()
  if (!clerkUser) {
    console.error('getOrCreateUserByClerkId - no clerk user found')
    return null
  }

  const email = clerkUser.emailAddresses?.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress || ''

  console.log('getOrCreateUserByClerkId - creating user with email:', email)

  // Use upsert to handle race conditions
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .upsert({
      clerk_id: clerkId,
      email,
    }, {
      onConflict: 'clerk_id',
    })
    .select('*')
    .single()

  if (userError) {
    console.error('Failed to create/upsert user:', userError)
    return null
  }

  console.log('getOrCreateUserByClerkId - user created/found:', user.id)

  // Create default settings (ignore if already exists)
  await supabaseAdmin.from('user_settings').upsert({
    user_id: user.id,
    default_password_enabled: false,
    default_download_enabled: true,
  }, {
    onConflict: 'user_id',
  })

  return user
}

export interface UserSettings {
  // Gallery defaults
  defaultPasswordEnabled: boolean
  defaultDownloadEnabled: boolean
  defaultGalleryExpiryDays: number | null
  defaultWatermarkEnabled: boolean
  // Business branding
  businessName: string | null
  logoUrl: string | null
  brandColor: string
  contactEmail: string | null
  websiteUrl: string | null
  // Location
  country: string | null
  // Notification preferences
  notifyGalleryViewed: boolean
  notifyImagesDownloaded: boolean
  notifyArchiveReady: boolean
  emailDigestFrequency: 'immediate' | 'daily' | 'weekly' | 'never'
  // Social sharing
  socialSharingEnabled: boolean
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultPasswordEnabled: false,
  defaultDownloadEnabled: true,
  defaultGalleryExpiryDays: null,
  defaultWatermarkEnabled: false,
  businessName: null,
  logoUrl: null,
  brandColor: '#000000',
  contactEmail: null,
  websiteUrl: null,
  country: null,
  notifyGalleryViewed: true,
  notifyImagesDownloaded: true,
  notifyArchiveReady: true,
  emailDigestFrequency: 'immediate',
  socialSharingEnabled: false,
}

export async function getUserSettings(clerkId: string): Promise<UserSettings> {
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return DEFAULT_SETTINGS
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return DEFAULT_SETTINGS
  }

  return {
    defaultPasswordEnabled: data.default_password_enabled ?? false,
    defaultDownloadEnabled: data.default_download_enabled ?? true,
    defaultGalleryExpiryDays: data.default_gallery_expiry_days ?? null,
    defaultWatermarkEnabled: data.default_watermark_enabled ?? false,
    businessName: data.business_name ?? null,
    logoUrl: data.logo_url ?? null,
    brandColor: data.brand_color ?? '#000000',
    contactEmail: data.contact_email ?? null,
    websiteUrl: data.website_url ?? null,
    country: data.country ?? null,
    notifyGalleryViewed: data.notify_gallery_viewed ?? true,
    notifyImagesDownloaded: data.notify_images_downloaded ?? true,
    notifyArchiveReady: data.notify_archive_ready ?? true,
    emailDigestFrequency: data.email_digest_frequency ?? 'immediate',
    socialSharingEnabled: data.social_sharing_enabled ?? false,
  }
}

export type UserRole = 'user' | 'support' | 'admin' | 'super_admin'

export async function getUserWithUsage(clerkId: string) {
  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return null
  }

  const usage = await getUserStorageUsage(clerkId)
  
  // Check if admin-granted plan has expired
  let effectivePlan = user.plan || 'free'
  const expiresAt = user.admin_plan_expires_at
  
  if (expiresAt && new Date(expiresAt) < new Date()) {
    // Plan has expired - revert to free
    effectivePlan = 'free'
    
    // Update database to clear expired plan (async, don't wait)
    void supabaseAdmin
      .from('users')
      .update({ 
        plan: 'free',
        admin_plan_expires_at: null,
        admin_plan_granted_by: null,
        admin_plan_granted_at: null,
      })
      .eq('id', user.id)
      .then(() => console.log(`Auto-reverted expired plan for user ${user.id}`))
  }
  
  return {
    id: user.id,
    email: user.email,
    plan: effectivePlan as 'free' | 'basic' | 'essential' | 'pro' | 'studio' | 'elite',
    role: (user.role || 'user') as UserRole,
    stripeCustomerId: user.stripe_customer_id,
    stripeSubscriptionId: user.stripe_subscription_id,
    planExpiresAt: expiresAt,
    usage,
  }
}

export async function getUserStorageUsage(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return {
      totalBytes: 0,
      imageCount: 0,
      galleryCount: 0,
    }
  }

  // Get gallery count
  const { count: galleryCount } = await supabaseAdmin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get image count and total size
  const { data: galleries } = await supabaseAdmin
    .from('galleries')
    .select('id')
    .eq('user_id', user.id)

  const galleryIds = galleries?.map(g => g.id) || []

  if (galleryIds.length === 0) {
    return {
      totalBytes: 0,
      imageCount: 0,
      galleryCount: galleryCount || 0,
    }
  }

  const { data: images } = await supabaseAdmin
    .from('images')
    .select('file_size_bytes')
    .in('gallery_id', galleryIds)

  const totalBytes = images?.reduce((sum, img) => sum + img.file_size_bytes, 0) || 0
  const imageCount = images?.length || 0

  return {
    totalBytes,
    imageCount,
    galleryCount: galleryCount || 0,
  }
}

/**
 * Check if a user is an admin (support, admin, or super_admin role)
 */
export async function checkIsAdmin(clerkId: string): Promise<boolean> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('clerk_id', clerkId)
    .single()

  if (error || !user) {
    return false
  }

  const adminRoles = ['support', 'admin', 'super_admin']
  return adminRoles.includes(user.role || '')
}
