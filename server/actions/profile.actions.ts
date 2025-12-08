'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createHmac, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { hashPassword, verifyPassword } from '@/lib/utils/password'
import { getOrCreateUserByClerkId } from '@/server/queries/user.queries'
import type { ProfileVisibilityMode } from '@/types/database'

// ============================================
// PROFILE VISIBILITY ACTIONS
// ============================================

interface UpdateProfileVisibilityInput {
  mode: ProfileVisibilityMode
  pin?: string // Required if mode is PUBLIC_LOCKED
  displayName?: string
  bio?: string
}

export async function updateProfileVisibility(input: UpdateProfileVisibilityInput) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Validate PIN if PUBLIC_LOCKED mode
    if (input.mode === 'PUBLIC_LOCKED') {
      if (!input.pin || input.pin.length < 4 || input.pin.length > 6) {
        return { error: 'PIN must be 4-6 digits for locked profiles' }
      }
      if (!/^\d+$/.test(input.pin)) {
        return { error: 'PIN must contain only numbers' }
      }
    }

    // Generate profile slug if going public and doesn't have one
    let profileSlug = user.profile_slug
    if ((input.mode === 'PUBLIC' || input.mode === 'PUBLIC_LOCKED') && !profileSlug) {
      const { data: slugData } = await supabaseAdmin
        .rpc('generate_profile_slug', { p_user_id: user.id })
      profileSlug = slugData
    }

    // Hash PIN if provided
    const pinHash = input.mode === 'PUBLIC_LOCKED' && input.pin
      ? await hashPassword(input.pin)
      : null

    // Update user profile
    const updateData: Record<string, unknown> = {
      visibility_mode: input.mode,
      profile_slug: profileSlug,
      profile_pin_hash: pinHash,
    }

    if (input.displayName !== undefined) {
      updateData.display_name = input.displayName
    }
    if (input.bio !== undefined) {
      updateData.bio = input.bio
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('Profile visibility update error:', error)
      return { error: 'Failed to update profile visibility' }
    }

    revalidatePath('/settings')
    revalidatePath('/profiles')
    if (profileSlug) {
      revalidatePath(`/profile/${profileSlug}`)
    }

    return { 
      success: true, 
      profileSlug,
      mode: input.mode 
    }
  } catch (e) {
    console.error('Profile visibility error:', e)
    return { error: 'An error occurred' }
  }
}

export async function updateProfileDetails(input: {
  displayName?: string
  bio?: string
  profileSlug?: string
}) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const oldSlug = user.profile_slug

    // Validate slug if provided
    if (input.profileSlug && input.profileSlug !== oldSlug) {
      if (!/^[a-z0-9-]+$/.test(input.profileSlug)) {
        return { error: 'Profile URL can only contain lowercase letters, numbers, and hyphens' }
      }
      if (input.profileSlug.length < 3 || input.profileSlug.length > 50) {
        return { error: 'Profile URL must be 3-50 characters' }
      }

      // Check if slug is taken (including in history)
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('profile_slug', input.profileSlug)
        .neq('id', user.id)
        .single()

      if (existing) {
        return { error: 'This profile URL is already taken' }
      }

      // Check slug history for active redirects
      const { data: historyConflict } = await supabaseAdmin
        .from('profile_slug_history')
        .select('id')
        .eq('old_slug', input.profileSlug)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (historyConflict) {
        return { error: 'This profile URL is temporarily reserved' }
      }

      // If changing slug, save old one to history for redirects
      if (oldSlug) {
        await supabaseAdmin
          .from('profile_slug_history')
          .insert({
            user_id: user.id,
            old_slug: oldSlug,
            new_slug: input.profileSlug,
          })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (input.displayName !== undefined) updateData.display_name = input.displayName
    if (input.bio !== undefined) updateData.bio = input.bio
    if (input.profileSlug !== undefined) updateData.profile_slug = input.profileSlug

    // Also update business_name in settings if displayName changed
    if (input.displayName !== undefined) {
      await supabaseAdmin
        .from('user_settings')
        .update({ business_name: input.displayName })
        .eq('user_id', user.id)
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('Profile update error:', error)
      return { error: 'Failed to update profile' }
    }

    revalidatePath('/')
    revalidatePath('/settings')
    if (oldSlug) revalidatePath(`/profile/${oldSlug}`)
    if (input.profileSlug) revalidatePath(`/profile/${input.profileSlug}`)

    return { success: true, newSlug: input.profileSlug }
  } catch (e) {
    console.error('Profile update error:', e)
    return { error: 'An error occurred' }
  }
}

// ============================================
// GALLERY LOCKING ACTIONS
// ============================================

export async function updateGalleryLock(galleryId: string, isLocked: boolean, pin?: string) {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Verify gallery ownership
    const { data: gallery } = await supabaseAdmin
      .from('galleries')
      .select('id, user_id')
      .eq('id', galleryId)
      .single()

    if (!gallery || gallery.user_id !== user.id) {
      return { error: 'Gallery not found or unauthorized' }
    }

    // Validate PIN if locking
    if (isLocked) {
      if (!pin || pin.length < 4 || pin.length > 6) {
        return { error: 'PIN must be 4-6 digits' }
      }
      if (!/^\d+$/.test(pin)) {
        return { error: 'PIN must contain only numbers' }
      }
    }

    const pinHash = isLocked && pin ? await hashPassword(pin) : null

    const { error } = await supabaseAdmin
      .from('galleries')
      .update({
        is_locked: isLocked,
        lock_pin_hash: pinHash,
      })
      .eq('id', galleryId)

    if (error) {
      console.error('Gallery lock update error:', error)
      return { error: 'Failed to update gallery lock' }
    }

    revalidatePath('/')
    revalidatePath('/settings')

    return { success: true }
  } catch (e) {
    console.error('Gallery lock error:', e)
    return { error: 'An error occurred' }
  }
}

// ============================================
// PIN VERIFICATION / UNLOCK ACTIONS
// ============================================

const UNLOCK_TOKEN_SECRET = process.env.GALLERY_TOKEN_SECRET || 'default-secret-change-me'
const UNLOCK_COOKIE_MAX_AGE = 12 * 60 * 60 // 12 hours in seconds

function generateUnlockCookieToken(galleryId: string): string {
  const timestamp = Date.now()
  const nonce = randomBytes(16).toString('hex')
  const payload = `${galleryId}:${timestamp}:${nonce}`
  const signature = createHmac('sha256', UNLOCK_TOKEN_SECRET).update(payload).digest('hex')
  return `${payload}:${signature}`
}

function verifyUnlockCookieToken(token: string, galleryId: string): boolean {
  try {
    const parts = token.split(':')
    if (parts.length !== 4) return false

    const [tokenGalleryId, timestamp, nonce, signature] = parts

    // Verify gallery ID matches
    if (tokenGalleryId !== galleryId) return false

    // Verify not expired (12 hours)
    const tokenTime = parseInt(timestamp, 10)
    if (Date.now() - tokenTime > UNLOCK_COOKIE_MAX_AGE * 1000) return false

    // Verify signature
    const payload = `${tokenGalleryId}:${timestamp}:${nonce}`
    const expectedSignature = createHmac('sha256', UNLOCK_TOKEN_SECRET)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch {
    return false
  }
}

export async function unlockGalleryWithPin(galleryId: string, pin: string) {
  try {
    // Fetch gallery with lock info
    const { data: gallery } = await supabaseAdmin
      .from('galleries')
      .select('id, is_locked, lock_pin_hash, user_id')
      .eq('id', galleryId)
      .single()

    if (!gallery) {
      return { error: 'Gallery not found' }
    }

    if (!gallery.is_locked || !gallery.lock_pin_hash) {
      return { error: 'Gallery is not locked' }
    }

    // Verify PIN
    const isValid = await verifyPassword(pin, gallery.lock_pin_hash)
    if (!isValid) {
      return { error: 'Invalid PIN' }
    }

    // Generate unlock token and set cookie
    const token = generateUnlockCookieToken(galleryId)
    
    const cookieStore = await cookies()
    cookieStore.set(`gallery_unlock_${galleryId}`, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: UNLOCK_COOKIE_MAX_AGE,
      path: '/',
    })

    // Also store in database for server-side verification
    await supabaseAdmin
      .from('gallery_unlock_tokens')
      .insert({
        gallery_id: galleryId,
        token_hash: createHmac('sha256', UNLOCK_TOKEN_SECRET).update(token).digest('hex'),
      })

    return { success: true }
  } catch (e) {
    console.error('Gallery unlock error:', e)
    return { error: 'An error occurred' }
  }
}

export async function checkGalleryUnlocked(galleryId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(`gallery_unlock_${galleryId}`)?.value

    if (!token) return false

    return verifyUnlockCookieToken(token, galleryId)
  } catch {
    return false
  }
}

// ============================================
// PROFILE COVER IMAGE
// ============================================

/**
 * Upload a profile cover image (3:4 vertical aspect ratio)
 * Stores in profile-covers bucket, updates user.cover_image_url
 */
export async function uploadProfileCover(formData: FormData): Promise<{ success?: boolean, url?: string, error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return { error: 'Invalid file type. Use JPEG, PNG, or WebP.' }
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { error: 'File too large. Maximum 10MB.' }
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${user.id}/${Date.now()}.${ext}`

    // Delete old cover if exists
    if (user.cover_image_url) {
      const oldPath = user.cover_image_url.split('/profile-covers/')[1]
      if (oldPath) {
        await supabaseAdmin.storage.from('profile-covers').remove([oldPath])
      }
    }

    // Upload to profile-covers bucket
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-covers')
      .upload(filename, file, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Profile cover upload error:', uploadError)
      return { error: 'Failed to upload image' }
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('profile-covers')
      .getPublicUrl(filename)

    const coverUrl = urlData.publicUrl

    // Update user record
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ cover_image_url: coverUrl })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile cover update error:', updateError)
      return { error: 'Failed to save cover image' }
    }

    revalidatePath('/settings')
    revalidatePath('/profiles')
    if (user.profile_slug) {
      revalidatePath(`/profile/${user.profile_slug}`)
    }

    return { success: true, url: coverUrl }
  } catch (e) {
    console.error('Profile cover upload exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Remove profile cover image
 */
export async function removeProfileCover(): Promise<{ success?: boolean, error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Delete from storage if exists
    if (user.cover_image_url) {
      const oldPath = user.cover_image_url.split('/profile-covers/')[1]
      if (oldPath) {
        await supabaseAdmin.storage.from('profile-covers').remove([oldPath])
      }
    }

    // Clear URL in database
    const { error } = await supabaseAdmin
      .from('users')
      .update({ cover_image_url: null })
      .eq('id', user.id)

    if (error) {
      console.error('Profile cover remove error:', error)
      return { error: 'Failed to remove cover image' }
    }

    revalidatePath('/settings')
    revalidatePath('/profiles')
    if (user.profile_slug) {
      revalidatePath(`/profile/${user.profile_slug}`)
    }

    return { success: true }
  } catch (e) {
    console.error('Profile cover remove exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

// ============================================
// PUBLIC PROFILE QUERIES
// ============================================

export async function getPublicProfiles(limit = 50, offset = 0) {
  try {
    const { data, error, count } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        display_name,
        profile_slug,
        avatar_url,
        cover_image_url,
        visibility_mode,
        created_at
      `, { count: 'exact' })
      .in('visibility_mode', ['PUBLIC', 'PUBLIC_LOCKED'])
      .not('profile_slug', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Get public profiles error:', error)
      return { profiles: [], total: 0 }
    }

    // Get gallery counts and settings (for business_name fallback) for each profile
    const profileIds = data?.map(p => p.id) || []
    
    if (profileIds.length === 0) {
      return { profiles: [], total: 0 }
    }
    
    const [{ data: galleryCounts }, { data: userSettings }] = await Promise.all([
      supabaseAdmin
        .from('galleries')
        .select('user_id, id')
        .in('user_id', profileIds),
      supabaseAdmin
        .from('user_settings')
        .select('user_id, business_name')
        .in('user_id', profileIds),
    ])

    // Count galleries per user
    const countMap = new Map<string, number>()
    const userGalleries = new Map<string, string[]>()
    
    galleryCounts?.forEach(g => {
      countMap.set(g.user_id, (countMap.get(g.user_id) || 0) + 1)
      const existing = userGalleries.get(g.user_id) || []
      existing.push(g.id)
      userGalleries.set(g.user_id, existing)
    })

    const settingsMap = new Map<string, string>()
    userSettings?.forEach(s => {
      if (s.business_name) settingsMap.set(s.user_id, s.business_name)
    })

    // For profiles WITHOUT a dedicated cover, fallback to first gallery image
    const fallbackCoverMap = new Map<string, string>()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    
    const profilesNeedingFallback = data?.filter(p => !p.cover_image_url) || []
    
    if (profilesNeedingFallback.length > 0) {
      const coverPromises = profilesNeedingFallback.map(async (profile) => {
        const userGalleryIds = userGalleries.get(profile.id) || []
        if (userGalleryIds.length === 0) return
        
        const { data: firstImage } = await supabaseAdmin
          .from('images')
          .select('storage_path')
          .in('gallery_id', userGalleryIds)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()
        
        if (firstImage?.storage_path) {
          fallbackCoverMap.set(
            profile.id, 
            `${supabaseUrl}/storage/v1/object/public/gallery-images/${firstImage.storage_path}`
          )
        }
      })
      
      await Promise.all(coverPromises)
    }
    
    const profiles = data?.map(p => ({
      ...p,
      display_name: p.display_name || settingsMap.get(p.id) || null,
      galleryCount: countMap.get(p.id) || 0,
      // Prefer dedicated cover_image_url, fallback to gallery image
      coverImageUrl: p.cover_image_url || fallbackCoverMap.get(p.id) || null,
    })) || []

    return { profiles, total: count || 0 }
  } catch (e) {
    console.error('Get public profiles error:', e)
    return { profiles: [], total: 0 }
  }
}

export async function getPublicProfileBySlug(slug: string, viewerUserId?: string) {
  try {
    // First check if this is an old slug that needs redirect
    const { data: redirectSlug } = await supabaseAdmin
      .rpc('get_redirect_slug', { p_old_slug: slug })
    
    if (redirectSlug) {
      return { redirect: redirectSlug }
    }

    // First, check if profile exists at all (regardless of visibility)
    const { data: anyProfile } = await supabaseAdmin
      .from('users')
      .select('id, clerk_id, display_name, visibility_mode')
      .eq('profile_slug', slug)
      .single()

    // Check if viewer is the owner
    const isOwner = viewerUserId && anyProfile?.clerk_id === viewerUserId

    // If profile exists but is private, return private status (unless owner)
    if (anyProfile && anyProfile.visibility_mode === 'PRIVATE' && !isOwner) {
      return { 
        status: 'private' as const,
        photographerName: anyProfile.display_name || undefined,
      }
    }

    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        display_name,
        bio,
        profile_slug,
        avatar_url,
        cover_image_url,
        visibility_mode,
        created_at
      `)
      .eq('profile_slug', slug)
      .in('visibility_mode', isOwner ? ['PRIVATE', 'PUBLIC', 'PUBLIC_LOCKED'] : ['PUBLIC', 'PUBLIC_LOCKED'])
      .single()

    if (error || !profile) {
      return { status: 'not_found' as const }
    }

    // Get user settings for contact info and business name fallback
    const { data: settings } = await supabaseAdmin
      .from('user_settings')
      .select('business_name, contact_email, website_url')
      .eq('user_id', profile.id)
      .single()

    // Get galleries for this profile
    // Owners see all galleries, visitors only see public ones
    let galleriesQuery = supabaseAdmin
      .from('galleries')
      .select(`
        id,
        title,
        slug,
        is_public,
        is_locked,
        cover_image_id,
        created_at
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    
    // Only filter to public galleries for non-owners
    if (!isOwner) {
      galleriesQuery = galleriesQuery.eq('is_public', true)
    }
    
    const { data: galleries } = await galleriesQuery

    // Get image counts and cover images
    const galleryIds = galleries?.map(g => g.id) || []
    
    const { data: imageCounts } = await supabaseAdmin
      .from('images')
      .select('gallery_id')
      .in('gallery_id', galleryIds)

    const countMap = new Map<string, number>()
    imageCounts?.forEach(i => {
      countMap.set(i.gallery_id, (countMap.get(i.gallery_id) || 0) + 1)
    })

    // Get cover images (by cover_image_id or first image in gallery)
    const coverImageIds = galleries?.filter(g => g.cover_image_id).map(g => g.cover_image_id) || []
    
    let coverMap = new Map<string, string>()
    
    if (coverImageIds.length > 0) {
      const { data: coverImages } = await supabaseAdmin
        .from('images')
        .select('id, storage_path')
        .in('id', coverImageIds)
      
      coverImages?.forEach(img => {
        coverMap.set(img.id, img.storage_path)
      })
    }

    // Get curated portfolio images (from portfolio_images table, limit 10)
    // Falls back to recent gallery images if no curated selection exists
    let portfolioImages: any[] = []
    
    // First, try to get curated portfolio images
    const { data: curatedImages } = await supabaseAdmin
      .from('portfolio_images')
      .select(`
        image_id,
        position,
        images!inner (
          id,
          storage_path,
          gallery_id,
          width,
          height,
          focal_x,
          focal_y
        )
      `)
      .eq('user_id', profile.id)
      .order('position', { ascending: true })
      .limit(10)
    
    if (curatedImages && curatedImages.length > 0) {
      // Use curated portfolio images
      portfolioImages = curatedImages.map((pi: any) => ({
        id: pi.images.id,
        storage_path: pi.images.storage_path,
        gallery_id: pi.images.gallery_id,
        width: pi.images.width,
        height: pi.images.height,
        focal_x: pi.images.focal_x,
        focal_y: pi.images.focal_y,
      }))
    } else if (galleryIds.length > 0) {
      // Fallback: get recent images from galleries (limit 10)
      const { data } = await supabaseAdmin
        .from('images')
        .select(`
          id,
          storage_path,
          gallery_id,
          width,
          height,
          focal_x,
          focal_y
        `)
        .in('gallery_id', galleryIds)
        .eq('show_in_portfolio', true)
        .order('created_at', { ascending: false })
        .limit(10)
      
      portfolioImages = data || []
    }
    
    // If no explicit cover images, use first image from portfolio or galleries
    if (coverMap.size === 0 && portfolioImages.length > 0) {
      const seenGalleries = new Set<string>()
      portfolioImages.forEach(img => {
        if (!seenGalleries.has(img.gallery_id)) {
          seenGalleries.add(img.gallery_id)
          const gallery = galleries?.find(g => g.id === img.gallery_id)
          if (gallery) {
            coverMap.set(gallery.id, img.storage_path)
          }
        }
      })
    }

    const galleriesWithCounts = galleries?.map(g => ({
      ...g,
      imageCount: countMap.get(g.id) || 0,
      coverImagePath: g.cover_image_id 
        ? coverMap.get(g.cover_image_id) 
        : coverMap.get(g.id) || null, // Fallback to auto-detected cover
    })) || []

    // Format portfolio images with gallery titles
    const galleryTitleMap = new Map<string, string>()
    galleries?.forEach(g => galleryTitleMap.set(g.id, g.title))
    
    const formattedPortfolioImages = portfolioImages?.map((img: any) => ({
      id: img.id,
      storage_path: img.storage_path,
      gallery_id: img.gallery_id,
      gallery_title: galleryTitleMap.get(img.gallery_id) || '',
      width: img.width,
      height: img.height,
      focal_x: img.focal_x,
      focal_y: img.focal_y,
    })) || []

    return {
      ...profile,
      display_name: profile.display_name || settings?.business_name || null,
      contactEmail: settings?.contact_email || null,
      websiteUrl: settings?.website_url || null,
      galleries: galleriesWithCounts,
      portfolioImages: formattedPortfolioImages,
      isOwner: !!isOwner,
    }
  } catch (e) {
    console.error('Get public profile error:', e)
    return null
  }
}

export async function getUserProfile() {
  const { userId: clerkId } = await auth()
  if (!clerkId) return null

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return null

  return {
    id: user.id,
    displayName: user.display_name,
    bio: user.bio,
    profileSlug: user.profile_slug,
    avatarUrl: user.avatar_url,
    coverImageUrl: user.cover_image_url,
    visibilityMode: user.visibility_mode,
  }
}

// ============================================
// PORTFOLIO IMAGE MANAGEMENT
// ============================================

const MAX_PORTFOLIO_IMAGES = 10

export interface PortfolioImageData {
  id: string
  imageId: string
  storagePath: string
  galleryId: string
  galleryTitle: string
  position: number
  thumbnailUrl?: string
}

/**
 * Get the user's curated portfolio images
 */
export async function getPortfolioImages(): Promise<{ data?: PortfolioImageData[], error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const { data, error } = await supabaseAdmin
      .from('portfolio_images')
      .select(`
        id,
        image_id,
        position,
        images!inner (
          id,
          storage_path,
          gallery_id,
          galleries!inner (
            id,
            title
          )
        )
      `)
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Get portfolio images error:', error)
      return { error: 'Failed to fetch portfolio images' }
    }

    const portfolioImages: PortfolioImageData[] = (data || []).map((pi: any) => ({
      id: pi.id,
      imageId: pi.image_id,
      storagePath: pi.images.storage_path,
      galleryId: pi.images.gallery_id,
      galleryTitle: pi.images.galleries.title,
      position: pi.position,
    }))

    return { data: portfolioImages }
  } catch (e) {
    console.error('Get portfolio images exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get all available images that can be added to portfolio
 */
export async function getAvailableImagesForPortfolio(galleryId?: string): Promise<{ 
  data?: Array<{
    id: string
    storagePath: string
    galleryId: string
    galleryTitle: string
    isInPortfolio: boolean
  }>,
  error?: string 
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Get current portfolio image IDs
    const { data: portfolioData } = await supabaseAdmin
      .from('portfolio_images')
      .select('image_id')
      .eq('user_id', user.id)
    
    const portfolioImageIds = new Set((portfolioData || []).map(p => p.image_id))

    // Get all images from user's galleries
    let query = supabaseAdmin
      .from('images')
      .select(`
        id,
        storage_path,
        gallery_id,
        galleries!inner (
          id,
          title,
          user_id
        )
      `)
      .eq('galleries.user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (galleryId) {
      query = query.eq('gallery_id', galleryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Get available images error:', error)
      return { error: 'Failed to fetch images' }
    }

    const images = (data || []).map((img: any) => ({
      id: img.id,
      storagePath: img.storage_path,
      galleryId: img.gallery_id,
      galleryTitle: img.galleries.title,
      isInPortfolio: portfolioImageIds.has(img.id),
    }))

    return { data: images }
  } catch (e) {
    console.error('Get available images exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Add an image to the portfolio
 */
export async function addToPortfolio(imageId: string): Promise<{ success?: boolean, error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Check current count
    const { count } = await supabaseAdmin
      .from('portfolio_images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count || 0) >= MAX_PORTFOLIO_IMAGES) {
      return { error: `Portfolio is limited to ${MAX_PORTFOLIO_IMAGES} images. Remove one to add another.` }
    }

    // Verify user owns this image
    const { data: image } = await supabaseAdmin
      .from('images')
      .select('id, galleries!inner(user_id)')
      .eq('id', imageId)
      .single()

    if (!image || (image as any).galleries.user_id !== user.id) {
      return { error: 'Image not found or access denied' }
    }

    // Get next position
    const { data: maxPos } = await supabaseAdmin
      .from('portfolio_images')
      .select('position')
      .eq('user_id', user.id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const nextPosition = (maxPos?.position ?? -1) + 1

    // Add to portfolio
    const { error } = await supabaseAdmin
      .from('portfolio_images')
      .insert({
        user_id: user.id,
        image_id: imageId,
        position: nextPosition,
      })

    if (error) {
      if (error.code === '23505') {
        return { error: 'Image is already in your portfolio' }
      }
      console.error('Add to portfolio error:', error)
      return { error: 'Failed to add image to portfolio' }
    }

    revalidatePath('/settings')
    revalidatePath(`/profile/${user.profile_slug}`)

    return { success: true }
  } catch (e) {
    console.error('Add to portfolio exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Remove an image from the portfolio
 */
export async function removeFromPortfolio(imageId: string): Promise<{ success?: boolean, error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const { error } = await supabaseAdmin
      .from('portfolio_images')
      .delete()
      .eq('user_id', user.id)
      .eq('image_id', imageId)

    if (error) {
      console.error('Remove from portfolio error:', error)
      return { error: 'Failed to remove image from portfolio' }
    }

    revalidatePath('/settings')
    revalidatePath(`/profile/${user.profile_slug}`)

    return { success: true }
  } catch (e) {
    console.error('Remove from portfolio exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Reorder portfolio images
 */
export async function reorderPortfolioImages(imageIds: string[]): Promise<{ success?: boolean, error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    // Update positions for each image
    const updates = imageIds.map((imageId, index) => 
      supabaseAdmin
        .from('portfolio_images')
        .update({ position: index })
        .eq('user_id', user.id)
        .eq('image_id', imageId)
    )

    await Promise.all(updates)

    revalidatePath('/settings')
    revalidatePath(`/profile/${user.profile_slug}`)

    return { success: true }
  } catch (e) {
    console.error('Reorder portfolio exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}

/**
 * Get user's galleries for the portfolio picker
 */
export async function getGalleriesForPortfolioPicker(): Promise<{
  data?: Array<{ id: string, title: string, imageCount: number }>,
  error?: string
}> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return { error: 'Unauthorized' }

  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) return { error: 'User not found' }

  try {
    const { data: galleries, error } = await supabaseAdmin
      .from('galleries')
      .select('id, title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { error: 'Failed to fetch galleries' }
    }

    // Get image counts
    const galleryIds = galleries?.map(g => g.id) || []
    const { data: imageCounts } = await supabaseAdmin
      .from('images')
      .select('gallery_id')
      .in('gallery_id', galleryIds)

    const countMap = new Map<string, number>()
    imageCounts?.forEach(i => {
      countMap.set(i.gallery_id, (countMap.get(i.gallery_id) || 0) + 1)
    })

    const galleriesWithCounts = (galleries || []).map(g => ({
      id: g.id,
      title: g.title,
      imageCount: countMap.get(g.id) || 0,
    }))

    return { data: galleriesWithCounts }
  } catch (e) {
    console.error('Get galleries for picker exception:', e)
    return { error: 'An unexpected error occurred' }
  }
}
