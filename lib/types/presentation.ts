// Gallery Presentation Metadata Types
// Used for premium gallery delivery experience

export type EventType = 
  | 'wedding' 
  | 'engagement' 
  | 'portrait' 
  | 'maternity' 
  | 'newborn' 
  | 'family' 
  | 'corporate' 
  | 'boudoir'
  | 'elopement'
  | 'anniversary'
  | 'other'

export type HeroLayout = 'centered' | 'split' | 'fullbleed' | 'editorial' | 'cinematic'

export type ColorScheme = 'light' | 'dark' | 'warm' | 'cool' | 'auto'

export type Typography = 'classic' | 'modern' | 'editorial' | 'romantic' | 'minimal'

export interface CoupleNames {
  partner1: string
  partner2?: string // Optional for non-couple shoots
}

export interface PresentationData {
  // Event Details
  eventDate?: string // ISO date string
  eventType?: EventType
  coupleNames?: CoupleNames
  
  // Story Elements
  subtitle?: string // "A love story in the hills of Tuscany"
  quote?: string // Featured quote or vows excerpt
  quoteAttribution?: string // "Maya Angelou" or "From their vows"
  
  // Location
  venue?: string // "Villa Cimbrone"
  location?: string // "Ravello, Italy"
  
  // Visual Customization
  coverImageId?: string
  heroLayout?: HeroLayout
  colorScheme?: ColorScheme
  typography?: Typography
  
  // Photographer Branding
  showPhotographerCredit?: boolean
  customMessage?: string // Thank you message or intro text
  
  // Experience Settings
  musicUrl?: string // Optional background music
  enableAnimations?: boolean
  
  // Advanced
  customCss?: string // For power users
}

// Default presentation settings
export const DEFAULT_PRESENTATION: Partial<PresentationData> = {
  heroLayout: 'centered',
  colorScheme: 'light',
  typography: 'classic',
  showPhotographerCredit: true,
  enableAnimations: true,
}

// Event type labels for UI
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  engagement: 'Engagement',
  portrait: 'Portrait Session',
  maternity: 'Maternity',
  newborn: 'Newborn',
  family: 'Family',
  corporate: 'Corporate / Headshots',
  boudoir: 'Boudoir',
  elopement: 'Elopement',
  anniversary: 'Anniversary',
  other: 'Other',
}

// Hero layout labels
export const HERO_LAYOUT_LABELS: Record<HeroLayout, { name: string; description: string }> = {
  centered: { name: 'Centered', description: 'Classic centered hero with title overlay' },
  split: { name: 'Split', description: 'Image on one side, text on the other' },
  fullbleed: { name: 'Full Bleed', description: 'Edge-to-edge hero image' },
  editorial: { name: 'Editorial', description: 'Magazine-style asymmetric layout' },
  cinematic: { name: 'Cinematic', description: 'Dark, dramatic presentation' },
}

// Color scheme labels
export const COLOR_SCHEME_LABELS: Record<ColorScheme, { name: string; description: string }> = {
  light: { name: 'Light', description: 'Clean white background' },
  dark: { name: 'Dark', description: 'Elegant dark theme' },
  warm: { name: 'Warm', description: 'Soft cream tones' },
  cool: { name: 'Cool', description: 'Modern gray palette' },
  auto: { name: 'Auto', description: 'Match cover image mood' },
}

// Typography labels
export const TYPOGRAPHY_LABELS: Record<Typography, { name: string; font: string }> = {
  classic: { name: 'Classic', font: 'Cormorant Garamond' },
  modern: { name: 'Modern', font: 'Inter' },
  editorial: { name: 'Editorial', font: 'Playfair Display' },
  romantic: { name: 'Romantic', font: 'Crimson Text' },
  minimal: { name: 'Minimal', font: 'DM Sans' },
}

// Utility to format couple names for display
export function formatCoupleNames(names?: CoupleNames): string {
  if (!names) return ''
  if (!names.partner2) return names.partner1
  return `${names.partner1} & ${names.partner2}`
}

// Utility to format event date
export function formatEventDate(dateStr?: string, format: 'full' | 'short' | 'year' = 'full'): string {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  
  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    case 'short':
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    case 'year':
      return date.getFullYear().toString()
    default:
      return dateStr
  }
}
