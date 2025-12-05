import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getGalleryImages(galleryId: string) {
  const { data, error } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('position', { ascending: true })

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

export async function getImageWithOwnershipCheck(
  imageId: string,
  userId: string
) {
  const { data, error } = await supabaseAdmin
    .from('images')
    .select(
      `
      *,
      galleries!inner(user_id)
    `
    )
    .eq('id', imageId)
    .single()

  if (error || !data) return null

  // Check ownership through gallery
  const gallery = data.galleries as unknown as { user_id: string }
  if (gallery.user_id !== userId) return null

  return data
}
