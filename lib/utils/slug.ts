import slugify from 'slugify'
import { customAlphabet } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Only lowercase letters and numbers to match DB constraint: ^[a-z0-9-]+$
const nanoid6 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)
const nanoid12 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 12)

export function generateSlug(title: string): string {
  const base = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  })

  const safeBase = base.length >= 3 ? base : 'gallery'
  const suffix = nanoid6()

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

  return `gallery-${nanoid12()}`
}
