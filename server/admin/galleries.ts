/**
 * Admin Gallery Management
 * 
 * Server-only module for viewing and managing galleries from admin panel.
 * All access is logged to the audit trail for compliance.
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireCapability, logAdminAction } from './guards'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import type { ImageSizePreset } from '@/lib/utils/constants'

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
