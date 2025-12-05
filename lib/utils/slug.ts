import slugify from 'slugify'
import { customAlphabet } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Only lowercase letters and numbers to match DB constraint: ^[a-z0-9-]+$
const nanoid6 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)
const nanoid8 = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8)

// Reserved words that can't be used as slugs (system routes, offensive terms)
const RESERVED_SLUGS = new Set([
  // System routes
  'admin', 'api', 'app', 'auth', 'login', 'logout', 'signup', 'signin',
  'register', 'settings', 'account', 'profile', 'dashboard', 'upload',
  'gallery', 'galleries', 'user', 'users', 'static', 'assets', 'images',
  'img', 'image', 'media', 'files', 'file', 'download', 'downloads',
  'public', 'private', 'new', 'create', 'edit', 'delete', 'remove',
  'help', 'support', 'contact', 'about', 'terms', 'privacy', 'legal',
  'blog', 'news', 'pricing', 'plans', 'billing', 'checkout', 'pay',
  'null', 'undefined', 'true', 'false', 'test', 'demo', 'example',
  'www', 'mail', 'email', 'ftp', 'ssh', 'root', 'system',
  // Common offensive terms (basic filter)
  'admin', 'moderator', 'staff', 'official', '12img', 'pixieset',
])

// Max slug base length (before random suffix)
const MAX_SLUG_BASE_LENGTH = 50
const MIN_SLUG_BASE_LENGTH = 2

/**
 * Sanitizes and generates a URL-safe slug from a title
 * - Removes special characters, emojis, unicode
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Adds random suffix for uniqueness
 * - Falls back to random slug if title is invalid
 */
export function generateSlug(title: string): string {
  // Step 1: Basic cleanup - trim and remove excessive whitespace
  let cleaned = (title || '').trim().replace(/\s+/g, ' ')
  
  // Step 2: Remove emojis and special unicode characters
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Emojis
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
  
  // Step 3: Use slugify for proper URL encoding
  let base = slugify(cleaned, {
    lower: true,
    strict: true, // Remove special characters
    trim: true,
    remove: /[*+~.()'"!:@#$%^&={}|[\]\\;<>?,]/g
  })
  
  // Step 4: Remove any remaining non-alphanumeric chars except hyphens
  base = base.replace(/[^a-z0-9-]/g, '')
  
  // Step 5: Clean up multiple hyphens and trim hyphens from ends
  base = base.replace(/-+/g, '-').replace(/^-|-$/g, '')
  
  // Step 6: Enforce length limits
  if (base.length > MAX_SLUG_BASE_LENGTH) {
    // Cut at word boundary if possible
    base = base.substring(0, MAX_SLUG_BASE_LENGTH)
    const lastHyphen = base.lastIndexOf('-')
    if (lastHyphen > MIN_SLUG_BASE_LENGTH) {
      base = base.substring(0, lastHyphen)
    }
  }
  
  // Step 7: Check if base is valid (not too short, not reserved)
  const isValidBase = 
    base.length >= MIN_SLUG_BASE_LENGTH && 
    !RESERVED_SLUGS.has(base) &&
    !/^\d+$/.test(base) // Not just numbers
  
  // Step 8: Use base or fallback
  const finalBase = isValidBase ? base : 'photos'
  
  // Step 9: Add random suffix for uniqueness
  const suffix = nanoid6()
  
  return `${finalBase}-${suffix}`
}

/**
 * Generates a unique slug, checking against existing slugs in the database
 * Falls back to fully random slug after multiple collision attempts
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  let slug = generateSlug(title)
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    const { data } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) {
      return slug
    }

    // Collision - try again with new random suffix
    slug = generateSlug(title)
    attempts++
  }

  // After max attempts, use fully random slug
  return `photos-${nanoid8()}`
}

/**
 * Validates a slug format (for manual slug entry if ever needed)
 */
export function isValidSlugFormat(slug: string): boolean {
  // Must be 3-60 chars, lowercase alphanumeric with hyphens, no leading/trailing hyphens
  const slugRegex = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/
  return slugRegex.test(slug) && !RESERVED_SLUGS.has(slug.split('-')[0])
}
