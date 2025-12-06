import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getGalleryImages(galleryId: string) {
  const { data, error } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getImageById(imageId: string) {
  const { data, error } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single()

  if (error) return null
  return data
}

// Get image with gallery info for public sharing
export async function getImageWithGallery(imageId: string) {
  const { data: image, error: imageError } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single()

  if (imageError || !image) return null

  const { data: gallery, error: galleryError } = await supabaseAdmin
    .from('galleries')
    .select('id, title, slug, password_hash, download_enabled')
    .eq('id', image.gallery_id)
    .single()

  if (galleryError || !gallery) return null

  return { image, gallery }
}

export async function getImageWithOwnershipCheck(
  imageId: string,
  userId: string
) {
  // First get the image
  const { data: image, error: imageError } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('id', imageId)
    .single()

  if (imageError || !image) {
    console.log('[getImageWithOwnershipCheck] Image not found:', imageId, imageError?.message)
    return null
  }

  // Then verify ownership through the gallery
  const { data: gallery, error: galleryError } = await supabaseAdmin
    .from('galleries')
    .select('user_id')
    .eq('id', image.gallery_id)
    .single()

  if (galleryError || !gallery) {
    console.log('[getImageWithOwnershipCheck] Gallery not found:', image.gallery_id)
    return null
  }

  if (gallery.user_id !== userId) {
    console.log('[getImageWithOwnershipCheck] Ownership mismatch:', gallery.user_id, '!==', userId)
    return null
  }

  return image
}
