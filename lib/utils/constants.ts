/**
 * ============================================================================
 * APPLICATION CONSTANTS - Performance & Upload Configuration
 * ============================================================================
 * 
 * This file contains all tunable constants for the 12img platform.
 * Modify these values to adjust performance characteristics.
 * 
 * PERFORMANCE PHILOSOPHY:
 * - Optimize for PERCEIVED speed (show something fast, load rest lazily)
 * - Compress on client before upload (5-10x bandwidth savings)
 * - Use responsive images (never serve full-res for display)
 * - Parallel operations wherever possible
 * 
 * KEY DECISIONS:
 * 1. MAX_FILE_SIZE: 50MB - Photographers use large RAW exports
 * 2. COMPRESSION_QUALITY: 0.85 - Excellent quality, good compression
 * 3. THUMBNAIL: 600px - Crisp on retina, fast to load
 * 4. PREVIEW: 1920px - Full HD for lightbox, not 4K (overkill)
 * 
 * @see lib/storage/signed-urls.ts for URL generation
 * @see lib/upload/image-compressor.ts for client compression
 * ============================================================================
 */

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (photographers use large files)
export const MAX_FILES_PER_UPLOAD = 5000 // Support massive wedding galleries
export const MAX_CONCURRENT_UPLOADS = 16 // Aggressive parallel uploads (adaptive will tune up to 24)
export const SIGNED_URL_BATCH_SIZE = 100 // Larger batches = fewer round trips (was 50)
export const PREFETCH_AHEAD = 200 // Pre-generate many signed URLs ahead (was 30)

// Turbo upload settings
export const TURBO_UPLOAD_CONCURRENCY_MIN = 6
export const TURBO_UPLOAD_CONCURRENCY_MAX = 24
export const TURBO_CONFIRM_BATCH_SIZE = 50

// Large upload thresholds for UI
export const LARGE_UPLOAD_THRESHOLD = 20 // Show large upload overlay after 20 files
export const COFFEE_BREAK_THRESHOLD = 50 // Show coffee break screen after 50 files

// Compression settings (biggest speed win - 5-10x smaller uploads)
export const COMPRESSION_ENABLED_DEFAULT = true
export const COMPRESSION_MAX_DIMENSION = 4096 // Max width/height after compression
export const COMPRESSION_QUALITY = 0.85 // JPEG quality (0.85 = excellent quality, good compression)

export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export const SIGNED_URL_EXPIRY = {
  VIEW: 3600, // 1 hour
  UPLOAD: 300, // 5 minutes
  DOWNLOAD: 3600, // 1 hour
  ARCHIVE_EMAIL: 7 * 24 * 3600, // 7 days for emailed archive links
}

/**
 * IMAGE SIZE PRESETS
 * 
 * These control Supabase Storage image transformations.
 * Never serve ORIGINAL for display - only for downloads.
 * 
 * WHY THESE VALUES:
 * - 600px thumbnail: Crisp on 2x retina (300px CSS), fast to load
 * - 1920px preview: Full HD is enough for lightbox (4K is overkill)
 * - 80-85% quality: Imperceptible loss, significant size reduction
 * 
 * @see lib/storage/signed-urls.ts for usage
 * @see lib/PERFORMANCE.md for full documentation
 */
export const IMAGE_SIZES = {
  // Grid thumbnails - 600px is crisp on retina (300px CSS width)
  THUMBNAIL: {
    width: 600,
    quality: 80,
  },
  // Dashboard cover images - slightly larger for hero cards
  COVER: {
    width: 800,
    quality: 90,
  },
  // Fullscreen preview - 1920px is Full HD, sufficient for any screen
  PREVIEW: {
    width: 1920,
    quality: 85,
  },
  // Profile/Portfolio - highest quality for showcase pages
  PORTFOLIO: {
    width: 2400,
    quality: 92,
  },
  // Download - no transform, serves original file
  // NEVER use this for display, only for actual downloads
  ORIGINAL: null,
} as const

export type ImageSizePreset = keyof typeof IMAGE_SIZES

// Archive configuration
export const ARCHIVE_CONFIG = {
  BUCKET_NAME: 'gallery-archives',
  MAX_RETRY_ATTEMPTS: 3,
  JOB_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes max for ZIP creation
  RETENTION_YEARS: 2, // How long to keep archives
  CHUNK_SIZE: 64 * 1024, // 64KB chunks for streaming
  MAX_CONCURRENT_DOWNLOADS: 5, // Max concurrent image downloads for ZIP
}
