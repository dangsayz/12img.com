/**
 * Derivative Processing Constants
 * 
 * Defines the derivative sizes and processing configuration
 * for pre-generated image derivatives.
 */

import type { DerivativeSizeCode } from '@/types/database'

export interface DerivativeSpec {
  code: DerivativeSizeCode
  width: number
  quality: number
  description: string
}

/**
 * Derivative size specifications
 * 
 * xs: 200px - Mobile grid thumbnails
 * sm: 400px - Desktop grid thumbnails  
 * md: 800px - Lightbox initial (mobile)
 * lg: 1600px - Lightbox default (desktop)
 * xl: 2400px - Web high-res download
 */
export const DERIVATIVE_SPECS: DerivativeSpec[] = [
  { code: 'xs', width: 200, quality: 70, description: 'Mobile thumbnail' },
  { code: 'sm', width: 400, quality: 75, description: 'Desktop thumbnail' },
  { code: 'md', width: 800, quality: 80, description: 'Mobile lightbox' },
  { code: 'lg', width: 1600, quality: 85, description: 'Desktop lightbox' },
  { code: 'xl', width: 2400, quality: 90, description: 'High-res web' },
]

/**
 * Map size code to spec for quick lookup
 */
export const DERIVATIVE_SPEC_MAP: Record<DerivativeSizeCode, DerivativeSpec> = {
  xs: DERIVATIVE_SPECS[0],
  sm: DERIVATIVE_SPECS[1],
  md: DERIVATIVE_SPECS[2],
  lg: DERIVATIVE_SPECS[3],
  xl: DERIVATIVE_SPECS[4],
}

/**
 * Processing configuration
 */
export const PROCESSING_CONFIG = {
  // Max concurrent derivative generations per image
  MAX_CONCURRENT_DERIVATIVES: 3,
  
  // Timeout for processing a single image (ms)
  PROCESSING_TIMEOUT_MS: 60000,
  
  // Max retries for failed processing
  MAX_RETRIES: 3,
  
  // Delay between retries (ms)
  RETRY_DELAY_MS: 5000,
  
  // Storage path pattern for derivatives
  // {galleryId}/{photoId}/{sizeCode}.jpg
  DERIVATIVE_PATH_PATTERN: (galleryId: string, photoId: string, sizeCode: DerivativeSizeCode) =>
    `${galleryId}/${photoId}/${sizeCode}.jpg`,
  
  // Storage path for watermarked derivatives
  WATERMARKED_PATH_PATTERN: (galleryId: string, photoId: string, sizeCode: DerivativeSizeCode) =>
    `${galleryId}/${photoId}/watermarked/${sizeCode}.jpg`,
}

/**
 * Get the storage path for a derivative
 */
export function getDerivativePath(
  galleryId: string,
  photoId: string,
  sizeCode: DerivativeSizeCode,
  isWatermarked = false
): string {
  if (isWatermarked) {
    return PROCESSING_CONFIG.WATERMARKED_PATH_PATTERN(galleryId, photoId, sizeCode)
  }
  return PROCESSING_CONFIG.DERIVATIVE_PATH_PATTERN(galleryId, photoId, sizeCode)
}
