/**
 * Upload Module
 * 
 * World-class upload system with:
 * - Client-side image compression (5-10x faster uploads)
 * - Adaptive concurrency control
 * - Preflight URL generation
 * - Smart retry with exponential backoff
 */

export { compressImage, compressImages, getImageDimensions } from './image-compressor'
export type { CompressionOptions, CompressionResult } from './image-compressor'

export { AdaptiveConcurrencyController, getAdaptiveConcurrencyController } from './adaptive-concurrency'
export type { ConcurrencyMetrics } from './adaptive-concurrency'

export { PreflightOptimizer } from './preflight-optimizer'

export { UploadEngine } from './upload-engine'
export type { UploadFile, UploadEngineOptions, UploadStats } from './upload-engine'
