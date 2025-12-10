/**
 * Promo Persistence Layer
 * 
 * Stores promo codes in both cookie and localStorage to survive:
 * - Page refreshes
 * - Sign-up flow (Clerk redirect)
 * - Multiple sessions
 * 
 * Cookie: 30-day expiry, httpOnly: false (needs JS access)
 * localStorage: Backup for cookie-blocked browsers
 */

const PROMO_COOKIE_NAME = '12img_promo'
const PROMO_STORAGE_KEY = '12img_promo'
const PROMO_EXPIRY_DAYS = 30

export interface StoredPromo {
  code: string           // The coupon code (e.g., "FOUNDER100")
  campaignSlug: string   // Campaign identifier
  plan?: string          // Target plan if specified
  discount?: number      // Discount value for display
  discountType?: 'percent' | 'fixed' | 'price_override'
  expiresAt: string      // When this stored promo expires
  capturedAt: string     // When user first saw the promo
  source?: string        // UTM source
  medium?: string        // UTM medium
  campaign?: string      // UTM campaign
}

/**
 * Store a promo code (call this when user lands on /promo/[code])
 */
export function storePromo(promo: Omit<StoredPromo, 'expiresAt' | 'capturedAt'>): void {
  const storedPromo: StoredPromo = {
    ...promo,
    capturedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + PROMO_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
  }
  
  const value = JSON.stringify(storedPromo)
  
  // Store in cookie
  setCookie(PROMO_COOKIE_NAME, value, PROMO_EXPIRY_DAYS)
  
  // Store in localStorage as backup
  try {
    localStorage.setItem(PROMO_STORAGE_KEY, value)
  } catch {
    // localStorage might be blocked
  }
}

/**
 * Get the stored promo code (checks cookie first, then localStorage)
 */
export function getStoredPromo(): StoredPromo | null {
  // Try cookie first
  const cookieValue = getCookie(PROMO_COOKIE_NAME)
  if (cookieValue) {
    try {
      const promo = JSON.parse(cookieValue) as StoredPromo
      if (new Date(promo.expiresAt) > new Date()) {
        return promo
      }
      // Expired, clean up
      clearPromo()
      return null
    } catch {
      // Invalid JSON
    }
  }
  
  // Try localStorage
  try {
    const storageValue = localStorage.getItem(PROMO_STORAGE_KEY)
    if (storageValue) {
      const promo = JSON.parse(storageValue) as StoredPromo
      if (new Date(promo.expiresAt) > new Date()) {
        // Restore to cookie
        setCookie(PROMO_COOKIE_NAME, storageValue, PROMO_EXPIRY_DAYS)
        return promo
      }
      // Expired, clean up
      clearPromo()
    }
  } catch {
    // localStorage might be blocked
  }
  
  return null
}

/**
 * Get just the promo code (convenience method)
 */
export function getPromoCode(): string | null {
  const promo = getStoredPromo()
  return promo?.code || null
}

/**
 * Check if user has an active promo
 */
export function hasActivePromo(): boolean {
  return getStoredPromo() !== null
}

/**
 * Clear the stored promo (call after successful redemption)
 */
export function clearPromo(): void {
  // Clear cookie
  deleteCookie(PROMO_COOKIE_NAME)
  
  // Clear localStorage
  try {
    localStorage.removeItem(PROMO_STORAGE_KEY)
  } catch {
    // localStorage might be blocked
  }
}

/**
 * Get promo from URL params (for pages that receive ?promo=CODE)
 */
export function getPromoFromUrl(): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  return params.get('promo')
}

/**
 * Initialize promo from URL if present
 * Call this on pages where promo param might be in URL
 */
export function initPromoFromUrl(): StoredPromo | null {
  const code = getPromoFromUrl()
  if (!code) return getStoredPromo()
  
  // Check if we already have this promo stored
  const existing = getStoredPromo()
  if (existing?.code === code) return existing
  
  // Store the new promo (minimal info, will be enriched by API)
  const promo: Omit<StoredPromo, 'expiresAt' | 'capturedAt'> = {
    code,
    campaignSlug: code.toLowerCase(),
  }
  
  // Get UTM params
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('utm_source')) promo.source = params.get('utm_source')!
    if (params.get('utm_medium')) promo.medium = params.get('utm_medium')!
    if (params.get('utm_campaign')) promo.campaign = params.get('utm_campaign')!
    if (params.get('plan')) promo.plan = params.get('plan')!
  }
  
  storePromo(promo)
  return getStoredPromo()
}

// ============================================================================
// Cookie Helpers (client-side)
// ============================================================================

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return
  
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const cookies = document.cookie.split(';')
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=')
    if (cookieName === name) {
      return decodeURIComponent(cookieValue)
    }
  }
  return null
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

// ============================================================================
// Server-side helpers (for API routes)
// ============================================================================

/**
 * Parse promo from request cookies (for API routes)
 */
export function getPromoFromCookies(cookieHeader: string | null): StoredPromo | null {
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === PROMO_COOKIE_NAME && value) {
      try {
        const promo = JSON.parse(decodeURIComponent(value)) as StoredPromo
        if (new Date(promo.expiresAt) > new Date()) {
          return promo
        }
      } catch {
        // Invalid JSON
      }
    }
  }
  return null
}
