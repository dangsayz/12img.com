/**
 * Pricing Configuration v2
 * 
 * Canonical source of truth for:
 * - Plan tiers and pricing
 * - Feature availability matrix
 * - Feature groups and rows
 * 
 * Designed to power both landing page and dashboard pricing tables
 */

// ═══════════════════════════════════════════════════════════════
// PLAN TIERS
// ═══════════════════════════════════════════════════════════════

export type PlanTier = 'free' | 'essential' | 'pro' | 'studio' | 'elite'

export interface PlanTierConfig {
  id: PlanTier
  name: string
  tagline: string
  monthlyPrice: number
  annualPrice: number      // Total yearly
  annualMonthly: number    // Annual price / 12 for display
  storageGB: number
  approxPhotos: number
  galleryLimit: number | 'unlimited'
  expiryDays: number | 'unlimited'
  contractsPerMonth: number | 'unlimited'  // Monthly contract limit
  clientManagement: boolean                 // Access to client features
  isPopular?: boolean
  badge?: string
}

export const PLAN_TIERS: Record<PlanTier, PlanTierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Test drive',
    monthlyPrice: 0,
    annualPrice: 0,
    annualMonthly: 0,
    storageGB: 2,
    approxPhotos: 1300,
    galleryLimit: 3,
    expiryDays: 7,
    contractsPerMonth: 1,        // Trial: 1 contract to test the feature
    clientManagement: false,     // No client management on free
  },
  essential: {
    id: 'essential',
    name: 'Essential',
    tagline: 'For part-time photographers',
    monthlyPrice: 6,
    annualPrice: 60,
    annualMonthly: 5,
    storageGB: 10,
    approxPhotos: 4000,
    galleryLimit: 'unlimited',
    expiryDays: 'unlimited',
    contractsPerMonth: 5,
    clientManagement: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Most popular',
    monthlyPrice: 12,
    annualPrice: 120,
    annualMonthly: 10,
    storageGB: 100,
    approxPhotos: 31000,
    galleryLimit: 'unlimited',
    expiryDays: 'unlimited',
    contractsPerMonth: 15,
    clientManagement: true,
    isPopular: true,
    badge: 'Most Popular',
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    tagline: 'For busy studios',
    monthlyPrice: 18,
    annualPrice: 180,
    annualMonthly: 15,
    storageGB: 500,
    approxPhotos: 151000,
    galleryLimit: 'unlimited',
    expiryDays: 'unlimited',
    contractsPerMonth: 50,
    clientManagement: true,
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    tagline: 'For power users',
    monthlyPrice: 30,
    annualPrice: 300,
    annualMonthly: 25,
    storageGB: 2000,
    approxPhotos: 600000,
    galleryLimit: 'unlimited',
    expiryDays: 'unlimited',
    contractsPerMonth: 'unlimited',
    clientManagement: true,
  },
}

export const PLAN_ORDER: PlanTier[] = ['free', 'essential', 'pro', 'studio', 'elite']

// ═══════════════════════════════════════════════════════════════
// FEATURE AVAILABILITY
// ═══════════════════════════════════════════════════════════════

export type FeatureAvailability =
  | 'included'      // ✔ Available
  | 'excluded'      // — Not available
  | 'premium'       // Enhanced on this tier
  | 'addon'         // Available as paid add-on
  | 'comingSoon'    // Planned feature
  | 'limited'       // Available with restrictions

export interface FeatureValue {
  status: FeatureAvailability
  note?: string              // e.g., "$6/mo", "Up to 3"
  tooltip?: string           // Expanded description
}

// ═══════════════════════════════════════════════════════════════
// FEATURE GROUPS & ROWS
// ═══════════════════════════════════════════════════════════════

export type FeatureGroupId = 
  | 'storage'
  | 'galleries'
  | 'delivery'
  | 'clients'
  | 'branding'
  | 'automation'
  | 'advanced'

export interface FeatureGroup {
  id: FeatureGroupId
  label: string
  order: number
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  { id: 'storage', label: 'Storage & Limits', order: 0 },
  { id: 'galleries', label: 'Gallery Features', order: 1 },
  { id: 'delivery', label: 'Client Delivery', order: 2 },
  { id: 'clients', label: 'Client Management', order: 3 },
  { id: 'branding', label: 'Branding & Customization', order: 4 },
  { id: 'automation', label: 'Automation & Tools', order: 5 },
  { id: 'advanced', label: 'Advanced Features', order: 6 },
]

export interface FeatureRow {
  id: string
  group: FeatureGroupId
  label: string
  description?: string
  availability: Record<PlanTier, FeatureValue>
}

export const FEATURE_ROWS: FeatureRow[] = [
  // ─── Storage & Limits ───
  {
    id: 'photo_storage',
    group: 'storage',
    label: 'Photo Storage',
    description: 'Total storage for your galleries',
    availability: {
      free: { status: 'included', note: '2GB', tooltip: 'Approx. 1,300 photos' },
      essential: { status: 'included', note: '10GB', tooltip: 'Approx. 4,000 photos' },
      pro: { status: 'included', note: '100GB', tooltip: 'Approx. 31,000 photos' },
      studio: { status: 'included', note: '500GB', tooltip: 'Approx. 151,000 photos' },
      elite: { status: 'included', note: '2TB', tooltip: 'Approx. 600,000 photos' },
    },
  },
  {
    id: 'gallery_limit',
    group: 'storage',
    label: 'Active Galleries',
    description: 'Number of galleries you can maintain',
    availability: {
      free: { status: 'limited', note: '3 galleries' },
      essential: { status: 'included', note: 'Unlimited' },
      pro: { status: 'included', note: 'Unlimited' },
      studio: { status: 'included', note: 'Unlimited' },
      elite: { status: 'included', note: 'Unlimited' },
    },
  },
  // ─── Gallery Features ───
  {
    id: 'client_galleries',
    group: 'galleries',
    label: 'Client Galleries',
    description: 'Beautiful, mobile-optimized photo galleries',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'masonry_grid',
    group: 'galleries',
    label: 'Masonry Grid Layout',
    description: 'Responsive grid that adapts to image sizes',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'fullscreen_viewer',
    group: 'galleries',
    label: 'Fullscreen Viewer',
    description: 'Immersive image viewing experience',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'cinematic_reel',
    group: 'galleries',
    label: 'Cinematic Reel',
    description: '30-second auto-playing slideshow',
    availability: {
      free: { status: 'comingSoon' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },
  {
    id: 'slideshows',
    group: 'galleries',
    label: 'Custom Slideshows',
    description: 'Music-synced slideshows with transitions',
    availability: {
      free: { status: 'comingSoon' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },

  // ─── Client Delivery ───
  {
    id: 'password_protection',
    group: 'delivery',
    label: 'Password Protection',
    description: 'Secure access codes for galleries',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'download_options',
    group: 'delivery',
    label: 'Download Options',
    description: 'Individual and bulk downloads',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'zip_backup',
    group: 'delivery',
    label: 'Automatic ZIP Backup',
    description: 'Auto-generated ZIP sent to your inbox',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'email_notifications',
    group: 'delivery',
    label: 'Email Notifications',
    description: 'Notify clients when gallery is ready',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },

  // ─── Client Management ───
  {
    id: 'smart_contracts',
    group: 'clients',
    label: 'Smart Contracts',
    description: 'Professional contracts with e-signatures',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'client_portal',
    group: 'clients',
    label: 'Client Portal',
    description: 'Dedicated portal for each client',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'client_messaging',
    group: 'clients',
    label: 'Client Messaging',
    description: 'Built-in chat with read receipts',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'milestone_tracking',
    group: 'clients',
    label: 'Milestone Tracking',
    description: 'Track project progress with delivery countdown',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },

  // ─── Branding & Customization ───
  {
    id: 'custom_branding',
    group: 'branding',
    label: 'Custom Branding',
    description: 'Your logo and watermarks',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },
  {
    id: 'remove_12img_branding',
    group: 'branding',
    label: 'Remove 12img Branding',
    description: 'White-label galleries',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },
  {
    id: 'custom_domain',
    group: 'branding',
    label: 'Custom Domain',
    description: 'Use your own domain for galleries',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'excluded' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },

  // ─── Automation & Tools ───
  {
    id: 'bulk_upload',
    group: 'automation',
    label: 'Bulk Upload',
    description: 'Upload hundreds of images at once',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'image_optimization',
    group: 'automation',
    label: 'Auto Image Optimization',
    description: 'Automatic resizing and compression',
    availability: {
      free: { status: 'included' },
      essential: { status: 'included' },
      pro: { status: 'included' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'ai_tagging',
    group: 'automation',
    label: 'AI Image Tagging',
    description: 'Automatic image categorization',
    availability: {
      free: { status: 'comingSoon' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },
  {
    id: 'automated_workflows',
    group: 'automation',
    label: 'Automated Workflows',
    description: 'Schedule emails based on event dates',
    availability: {
      free: { status: 'limited', note: '3 active', tooltip: '3 active automations, pre-built templates only' },
      essential: { status: 'limited', note: '10 active', tooltip: '10 active automations, 3 custom templates' },
      pro: { status: 'included', note: 'Unlimited', tooltip: 'Unlimited automations and custom templates' },
      studio: { status: 'included', note: 'Unlimited', tooltip: 'Unlimited automations and custom templates' },
      elite: { status: 'included', note: 'Unlimited', tooltip: 'Unlimited automations and custom templates' },
    },
  },
  {
    id: 'vendor_network',
    group: 'automation',
    label: 'Vendor Network',
    description: 'Share galleries with vendors for referrals',
    availability: {
      free: { status: 'limited', note: '3 vendors', tooltip: '3 vendors, 3 shares/month' },
      essential: { status: 'limited', note: '15 vendors', tooltip: '15 vendors, 15 shares/month' },
      pro: { status: 'limited', note: '50 vendors', tooltip: '50 vendors, 50 shares/month' },
      studio: { status: 'included', note: 'Unlimited', tooltip: 'Unlimited vendors and shares' },
      elite: { status: 'included', note: 'Unlimited', tooltip: 'Unlimited vendors and shares' },
    },
  },

  // ─── Advanced Features ───
  {
    id: 'priority_support',
    group: 'advanced',
    label: 'Priority Support',
    description: 'Fast-track support responses',
    availability: {
      free: { status: 'excluded' },
      essential: { status: 'excluded' },
      pro: { status: 'excluded' },
      studio: { status: 'included' },
      elite: { status: 'included' },
    },
  },
  {
    id: 'video_support',
    group: 'advanced',
    label: 'Video Uploads',
    description: 'Upload and deliver video content',
    availability: {
      free: { status: 'comingSoon' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },
  {
    id: 'raw_support',
    group: 'advanced',
    label: 'RAW File Support',
    description: 'Upload RAW image formats',
    availability: {
      free: { status: 'comingSoon' },
      essential: { status: 'comingSoon' },
      pro: { status: 'comingSoon' },
      studio: { status: 'comingSoon' },
      elite: { status: 'comingSoon' },
    },
  },
]

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getPlanTier(id: PlanTier): PlanTierConfig {
  return PLAN_TIERS[id]
}

export function getFeaturesByGroup(groupId: FeatureGroupId): FeatureRow[] {
  return FEATURE_ROWS.filter(f => f.group === groupId)
}

export function getFeatureAvailability(
  featureId: string, 
  planId: PlanTier
): FeatureValue | undefined {
  const feature = FEATURE_ROWS.find(f => f.id === featureId)
  return feature?.availability[planId]
}

export function isFeatureIncluded(featureId: string, planId: PlanTier): boolean {
  const availability = getFeatureAvailability(featureId, planId)
  return availability?.status === 'included' || availability?.status === 'premium'
}

export function formatStorageDisplay(gb: number): string {
  if (gb >= 1000) return `${gb / 1000}TB`
  return `${gb}GB`
}

export function formatApproxPhotos(count: number): string {
  if (count >= 1000) return `~${Math.round(count / 1000)}K`
  return `~${count}`
}

/**
 * Check if a plan has client management access
 */
export function hasClientManagement(planId: PlanTier): boolean {
  return PLAN_TIERS[planId]?.clientManagement ?? false
}

/**
 * Get contract limit for a plan
 */
export function getContractLimit(planId: PlanTier): number | 'unlimited' {
  return PLAN_TIERS[planId]?.contractsPerMonth ?? 0
}

/**
 * Check if user can create more contracts this month
 */
export function canCreateContract(planId: PlanTier, contractsThisMonth: number): boolean {
  const limit = PLAN_TIERS[planId]?.contractsPerMonth
  if (limit === 'unlimited') return true
  return contractsThisMonth < limit
}
