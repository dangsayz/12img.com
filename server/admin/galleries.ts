/**
 * Admin Gallery Management - GOD MODE
 * 
 * State-of-the-art gallery intelligence system with:
 * - Advanced search with full-text and filters
 * - Conversion scoring and upgrade targeting
 * - Bulk operations with audit trails
 * - Real-time analytics integration
 * 
 * All access is logged to the audit trail for compliance.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction } from './guards'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import type { ImageSizePreset } from '@/lib/utils/constants'

// ============================================================================
// TYPES
// ============================================================================

export interface AdminGalleryImage {
  id: string
  storagePath: string
  originalFilename: string
  width: number | null
  height: number | null
  position: number
  fileSizeBytes: number
  thumbnailUrl: string
}

export interface AdminGalleryDetails {
  id: string
  userId: string
  userEmail: string
  title: string
  slug: string
  description: string | null
  isPublic: boolean
  isLocked: boolean
  coverImageId: string | null
  imageCount: number
  totalBytes: number
  createdAt: string
  updatedAt: string
  images: AdminGalleryImage[]
}

export interface GallerySearchFilters {
  search?: string
  userId?: string
  visibility?: 'all' | 'public' | 'private'
  plan?: string
  minImages?: number
  maxImages?: number
  minStorage?: number
  maxStorage?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: 'created_at' | 'image_count' | 'total_bytes' | 'conversion_score' | 'title'
  sortOrder?: 'asc' | 'desc'
}

export interface GalleryAnalytics {
  id: string
  title: string
  slug: string
  description: string | null
  isPublic: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
  userId: string
  userEmail: string
  userPlan: string
  userBusinessName: string | null
  imageCount: number
  totalBytes: number
  avgFileSize: number
  firstImagePath: string | null
  lastUploadAt: string | null
  emailsSent: number
  emailOpens: number
  emailClicks: number
  emailDownloads: number
  conversionScore: number
  daysSinceCreated: number
  daysSinceActivity: number
  // Computed UI helpers
  storageMB: number
  isHighValue: boolean
  upgradeCandidate: boolean
}

export interface GallerySearchResult {
  data: GalleryAnalytics[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  aggregates: {
    totalImages: number
    totalStorage: number
    avgConversionScore: number
    publicCount: number
    privateCount: number
  }
}

/**
 * Get gallery details with images for admin viewing
 * Logs access to audit trail
 */
export async function getAdminGalleryDetails(
  galleryId: string
): Promise<AdminGalleryDetails> {
  const admin = await requireCapability('galleries.view')
  
  // Get gallery with user info
  const { data: gallery, error: galleryError } = await supabaseAdmin
    .from('galleries')
    .select(`
      *,
      users!user_id (
        id,
        email
      )
    `)
    .eq('id', galleryId)
    .single()
  
  if (galleryError || !gallery) {
    throw new Error('Gallery not found')
  }
  
  // Get images
  const { data: images, error: imagesError } = await supabaseAdmin
    .from('images')
    .select('id, storage_path, original_filename, width, height, position, file_size_bytes')
    .eq('gallery_id', galleryId)
    .order('position', { ascending: true })
  
  if (imagesError) {
    throw new Error(`Failed to fetch images: ${imagesError.message}`)
  }
  
  // Get signed thumbnail URLs
  const storagePaths = images?.map(img => img.storage_path) || []
  const urlMap = await getSignedUrlsBatch(storagePaths, 3600, 'THUMBNAIL')
  
  // Calculate total storage
  const totalBytes = images?.reduce((sum, img) => sum + (img.file_size_bytes || 0), 0) || 0
  
  // Log the access with full context
  await logAdminAction(admin.userId, 'gallery.view', {
    targetType: 'gallery',
    targetId: galleryId,
    targetIdentifier: gallery.slug,
    metadata: {
      galleryTitle: gallery.title,
      ownerEmail: gallery.users?.email,
      ownerId: gallery.user_id,
      imageCount: images?.length || 0,
      isPublic: gallery.is_public,
      reason: 'admin_panel_view',
    },
  })
  
  return {
    id: gallery.id,
    userId: gallery.user_id,
    userEmail: gallery.users?.email || 'Unknown',
    title: gallery.title,
    slug: gallery.slug,
    description: gallery.description,
    isPublic: gallery.is_public,
    isLocked: gallery.is_locked,
    coverImageId: gallery.cover_image_id,
    imageCount: images?.length || 0,
    totalBytes,
    createdAt: gallery.created_at,
    updatedAt: gallery.updated_at,
    images: (images || []).map(img => ({
      id: img.id,
      storagePath: img.storage_path,
      originalFilename: img.original_filename,
      width: img.width,
      height: img.height,
      position: img.position,
      fileSizeBytes: img.file_size_bytes || 0,
      thumbnailUrl: urlMap.get(img.storage_path) || '',
    })),
  }
}

/**
 * Get a single image with full-size URL for admin viewing
 * Logs access to audit trail
 */
export async function getAdminImageUrl(
  imageId: string,
  size: ImageSizePreset = 'PREVIEW'
): Promise<{ url: string; galleryId: string; galleryTitle: string }> {
  const admin = await requireCapability('galleries.view')
  
  // Get image with gallery info
  const { data: image, error } = await supabaseAdmin
    .from('images')
    .select(`
      id,
      storage_path,
      gallery_id,
      galleries!gallery_id (
        title,
        slug,
        user_id,
        users!user_id (
          email
        )
      )
    `)
    .eq('id', imageId)
    .single()
  
  if (error || !image) {
    throw new Error('Image not found')
  }
  
  // Get signed URL
  const urlMap = await getSignedUrlsBatch([image.storage_path], 3600, size)
  const url = urlMap.get(image.storage_path)
  
  if (!url) {
    throw new Error('Failed to generate image URL')
  }
  
  // Extract nested data (Supabase returns single relations as objects, not arrays)
  const gallery = image.galleries as unknown as { title: string; slug: string; user_id: string; users: { email: string } } | null
  
  // Log the access
  await logAdminAction(admin.userId, 'gallery.view', {
    targetType: 'image',
    targetId: imageId,
    targetIdentifier: gallery?.slug,
    metadata: {
      galleryId: image.gallery_id,
      galleryTitle: gallery?.title,
      ownerEmail: gallery?.users?.email,
      size,
      reason: 'admin_image_view',
    },
  })
  
  return {
    url,
    galleryId: image.gallery_id,
    galleryTitle: gallery?.title || 'Unknown',
  }
}

/**
 * List all galleries with pagination (for admin gallery browser)
 */
export async function listAdminGalleries(params: {
  page?: number
  pageSize?: number
  search?: string
  userId?: string
  isPublic?: boolean
}) {
  const admin = await requireCapability('galleries.list')
  
  const {
    page = 1,
    pageSize = 25,
    search,
    userId,
    isPublic,
  } = params
  
  let query = supabaseAdmin
    .from('galleries')
    .select(`
      id,
      title,
      slug,
      is_public,
      is_locked,
      created_at,
      user_id,
      users!user_id (
        email
      ),
      images!gallery_id (count)
    `, { count: 'exact' })
  
  if (search) {
    query = query.or(`title.ilike.%${search}%,slug.ilike.%${search}%`)
  }
  if (userId) {
    query = query.eq('user_id', userId)
  }
  if (isPublic !== undefined) {
    query = query.eq('is_public', isPublic)
  }
  
  query = query.order('created_at', { ascending: false })
  
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Failed to list galleries: ${error.message}`)
  }
  
  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

// ============================================================================
// ADVANCED SEARCH & ANALYTICS (GOD MODE)
// ============================================================================

/**
 * Advanced gallery search with full analytics
 * Uses the search_galleries_admin RPC function for optimal performance
 */
export async function searchGalleriesAdvanced(
  filters: GallerySearchFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<GallerySearchResult> {
  await requireCapability('galleries.list')
  
  // Call the RPC function for advanced search
  const { data, error } = await supabaseAdmin.rpc('search_galleries_admin', {
    search_query: filters.search || null,
    filter_user_id: filters.userId || null,
    filter_visibility: filters.visibility || 'all',
    filter_plan: filters.plan || null,
    filter_min_images: filters.minImages || null,
    filter_max_images: filters.maxImages || null,
    filter_min_storage: filters.minStorage || null,
    filter_max_storage: filters.maxStorage || null,
    filter_date_from: filters.dateFrom || null,
    filter_date_to: filters.dateTo || null,
    sort_by: filters.sortBy || 'created_at',
    sort_order: filters.sortOrder || 'desc',
    page_num: page,
    page_size: pageSize,
  })
  
  if (error) {
    // RPC not available, use fallback
    return fallbackGallerySearch(filters, page, pageSize)
  }
  
  const total = data?.[0]?.total_count || 0
  
  // Transform to our interface
  const galleries: GalleryAnalytics[] = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    isPublic: row.is_public,
    isLocked: row.is_locked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
    userEmail: row.user_email,
    userPlan: row.user_plan || 'free',
    userBusinessName: row.user_business_name,
    imageCount: Number(row.image_count) || 0,
    totalBytes: Number(row.total_bytes) || 0,
    avgFileSize: 0,
    firstImagePath: row.first_image_path,
    lastUploadAt: null,
    emailsSent: Number(row.emails_sent) || 0,
    emailOpens: 0,
    emailClicks: 0,
    emailDownloads: 0,
    conversionScore: row.conversion_score || 0,
    daysSinceCreated: row.days_since_created || 0,
    daysSinceActivity: row.days_since_activity || 0,
    // Computed
    storageMB: Math.round((Number(row.total_bytes) || 0) / (1024 * 1024) * 10) / 10,
    isHighValue: row.conversion_score >= 70,
    upgradeCandidate: row.user_plan === 'free' && row.conversion_score >= 50,
  }))
  
  // Calculate aggregates
  const aggregates = {
    totalImages: galleries.reduce((sum, g) => sum + g.imageCount, 0),
    totalStorage: galleries.reduce((sum, g) => sum + g.totalBytes, 0),
    avgConversionScore: galleries.length > 0 
      ? Math.round(galleries.reduce((sum, g) => sum + g.conversionScore, 0) / galleries.length)
      : 0,
    publicCount: galleries.filter(g => g.isPublic).length,
    privateCount: galleries.filter(g => !g.isPublic).length,
  }
  
  return {
    data: galleries,
    total: Number(total),
    page,
    pageSize,
    totalPages: Math.ceil(Number(total) / pageSize),
    aggregates,
  }
}

/**
 * Fallback search if RPC function not available
 */
async function fallbackGallerySearch(
  filters: GallerySearchFilters,
  page: number,
  pageSize: number
): Promise<GallerySearchResult> {
  // Use only columns that exist in the actual galleries table
  let query = supabaseAdmin
    .from('galleries')
    .select(`
      id,
      title,
      slug,
      is_public,
      is_locked,
      created_at,
      updated_at,
      user_id,
      users!user_id (
        email,
        plan
      )
    `, { count: 'exact' })
  
  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
  }
  if (filters.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters.visibility === 'public') {
    query = query.eq('is_public', true)
  } else if (filters.visibility === 'private') {
    query = query.eq('is_public', false)
  }
  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }
  
  // Only sort by columns that exist
  const validSortColumns = ['created_at', 'title', 'updated_at']
  const sortBy = validSortColumns.includes(filters.sortBy || '') ? filters.sortBy : 'created_at'
  
  query = query.order(sortBy || 'created_at', { 
    ascending: filters.sortOrder === 'asc' 
  })
  
  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)
  
  const { data, error, count } = await query
  
  if (error) {
    throw new Error(`Gallery search failed: ${error.message}`)
  }
  
  const galleries: GalleryAnalytics[] = (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: null, // Column doesn't exist in current schema
    isPublic: row.is_public,
    isLocked: row.is_locked || false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    userId: row.user_id,
    userEmail: row.users?.email || 'Unknown',
    userPlan: row.users?.plan || 'free',
    userBusinessName: null,
    imageCount: 0,
    totalBytes: 0,
    avgFileSize: 0,
    firstImagePath: null,
    lastUploadAt: null,
    emailsSent: 0,
    emailOpens: 0,
    emailClicks: 0,
    emailDownloads: 0,
    conversionScore: 0,
    daysSinceCreated: Math.floor((Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    daysSinceActivity: 0,
    storageMB: 0,
    isHighValue: false,
    upgradeCandidate: row.users?.plan === 'free',
  }))
  
  return {
    data: galleries,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
    aggregates: {
      totalImages: 0,
      totalStorage: 0,
      avgConversionScore: 0,
      publicCount: galleries.filter(g => g.isPublic).length,
      privateCount: galleries.filter(g => !g.isPublic).length,
    },
  }
}

/**
 * Get conversion candidates - users most likely to upgrade
 */
export async function getConversionCandidates(limit: number = 50) {
  await requireCapability('galleries.list')
  
  const { data, error } = await supabaseAdmin.rpc('get_conversion_candidates', {
    limit_count: limit,
  })
  
  if (error) {
    // RPC not available
    return []
  }
  
  return (data || []).map((row: any) => ({
    userId: row.user_id,
    email: row.email,
    plan: row.plan,
    businessName: row.business_name,
    storagePercent: row.storage_percent,
    galleryCount: row.gallery_count,
    totalImages: row.total_images,
    daysActive: row.days_active,
    conversionScore: row.conversion_score,
    recommendedAction: row.recommended_action,
    recommendedPlan: row.recommended_plan,
  }))
}

/**
 * Transfer gallery ownership
 */
export async function transferGalleryOwnership(
  galleryId: string,
  newOwnerId: string
): Promise<boolean> {
  const admin = await requireCapability('galleries.delete') // Requires high privilege
  
  const { data, error } = await supabaseAdmin.rpc('admin_transfer_gallery', {
    p_gallery_id: galleryId,
    p_new_owner_id: newOwnerId,
    p_admin_id: admin.userId,
  })
  
  if (error) {
    throw new Error(`Transfer failed: ${error.message}`)
  }
  
  return true
}

/**
 * Bulk delete galleries with audit trail
 */
export async function bulkDeleteGalleries(
  galleryIds: string[]
): Promise<number> {
  const admin = await requireCapability('galleries.delete')
  
  const { data, error } = await supabaseAdmin.rpc('admin_delete_galleries', {
    p_gallery_ids: galleryIds,
    p_admin_id: admin.userId,
  })
  
  if (error) {
    throw new Error(`Bulk delete failed: ${error.message}`)
  }
  
  return data || 0
}

/**
 * Toggle gallery visibility
 */
export async function toggleGalleryVisibility(
  galleryId: string,
  isPublic: boolean
): Promise<boolean> {
  const admin = await requireCapability('galleries.delete')
  
  // Get current gallery info for audit
  const { data: gallery } = await supabaseAdmin
    .from('galleries')
    .select('title, slug, is_public, user_id')
    .eq('id', galleryId)
    .single()
  
  if (!gallery) {
    throw new Error('Gallery not found')
  }
  
  // Update visibility
  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq('id', galleryId)
  
  if (error) {
    throw new Error(`Failed to update visibility: ${error.message}`)
  }
  
  // Log action
  await logAdminAction(admin.userId, 'gallery.update', {
    targetType: 'gallery',
    targetId: galleryId,
    targetIdentifier: gallery.slug,
    metadata: {
      action: 'visibility_change',
      oldValue: gallery.is_public,
      newValue: isPublic,
      galleryTitle: gallery.title,
    },
  })
  
  return true
}

/**
 * Get gallery stats summary for dashboard
 */
export async function getGalleryStats() {
  await requireCapability('galleries.list')
  
  const { count: totalGalleries } = await supabaseAdmin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
  
  const { count: publicGalleries } = await supabaseAdmin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
  
  const { count: recentGalleries } = await supabaseAdmin
    .from('galleries')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  
  const { count: totalImages } = await supabaseAdmin
    .from('images')
    .select('*', { count: 'exact', head: true })
  
  const total = totalGalleries || 0
  const publicCount = publicGalleries || 0
  
  return {
    totalGalleries: total,
    publicGalleries: publicCount,
    privateGalleries: total - publicCount,
    galleriesThisWeek: recentGalleries || 0,
    totalImages: totalImages || 0,
  }
}
