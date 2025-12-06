/**
 * Plan Limit Enforcement
 * 
 * Checks user's plan limits against their current usage.
 * Used before uploads, gallery creation, etc.
 */

import { PlanId, getStorageLimitBytes, getImageLimit, getGalleryLimit, PLAN_LIMITS } from '@/lib/config/pricing'

interface UserUsage {
  storageUsed: number      // bytes
  imageCount: number
  galleryCount: number
}

interface LimitCheckResult {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number | 'unlimited'
}

/**
 * Check if user can upload an image based on their plan limits
 */
export function canUploadImage(
  planId: PlanId,
  usage: UserUsage,
  newFileSize: number = 0
): LimitCheckResult {
  // Check image count limit
  const imageLimit = getImageLimit(planId)
  if (imageLimit !== Infinity && usage.imageCount >= imageLimit) {
    return {
      allowed: false,
      reason: 'Image limit reached',
      current: usage.imageCount,
      limit: imageLimit,
    }
  }

  // Check storage limit
  const storageLimit = getStorageLimitBytes(planId)
  if (storageLimit !== Infinity && (usage.storageUsed + newFileSize) > storageLimit) {
    return {
      allowed: false,
      reason: 'Storage limit reached',
      current: usage.storageUsed,
      limit: storageLimit,
    }
  }

  return { allowed: true }
}

/**
 * Check if user can create a new gallery
 */
export function canCreateGallery(
  planId: PlanId,
  usage: UserUsage
): LimitCheckResult {
  const galleryLimit = getGalleryLimit(planId)
  
  if (galleryLimit !== Infinity && usage.galleryCount >= galleryLimit) {
    return {
      allowed: false,
      reason: 'Gallery limit reached',
      current: usage.galleryCount,
      limit: galleryLimit,
    }
  }

  return { allowed: true }
}

/**
 * Check if user has storage available for a specific file size
 */
export function hasStorageAvailable(
  planId: PlanId,
  usage: UserUsage,
  requiredBytes: number
): LimitCheckResult {
  const storageLimit = getStorageLimitBytes(planId)
  
  if (storageLimit === Infinity) {
    return { allowed: true }
  }

  const availableBytes = storageLimit - usage.storageUsed
  
  if (requiredBytes > availableBytes) {
    return {
      allowed: false,
      reason: 'Insufficient storage',
      current: usage.storageUsed,
      limit: storageLimit,
    }
  }

  return { allowed: true }
}

/**
 * Get remaining limits for a user
 */
export function getRemainingLimits(planId: PlanId, usage: UserUsage) {
  const limits = PLAN_LIMITS[planId]
  
  const storageLimit = getStorageLimitBytes(planId)
  const imageLimit = getImageLimit(planId)
  const galleryLimit = getGalleryLimit(planId)

  return {
    storage: {
      used: usage.storageUsed,
      limit: limits.storage_gb === 'unlimited' ? 'unlimited' : storageLimit,
      remaining: storageLimit === Infinity ? Infinity : Math.max(0, storageLimit - usage.storageUsed),
      percentage: storageLimit === Infinity ? 0 : Math.round((usage.storageUsed / storageLimit) * 100),
    },
    images: {
      used: usage.imageCount,
      limit: limits.image_limit,
      remaining: imageLimit === Infinity ? Infinity : Math.max(0, imageLimit - usage.imageCount),
      percentage: imageLimit === Infinity ? 0 : Math.round((usage.imageCount / imageLimit) * 100),
    },
    galleries: {
      used: usage.galleryCount,
      limit: limits.gallery_limit,
      remaining: galleryLimit === Infinity ? Infinity : Math.max(0, galleryLimit - usage.galleryCount),
      percentage: galleryLimit === Infinity ? 0 : Math.round((usage.galleryCount / galleryLimit) * 100),
    },
  }
}

/**
 * Get expiry days for a plan
 */
export function getExpiryDays(planId: PlanId): number | null {
  const expiry = PLAN_LIMITS[planId]?.expiry_days
  if (expiry === 'unlimited') return null
  return expiry as number
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes === Infinity) return 'Unlimited'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 1 : 0)} ${units[i]}`
}

/**
 * Check all limits at once and return summary
 */
export function checkAllLimits(
  planId: PlanId,
  usage: UserUsage,
  newFileSize: number = 0
): {
  canUpload: boolean
  canCreateGallery: boolean
  hasStorage: boolean
  issues: string[]
} {
  const uploadCheck = canUploadImage(planId, usage, newFileSize)
  const galleryCheck = canCreateGallery(planId, usage)
  const storageCheck = hasStorageAvailable(planId, usage, newFileSize)

  const issues: string[] = []
  if (!uploadCheck.allowed) issues.push(uploadCheck.reason!)
  if (!galleryCheck.allowed) issues.push(galleryCheck.reason!)
  if (!storageCheck.allowed) issues.push(storageCheck.reason!)

  return {
    canUpload: uploadCheck.allowed,
    canCreateGallery: galleryCheck.allowed,
    hasStorage: storageCheck.allowed,
    issues,
  }
}
