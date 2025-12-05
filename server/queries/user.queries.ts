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

export async function getUserSettings(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return {
      defaultPasswordEnabled: false,
      defaultDownloadEnabled: true,
    }
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('default_password_enabled, default_download_enabled')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return {
      defaultPasswordEnabled: false,
      defaultDownloadEnabled: true,
    }
  }

  return {
    defaultPasswordEnabled: data.default_password_enabled,
    defaultDownloadEnabled: data.default_download_enabled,
  }
}

export async function getUserWithUsage(clerkId: string) {
  const user = await getOrCreateUserByClerkId(clerkId)
  if (!user) {
    return null
  }

  const usage = await getUserStorageUsage(clerkId)
  
  return {
    id: user.id,
    email: user.email,
    plan: (user.plan || 'free') as 'free' | 'basic' | 'pro' | 'studio',
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
