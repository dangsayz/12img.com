/**
 * Client Vault Pricing Configuration
 * 
 * Storage add-on for photographer's clients to keep their photos
 * after gallery expiry.
 */

export type VaultPlanId = 'vault' | 'vault_plus'

export interface VaultPlan {
  id: VaultPlanId
  name: string
  description: string
  storageGB: number
  monthlyPrice: number      // in dollars
  annualPrice: number       // in dollars
  annualMonthly: number     // annual price / 12 for display
  features: string[]
  popular?: boolean
}

export const VAULT_PLANS: Record<VaultPlanId, VaultPlan> = {
  vault: {
    id: 'vault',
    name: 'Vault',
    description: 'Perfect for a single event',
    storageGB: 50,
    monthlyPrice: 4,
    annualPrice: 39,
    annualMonthly: 3.25,
    features: [
      '50GB storage',
      'Up to ~500 high-res photos',
      'Access anytime',
      'Download your photos',
      'Secure & private',
    ],
  },
  vault_plus: {
    id: 'vault_plus',
    name: 'Vault+',
    description: 'Multiple events or large galleries',
    storageGB: 200,
    monthlyPrice: 8,
    annualPrice: 79,
    annualMonthly: 6.58,
    features: [
      '200GB storage',
      'Up to ~2,000 high-res photos',
      'Access anytime',
      'Download your photos',
      'Secure & private',
      'Multiple galleries',
    ],
    popular: true,
  },
}

export const VAULT_PLAN_ORDER: VaultPlanId[] = ['vault', 'vault_plus']

/**
 * Get storage limit in bytes for a vault plan
 */
export function getVaultStorageLimitBytes(planId: VaultPlanId): number {
  const plan = VAULT_PLANS[planId]
  return plan.storageGB * 1024 * 1024 * 1024
}

/**
 * Format vault price for display
 */
export function formatVaultPrice(planId: VaultPlanId, period: 'monthly' | 'annual'): string {
  const plan = VAULT_PLANS[planId]
  if (period === 'monthly') {
    return `$${plan.monthlyPrice}/mo`
  }
  return `$${plan.annualPrice}/yr`
}

/**
 * Get vault plan by ID
 */
export function getVaultPlan(planId: VaultPlanId): VaultPlan | undefined {
  return VAULT_PLANS[planId]
}

/**
 * Calculate approximate photo count for a storage amount
 * Assumes average 2.5MB per high-res photo
 */
export function estimatePhotoCount(storageGB: number): number {
  const avgPhotoSizeMB = 2.5
  return Math.floor((storageGB * 1024) / avgPhotoSizeMB)
}
