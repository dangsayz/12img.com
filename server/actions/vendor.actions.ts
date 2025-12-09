'use server'

import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserByClerkId, getUserSettings } from '@/server/queries/user.queries'
import { sendVendorShareEmail } from '@/server/services/email.service'
import {
  Vendor,
  VendorCategory,
  CreateVendorInput,
  UpdateVendorInput,
  VendorTermsTemplate,
  CreateTermsTemplateInput,
  UpdateTermsTemplateInput,
  GalleryVendorShare,
  GalleryVendorShareWithDetails,
  CreateGalleryVendorShareInput,
  UpdateGalleryVendorShareInput,
  VendorPortalData,
  VendorPortalImage,
  VendorLimitsWithUsage,
  VENDOR_PLAN_LIMITS,
  DEFAULT_VENDOR_TERMS,
  isLimitReached,
} from '@/lib/vendors/types'

// ═══════════════════════════════════════════════════════════════
// SEARCH REGISTERED USERS
// ═══════════════════════════════════════════════════════════════

export interface RegisteredUser {
  id: string
  email?: string | null
  display_name: string | null
  profile_slug: string | null
  instagram_handle: string | null
  business_name: string | null
}

/**
 * Look up a registered 12img user by email
 * Returns user info if found, null if not registered
 */
export async function lookupUserByEmail(email: string): Promise<RegisteredUser | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  if (!email || !email.includes('@')) return null

  const supabase = supabaseAdmin
  const normalizedEmail = email.toLowerCase().trim()
  
  console.log('Email lookup - searching for:', normalizedEmail)
  
  // First, just find the user by email (simple query)
  const { data: foundUser, error } = await supabase
    .from('users')
    .select('id, email, display_name, profile_slug')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (error) {
    console.log('Email lookup - error:', error.message)
    return null
  }
  
  if (!foundUser) {
    console.log('Email lookup - no user found for:', normalizedEmail)
    return null
  }

  console.log('Email lookup - found user:', foundUser.id, foundUser.email)

  // Now get their settings separately
  const { data: settings } = await supabase
    .from('user_settings')
    .select('business_name, instagram_handle')
    .eq('user_id', foundUser.id)
    .maybeSingle()

  return {
    id: foundUser.id,
    email: foundUser.email,
    display_name: foundUser.display_name,
    profile_slug: foundUser.profile_slug,
    instagram_handle: settings?.instagram_handle || null,
    business_name: settings?.business_name || null,
  }
}

/**
 * Get previously used vendor emails for autocomplete
 * Returns emails from existing vendors that the user has added
 */
export async function getVendorEmailSuggestions(query: string): Promise<string[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  if (!query || query.length < 2) return []

  const supabase = supabaseAdmin
  
  const { data, error } = await supabase
    .from('vendors')
    .select('email')
    .eq('user_id', user.id)
    .not('email', 'is', null)
    .ilike('email', `%${query}%`)
    .limit(5)

  if (error) return []
  
  return (data || []).map(v => v.email).filter(Boolean) as string[]
}

// ═══════════════════════════════════════════════════════════════
// VENDOR CRUD
// ═══════════════════════════════════════════════════════════════

export async function getVendors(): Promise<Vendor[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('business_name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function getVendor(vendorId: string): Promise<Vendor | null> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function createVendor(input: CreateVendorInput): Promise<Vendor> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  // Check limits
  const limits = await getVendorLimits()
  if (!limits.canAddVendor) {
    throw new Error('Vendor limit reached for your plan')
  }

  const supabase = supabaseAdmin
  
  // Clean instagram handle
  const instagram = input.instagram_handle?.replace('@', '') || null

  const { data, error } = await supabase
    .from('vendors')
    .insert({
      user_id: user.id,
      business_name: input.business_name,
      category: input.category,
      contact_name: input.contact_name || null,
      email: input.email || input.invite_email || null,
      phone: input.phone || null,
      instagram_handle: instagram,
      website: input.website || null,
      logo_url: input.logo_url || null,
      color: input.color || null,
      notes: input.notes || null,
      linked_user_id: input.linked_user_id || null,
      invite_sent_at: input.invite_email ? new Date().toISOString() : null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  // TODO: Send invitation email if invite_email is provided
  // if (input.invite_email) {
  //   await sendVendorInviteEmail(input.invite_email, user, data)
  // }
  
  revalidatePath('/settings/vendors')
  return data
}

export async function updateVendor(
  vendorId: string,
  input: UpdateVendorInput
): Promise<Vendor> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin

  // Clean instagram handle if provided
  const updateData: Record<string, unknown> = { ...input }
  if (input.instagram_handle !== undefined) {
    updateData.instagram_handle = input.instagram_handle?.replace('@', '') || null
  }

  const { data, error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', vendorId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
  return data
}

export async function archiveVendor(vendorId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { error } = await supabase
    .from('vendors')
    .update({ is_archived: true })
    .eq('id', vendorId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
}

export async function deleteVendor(vendorId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', vendorId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
}

// ═══════════════════════════════════════════════════════════════
// TERMS TEMPLATES
// ═══════════════════════════════════════════════════════════════

export async function getTermsTemplates(): Promise<VendorTermsTemplate[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { data, error } = await supabase
    .from('vendor_terms_templates')
    .select('*')
    .or(`user_id.eq.${user.id},is_system.eq.true`)
    .order('is_system', { ascending: false })
    .order('is_default', { ascending: false })
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createTermsTemplate(
  input: CreateTermsTemplateInput
): Promise<VendorTermsTemplate> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  // Check limits
  const limits = await getVendorLimits()
  if (!limits.canCreateTemplate) {
    throw new Error('Terms template limit reached for your plan')
  }

  const supabase = supabaseAdmin

  // If setting as default, unset other defaults first
  if (input.is_default) {
    await supabase
      .from('vendor_terms_templates')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('vendor_terms_templates')
    .insert({
      user_id: user.id,
      name: input.name,
      content: input.content,
      is_default: input.is_default || false,
      is_system: false,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
  return data
}

export async function updateTermsTemplate(
  templateId: string,
  input: UpdateTermsTemplateInput
): Promise<VendorTermsTemplate> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin

  // If setting as default, unset other defaults first
  if (input.is_default) {
    await supabase
      .from('vendor_terms_templates')
      .update({ is_default: false })
      .eq('user_id', user.id)
  }

  const { data, error } = await supabase
    .from('vendor_terms_templates')
    .update(input)
    .eq('id', templateId)
    .eq('user_id', user.id)
    .eq('is_system', false)  // Can't edit system templates
    .select()
    .single()

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
  return data
}

export async function deleteTermsTemplate(templateId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { error } = await supabase
    .from('vendor_terms_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', user.id)
    .eq('is_system', false)  // Can't delete system templates

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
}

export async function setDefaultTermsTemplate(templateId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin

  // Unset all defaults
  await supabase
    .from('vendor_terms_templates')
    .update({ is_default: false })
    .eq('user_id', user.id)

  // Set new default
  const { error } = await supabase
    .from('vendor_terms_templates')
    .update({ is_default: true })
    .eq('id', templateId)
    .or(`user_id.eq.${user.id},is_system.eq.true`)

  if (error) throw new Error(error.message)
  
  revalidatePath('/settings/vendors')
}

// ═══════════════════════════════════════════════════════════════
// GALLERY VENDOR SHARES
// ═══════════════════════════════════════════════════════════════

export async function getGalleryVendorShares(
  galleryId: string
): Promise<GalleryVendorShareWithDetails[]> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  
  // Get shares for this gallery where the vendor belongs to the current user
  const { data, error } = await supabase
    .from('gallery_vendor_shares')
    .select(`
      *,
      vendor:vendors!inner(*),
      gallery:galleries(id, title, slug),
      terms_template:vendor_terms_templates(*)
    `)
    .eq('gallery_id', galleryId)
    .eq('vendor.user_id', user.id)
    .order('shared_at', { ascending: false })

  if (error) {
    // Table may not exist yet - return empty array
    if (error.message.includes('does not exist')) {
      console.log('gallery_vendor_shares table not yet created - run migration 055')
      return []
    }
    console.error('getGalleryVendorShares error:', error)
    throw new Error(error.message)
  }

  // Get image counts for each share
  const shares = data || []
  const sharesWithCounts = await Promise.all(
    shares.map(async (share) => {
      let imageCount = 0
      if (share.share_type === 'selected') {
        const { count } = await supabase
          .from('gallery_vendor_images')
          .select('*', { count: 'exact', head: true })
          .eq('share_id', share.id)
        imageCount = count || 0
      } else {
        const { count } = await supabase
          .from('images')
          .select('*', { count: 'exact', head: true })
          .eq('gallery_id', galleryId)
        imageCount = count || 0
      }
      return { ...share, image_count: imageCount }
    })
  )

  return sharesWithCounts as GalleryVendorShareWithDetails[]
}

export async function shareGalleryWithVendor(
  input: CreateGalleryVendorShareInput
): Promise<GalleryVendorShare> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  // Check limits
  const limits = await getVendorLimits()
  if (!limits.canShareGallery) {
    throw new Error('Monthly share limit reached for your plan')
  }

  const supabase = supabaseAdmin

  // Generate unique access token
  const accessToken = generateAccessToken()

  const { data, error } = await supabase
    .from('gallery_vendor_shares')
    .insert({
      gallery_id: input.gallery_id,
      vendor_id: input.vendor_id,
      user_id: user.id,
      share_type: input.share_type,
      terms_template_id: input.terms_template_id || null,
      custom_terms: input.custom_terms || null,
      access_token: accessToken,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  // If selected images, insert them
  if (input.share_type === 'selected' && input.selected_image_ids?.length) {
    const imageInserts = input.selected_image_ids.map((imageId, index) => ({
      share_id: data.id,
      image_id: imageId,
      position: index,
    }))

    const { error: imageError } = await supabase
      .from('gallery_vendor_images')
      .insert(imageInserts)

    if (imageError) throw new Error(imageError.message)
  }

  // Send email notification to vendor
  try {
    // Get vendor details
    const { data: vendor } = await supabase
      .from('vendors')
      .select('business_name, email')
      .eq('id', input.vendor_id)
      .single()

    // Get gallery details
    const { data: gallery } = await supabase
      .from('galleries')
      .select('title')
      .eq('id', input.gallery_id)
      .single()

    // Get image count
    const { count: imageCount } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('gallery_id', input.gallery_id)

    // Get photographer settings
    const settings = await getUserSettings(clerkId)

    if (vendor?.email && gallery) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com'
      const accessUrl = `${baseUrl}/vendor/${accessToken}`

      await sendVendorShareEmail({
        vendorName: vendor.business_name,
        vendorEmail: vendor.email,
        galleryTitle: gallery.title,
        photographerName: user.display_name || 'A photographer',
        photographerBusiness: settings.businessName || undefined,
        imageCount: imageCount || 0,
        accessUrl,
      })
    }
  } catch (emailError) {
    // Don't fail the share if email fails
    console.error('Failed to send vendor share email:', emailError)
  }

  revalidatePath(`/gallery/${input.gallery_id}`)
  return data
}

export async function updateGalleryVendorShare(
  shareId: string,
  input: UpdateGalleryVendorShareInput
): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin

  // Update share
  const updateData: Record<string, unknown> = {}
  if (input.share_type) updateData.share_type = input.share_type
  if (input.terms_template_id !== undefined) updateData.terms_template_id = input.terms_template_id
  if (input.custom_terms !== undefined) updateData.custom_terms = input.custom_terms

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabase
      .from('gallery_vendor_shares')
      .update(updateData)
      .eq('id', shareId)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  }

  // Update selected images if provided
  if (input.selected_image_ids !== undefined) {
    // Delete existing
    await supabase
      .from('gallery_vendor_images')
      .delete()
      .eq('share_id', shareId)

    // Insert new
    if (input.selected_image_ids.length > 0) {
      const imageInserts = input.selected_image_ids.map((imageId, index) => ({
        share_id: shareId,
        image_id: imageId,
        position: index,
      }))

      const { error: imageError } = await supabase
        .from('gallery_vendor_images')
        .insert(imageInserts)

      if (imageError) throw new Error(imageError.message)
    }
  }
}

export async function revokeGalleryVendorShare(shareId: string): Promise<void> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin
  const { error } = await supabase
    .from('gallery_vendor_shares')
    .update({ is_revoked: true, revoked_at: new Date().toISOString() })
    .eq('id', shareId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

/**
 * Resend vendor share email
 */
export async function resendVendorShareEmail(shareId: string): Promise<{ success: boolean; error?: string }> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin

  // Get share with vendor and gallery info
  const { data: share, error } = await supabase
    .from('gallery_vendor_shares')
    .select(`
      access_token,
      vendor:vendors(business_name, email),
      gallery:galleries(id, title)
    `)
    .eq('id', shareId)
    .eq('user_id', user.id)
    .single()

  if (error || !share) {
    return { success: false, error: 'Share not found' }
  }

  const vendor = share.vendor as any
  const gallery = share.gallery as any

  if (!vendor?.email) {
    return { success: false, error: 'Vendor has no email address' }
  }

  // Get image count
  const { count: imageCount } = await supabase
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('gallery_id', gallery.id)

  // Get photographer settings
  const settings = await getUserSettings(clerkId)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com'
  const accessUrl = `${baseUrl}/vendor/${share.access_token}`

  const result = await sendVendorShareEmail({
    vendorName: vendor.business_name,
    vendorEmail: vendor.email,
    galleryTitle: gallery.title,
    photographerName: user.display_name || 'A photographer',
    photographerBusiness: settings.businessName || undefined,
    imageCount: imageCount || 0,
    accessUrl,
  })

  return result
}

// ═══════════════════════════════════════════════════════════════
// VENDOR PORTAL (PUBLIC)
// ═══════════════════════════════════════════════════════════════

export async function getVendorPortalData(
  accessToken: string
): Promise<VendorPortalData | null> {
  const supabase = supabaseAdmin

  // Get share with related data
  const { data: share, error } = await supabase
    .from('gallery_vendor_shares')
    .select(`
      *,
      vendor:vendors(*),
      gallery:galleries(id, title, slug, user_id),
      terms_template:vendor_terms_templates(*)
    `)
    .eq('access_token', accessToken)
    .eq('is_revoked', false)
    .single()

  if (error || !share) return null

  // Get photographer info
  const { data: photographer } = await supabase
    .from('users')
    .select('id, business_name, instagram_handle')
    .eq('id', share.gallery.user_id)
    .single()

  // Get images
  let images: VendorPortalImage[] = []
  
  if (share.share_type === 'selected') {
    // Get selected images
    const { data: selectedImages } = await supabase
      .from('gallery_vendor_images')
      .select(`
        image:images(id, storage_path, original_filename, width, height)
      `)
      .eq('share_id', share.id)
      .order('position', { ascending: true })

    images = (selectedImages || []).map((si: any) => {
      const img = Array.isArray(si.image) ? si.image[0] : si.image
      return {
        id: img.id,
        storage_path: img.storage_path,
        original_filename: img.original_filename,
        width: img.width,
        height: img.height,
        thumbnail_url: '', // Will be populated with signed URLs
        preview_url: '',
        download_url: '',
      }
    }).filter((img: any) => img.id)
  } else {
    // Get all gallery images
    const { data: galleryImages } = await supabase
      .from('images')
      .select('id, storage_path, original_filename, width, height')
      .eq('gallery_id', share.gallery_id)
      .order('position', { ascending: true })

    images = (galleryImages || []).map((img) => ({
      id: img.id,
      storage_path: img.storage_path,
      original_filename: img.original_filename,
      width: img.width,
      height: img.height,
      thumbnail_url: '',
      preview_url: '',
      download_url: '',
    }))
  }

  // Generate signed URLs for images
  const imagesWithUrls = await Promise.all(
    images.map(async (img) => {
      const { data: thumbnailData } = await supabase.storage
        .from('gallery-images')
        .createSignedUrl(img.storage_path.replace('.', '_thumb.'), 3600)
      
      const { data: previewData } = await supabase.storage
        .from('gallery-images')
        .createSignedUrl(img.storage_path.replace('.', '_preview.'), 3600)
      
      const { data: downloadData } = await supabase.storage
        .from('gallery-images')
        .createSignedUrl(img.storage_path, 3600, { download: true })

      return {
        ...img,
        thumbnail_url: thumbnailData?.signedUrl || '',
        preview_url: previewData?.signedUrl || img.storage_path,
        download_url: downloadData?.signedUrl || '',
      }
    })
  )

  // Resolve terms
  const terms = share.custom_terms || share.terms_template?.content || DEFAULT_VENDOR_TERMS

  // Track view
  await supabase.rpc('track_vendor_share_view', { p_token: accessToken })

  return {
    share,
    vendor: share.vendor,
    gallery: {
      id: share.gallery.id,
      title: share.gallery.title,
      slug: share.gallery.slug,
    },
    photographer: photographer || { id: '', business_name: null, instagram_handle: null },
    terms,
    images: imagesWithUrls,
  }
}

export async function acceptVendorTerms(accessToken: string): Promise<void> {
  const supabase = supabaseAdmin
  await supabase.rpc('accept_vendor_share_terms', { p_token: accessToken })
}

export async function trackVendorDownload(accessToken: string): Promise<void> {
  const supabase = supabaseAdmin
  await supabase.rpc('track_vendor_share_download', { p_token: accessToken })
}

// ═══════════════════════════════════════════════════════════════
// LIMITS
// ═══════════════════════════════════════════════════════════════

export async function getVendorLimits(): Promise<VendorLimitsWithUsage> {
  const { userId: clerkId } = await auth()
  if (!clerkId) throw new Error('Unauthorized')

  const user = await getUserByClerkId(clerkId)
  if (!user) throw new Error('User not found')

  const supabase = supabaseAdmin

  // Get user's plan
  const { data: userData } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = userData?.plan || 'free'
  const limits = VENDOR_PLAN_LIMITS[plan] || VENDOR_PLAN_LIMITS.free

  // Get current usage
  const { data: vendorCount } = await supabase.rpc('get_vendor_count', { p_user_id: user.id })
  const { data: shareCount } = await supabase.rpc('get_monthly_vendor_share_count', { p_user_id: user.id })
  const { data: templateCount } = await supabase.rpc('get_vendor_terms_count', { p_user_id: user.id })

  const usage = {
    vendorCount: vendorCount || 0,
    monthlyShareCount: shareCount || 0,
    termsTemplateCount: templateCount || 0,
  }

  return {
    limits,
    usage,
    canAddVendor: !isLimitReached(usage.vendorCount, limits.maxVendors),
    canShareGallery: !isLimitReached(usage.monthlyShareCount, limits.maxSharesPerMonth),
    canCreateTemplate: !isLimitReached(usage.termsTemplateCount, limits.maxTermsTemplates),
  }
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function generateAccessToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}
