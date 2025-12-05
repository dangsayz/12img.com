import slugify from 'slugify'
import { nanoid } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase/admin'

export function generateSlug(title: string): string {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  })

  const safeBase = base.length >= 3 ? base : 'gallery'
  const suffix = nanoid(6)

  return `${safeBase}-${suffix}`
}

export async function generateUniqueSlug(title: string): Promise<string> {
  let slug = generateSlug(title)
  let attempts = 0

  while (attempts < 5) {
    const { data } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) {
      return slug
    }

    slug = generateSlug(title)
    attempts++
  }

  return `gallery-${nanoid(12)}`
}
