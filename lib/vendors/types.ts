/**
 * Vendor Network Types
 * 
 * Types for the vendor network feature that enables photographers
 * to share galleries with event vendors (florists, planners, venues, etc.)
 */

// ═══════════════════════════════════════════════════════════════
// VENDOR CATEGORIES
// ═══════════════════════════════════════════════════════════════

export type VendorCategory =
  | 'florist'
  | 'planner'
  | 'venue'
  | 'dj'
  | 'caterer'
  | 'bakery'
  | 'rentals'
  | 'hair_makeup'
  | 'videographer'
  | 'officiant'
  | 'transportation'
  | 'other'

export interface VendorCategoryConfig {
  id: VendorCategory
  label: string
  emoji: string
  color: string  // Tailwind color class
  bgColor: string
}

export const VENDOR_CATEGORIES: Record<VendorCategory, VendorCategoryConfig> = {
  florist: {
    id: 'florist',
    label: 'Florist',
    emoji: '🌸',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
  planner: {
    id: 'planner',
    label: 'Planner',
    emoji: '💎',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  venue: {
    id: 'venue',
    label: 'Venue',
    emoji: '🏛️',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
  dj: {
    id: 'dj',
    label: 'DJ / Music',
    emoji: '🎵',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  caterer: {
    id: 'caterer',
    label: 'Caterer',
    emoji: '🍽️',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  bakery: {
    id: 'bakery',
    label: 'Bakery',
    emoji: '🎂',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  rentals: {
    id: 'rentals',
    label: 'Rentals',
    emoji: '🪑',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  hair_makeup: {
    id: 'hair_makeup',
    label: 'Hair & Makeup',
    emoji: '💄',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  videographer: {
    id: 'videographer',
    label: 'Videographer',
    emoji: '🎬',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  officiant: {
    id: 'officiant',
    label: 'Officiant',
    emoji: '📜',
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  transportation: {
    id: 'transportation',
    label: 'Transportation',
    emoji: '🚗',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  other: {
    id: 'other',
    label: 'Other',
    emoji: '✨',
    color: 'text-stone-600',
    bgColor: 'bg-stone-100',
  },
}

export const VENDOR_CATEGORY_OPTIONS = Object.values(VENDOR_CATEGORIES)

// ═══════════════════════════════════════════════════════════════
// VENDOR
// ═══════════════════════════════════════════════════════════════

export interface Vendor {
  id: string
  user_id: string
  business_name: string
  category: VendorCategory
  contact_name: string | null
  email: string | null
  phone: string | null
  instagram_handle: string | null
  website: string | null
  logo_url: string | null
  color: string | null
  notes: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface CreateVendorInput {
  business_name: string
  category: VendorCategory
  contact_name?: string
  email?: string
  phone?: string
  instagram_handle?: string
  website?: string
  logo_url?: string
  color?: string
  notes?: string
}

export interface UpdateVendorInput {
  business_name?: string
  category?: VendorCategory
  contact_name?: string | null
  email?: string | null
  phone?: string | null
  instagram_handle?: string | null
  website?: string | null
  logo_url?: string | null
  color?: string | null
  notes?: string | null
  is_archived?: boolean
}

// ═══════════════════════════════════════════════════════════════
// VENDOR TERMS TEMPLATES
// ═══════════════════════════════════════════════════════════════

export interface VendorTermsTemplate {
  id: string
  user_id: string
  name: string
  content: string
  is_default: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface CreateTermsTemplateInput {
  name: string
  content: string
  is_default?: boolean
}

export interface UpdateTermsTemplateInput {
  name?: string
  content?: string
  is_default?: boolean
}

// Default system template content
export const DEFAULT_VENDOR_TERMS = `MEDIA USAGE AGREEMENT

By downloading these images, you agree to the following terms:

1. CREDIT REQUIRED: You must credit the photographer when posting these images on social media or any public platform.

2. NO EDITING: Images may not be edited, filtered, cropped, or altered in any way without written permission.

3. NO COMMERCIAL USE: Images are for your portfolio and social media only. They may not be used in paid advertising without written permission.

4. NO TRANSFER: You may not share, sell, or transfer these images to third parties.

5. REMOVAL REQUEST: The photographer reserves the right to request removal of any posted images at any time.

By downloading, you acknowledge and accept these terms.`

// ═══════════════════════════════════════════════════════════════
// GALLERY VENDOR SHARES
// ═══════════════════════════════════════════════════════════════

export type ShareType = 'entire' | 'selected'

export interface GalleryVendorShare {
  id: string
  gallery_id: string
  vendor_id: string
  user_id: string
  share_type: ShareType
  terms_template_id: string | null
  custom_terms: string | null
  access_token: string
  shared_at: string
  viewed_at: string | null
  view_count: number
  downloaded_at: string | null
  download_count: number
  terms_accepted_at: string | null
  is_revoked: boolean
  revoked_at: string | null
}

export interface GalleryVendorShareWithDetails extends GalleryVendorShare {
  vendor: Vendor
  gallery: {
    id: string
    title: string
    slug: string
  }
  terms_template: VendorTermsTemplate | null
  image_count: number
}

export interface CreateGalleryVendorShareInput {
  gallery_id: string
  vendor_id: string
  share_type: ShareType
  terms_template_id?: string
  custom_terms?: string
  selected_image_ids?: string[]  // Only for share_type = 'selected'
}

export interface UpdateGalleryVendorShareInput {
  share_type?: ShareType
  terms_template_id?: string | null
  custom_terms?: string | null
  selected_image_ids?: string[]
}

// ═══════════════════════════════════════════════════════════════
// GALLERY VENDOR IMAGES
// ═══════════════════════════════════════════════════════════════

export interface GalleryVendorImage {
  id: string
  share_id: string
  image_id: string
  position: number
  created_at: string
}

// ═══════════════════════════════════════════════════════════════
// VENDOR PORTAL (PUBLIC VIEW)
// ═══════════════════════════════════════════════════════════════

export interface VendorPortalData {
  share: GalleryVendorShare
  vendor: Vendor
  gallery: {
    id: string
    title: string
    slug: string
  }
  photographer: {
    id: string
    business_name: string | null
    instagram_handle: string | null
  }
  terms: string | null  // Resolved terms (custom or from template)
  images: VendorPortalImage[]
}

export interface VendorPortalImage {
  id: string
  storage_path: string
  original_filename: string
  width: number | null
  height: number | null
  thumbnail_url: string
  preview_url: string
  download_url: string
}

// ═══════════════════════════════════════════════════════════════
// PLAN LIMITS
// ═══════════════════════════════════════════════════════════════

export interface VendorPlanLimits {
  maxVendors: number | 'unlimited'
  maxSharesPerMonth: number | 'unlimited'
  maxTermsTemplates: number | 'unlimited'
}

export const VENDOR_PLAN_LIMITS: Record<string, VendorPlanLimits> = {
  free: {
    maxVendors: 3,
    maxSharesPerMonth: 3,
    maxTermsTemplates: 1,
  },
  essential: {
    maxVendors: 15,
    maxSharesPerMonth: 15,
    maxTermsTemplates: 3,
  },
  pro: {
    maxVendors: 50,
    maxSharesPerMonth: 50,
    maxTermsTemplates: 10,
  },
  studio: {
    maxVendors: 'unlimited',
    maxSharesPerMonth: 'unlimited',
    maxTermsTemplates: 'unlimited',
  },
  elite: {
    maxVendors: 'unlimited',
    maxSharesPerMonth: 'unlimited',
    maxTermsTemplates: 'unlimited',
  },
}

export interface VendorUsage {
  vendorCount: number
  monthlyShareCount: number
  termsTemplateCount: number
}

export interface VendorLimitsWithUsage {
  limits: VendorPlanLimits
  usage: VendorUsage
  canAddVendor: boolean
  canShareGallery: boolean
  canCreateTemplate: boolean
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get vendor initials for avatar fallback
 */
export function getVendorInitials(businessName: string): string {
  const words = businessName.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * Format Instagram handle (ensure @ prefix)
 */
export function formatInstagramHandle(handle: string | null): string | null {
  if (!handle) return null
  return handle.startsWith('@') ? handle : `@${handle}`
}

/**
 * Get Instagram profile URL
 */
export function getInstagramUrl(handle: string | null): string | null {
  if (!handle) return null
  const cleanHandle = handle.replace('@', '')
  return `https://instagram.com/${cleanHandle}`
}

/**
 * Generate vendor portal URL
 */
export function getVendorPortalUrl(accessToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://12img.com'
  return `${baseUrl}/vendor/${accessToken}`
}

/**
 * Check if limit is reached
 */
export function isLimitReached(
  current: number,
  limit: number | 'unlimited'
): boolean {
  if (limit === 'unlimited') return false
  return current >= limit
}
