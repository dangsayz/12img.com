import { supabaseAdmin } from '@/lib/supabase/admin'
import { getSignedDownloadUrl, getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { getUserByClerkId } from './user.queries'

export async function getGalleryById(galleryId: string) {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('*')
    .eq('id', galleryId)
    .single()

  if (error) return null
  return data
}

export async function getGalleryBySlug(slug: string) {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) return null
  return data
}

export async function verifyGalleryOwnership(
  galleryId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}

export async function getGalleryWithOwnershipCheck(
  galleryIdOrSlug: string,
  userId: string
) {
  // Try by UUID first, then by slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(galleryIdOrSlug)
  
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('*')
    .eq(isUUID ? 'id' : 'slug', galleryIdOrSlug)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data
}

export async function getUserGalleries(clerkId: string) {
  console.log('[getUserGalleries] Starting for clerkId:', clerkId)
  
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    console.log('[getUserGalleries] User not found')
    return []
  }
  console.log('[getUserGalleries] User found:', user.id)

  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select(
      `
      id,
      title,
      slug,
      password_hash,
      download_enabled,
      is_public,
      archived_at,
      archived_reason,
      created_at,
      updated_at,
      cover_image_id
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getUserGalleries] Query error:', error)
    throw error
  }
  
  console.log('[getUserGalleries] Found', data.length, 'galleries')
  console.log('[getUserGalleries] Galleries with cover_image_id:', data.filter(g => g.cover_image_id).map(g => ({ id: g.id, title: g.title, cover_image_id: g.cover_image_id })))

  // Get image counts
  const galleryIds = data.map((g) => g.id)
  const { data: imageCounts } = await supabaseAdmin
    .from('images')
    .select('gallery_id')
    .in('gallery_id', galleryIds)

  const countMap = new Map<string, number>()
  imageCounts?.forEach((img) => {
    countMap.set(img.gallery_id, (countMap.get(img.gallery_id) || 0) + 1)
  })

  // Get cover images - either explicit cover_image_id or first image as fallback
  const coverImageIds = data
    .filter((g) => g.cover_image_id)
    .map((g) => g.cover_image_id!)

  console.log('[getUserGalleries] Galleries with explicit cover_image_id:', coverImageIds.length)

  let coverImages: { id: string; storage_path: string }[] = []
  if (coverImageIds.length > 0) {
    const { data: covers, error: coverError } = await supabaseAdmin
      .from('images')
      .select('id, storage_path')
      .in('id', coverImageIds)

    if (coverError) {
      console.error('[getUserGalleries] Error fetching cover images:', coverError)
    }
    coverImages = covers || []
    console.log('[getUserGalleries] Found cover images:', coverImages.length, 'of', coverImageIds.length, 'requested')
  }

  // For galleries without explicit cover, get first portrait image as fallback (or first image)
  const galleriesWithoutCover = data.filter((g) => !g.cover_image_id)
  const fallbackCoverMap = new Map<string, string>() // gallery_id -> storage_path
  
  if (galleriesWithoutCover.length > 0) {
    const galleryIdsWithoutCover = galleriesWithoutCover.map(g => g.id)
    
    // Get images with dimensions to find portrait images
    const { data: allImages } = await supabaseAdmin
      .from('images')
      .select('gallery_id, storage_path, width, height, created_at')
      .in('gallery_id', galleryIdsWithoutCover)
      .order('created_at', { ascending: true })
    
    // For each gallery, prefer portrait image (height > width), fallback to first
    if (allImages) {
      const galleryImages = new Map<string, typeof allImages>()
      for (const img of allImages) {
        if (!galleryImages.has(img.gallery_id)) {
          galleryImages.set(img.gallery_id, [])
        }
        galleryImages.get(img.gallery_id)!.push(img)
      }
      
      for (const [galleryId, images] of galleryImages) {
        // Find first portrait image
        const portraitImg = images.find(img => img.width && img.height && img.height > img.width)
        const coverImg = portraitImg || images[0]
        if (coverImg) {
          fallbackCoverMap.set(galleryId, coverImg.storage_path)
        }
      }
    }
  }

  // Generate signed URLs for all covers (explicit + fallback)
  const allCoverPaths = [
    ...coverImages.map((c) => c.storage_path),
    ...Array.from(fallbackCoverMap.values())
  ]
  const signedUrls =
    allCoverPaths.length > 0 ? await getSignedUrlsBatch(allCoverPaths, undefined, 'COVER') : new Map()

  // Map explicit cover image IDs to URLs
  const coverUrlMap = new Map<string, string>()
  coverImages.forEach((c) => {
    const url = signedUrls.get(c.storage_path)
    if (url) {
      coverUrlMap.set(c.id, url)
    } else {
      console.warn('[getUserGalleries] No signed URL for cover image:', c.id, 'path:', c.storage_path)
    }
  })

  console.log('[getUserGalleries] Cover URL map size:', coverUrlMap.size)

  return data.map((gallery) => {
    // Use explicit cover if set, otherwise use fallback first image
    let coverImageUrl: string | null = null
    if (gallery.cover_image_id) {
      coverImageUrl = coverUrlMap.get(gallery.cover_image_id) || null
      if (!coverImageUrl) {
        console.warn('[getUserGalleries] Gallery', gallery.id, 'has cover_image_id', gallery.cover_image_id, 'but no URL found')
      }
    } else {
      const fallbackPath = fallbackCoverMap.get(gallery.id)
      if (fallbackPath) {
        coverImageUrl = signedUrls.get(fallbackPath) || null
      }
    }
    
    return {
      id: gallery.id,
      title: gallery.title,
      slug: gallery.slug,
      hasPassword: !!gallery.password_hash,
      downloadEnabled: gallery.download_enabled,
      isPublic: gallery.is_public ?? true,
      isArchived: !!gallery.archived_at,
      archivedAt: gallery.archived_at,
      archivedReason: gallery.archived_reason,
      createdAt: gallery.created_at,
      updatedAt: gallery.updated_at,
      coverImageUrl,
      imageCount: countMap.get(gallery.id) || 0,
    }
  })
}
