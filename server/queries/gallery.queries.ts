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
  galleryId: string,
  userId: string
) {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('*')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data
}

export async function getUserGalleries(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) return []

  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select(
      `
      id,
      title,
      slug,
      password_hash,
      download_enabled,
      created_at,
      updated_at,
      cover_image_id
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

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

  // Get cover images
  const coverImageIds = data
    .filter((g) => g.cover_image_id)
    .map((g) => g.cover_image_id!)

  let coverImages: { id: string; storage_path: string }[] = []
  if (coverImageIds.length > 0) {
    const { data: covers } = await supabaseAdmin
      .from('images')
      .select('id, storage_path')
      .in('id', coverImageIds)

    coverImages = covers || []
  }

  // Generate signed URLs for covers
  const coverPaths = coverImages.map((c) => c.storage_path)
  const signedUrls =
    coverPaths.length > 0 ? await getSignedUrlsBatch(coverPaths) : new Map()

  const coverUrlMap = new Map<string, string>()
  coverImages.forEach((c) => {
    const url = signedUrls.get(c.storage_path)
    if (url) coverUrlMap.set(c.id, url)
  })

  return data.map((gallery) => ({
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    hasPassword: !!gallery.password_hash,
    downloadEnabled: gallery.download_enabled,
    createdAt: gallery.created_at,
    updatedAt: gallery.updated_at,
    coverImageUrl: gallery.cover_image_id
      ? coverUrlMap.get(gallery.cover_image_id) || null
      : null,
    imageCount: countMap.get(gallery.id) || 0,
  }))
}
