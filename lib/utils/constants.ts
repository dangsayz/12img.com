export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB (photographers use large files)
export const MAX_FILES_PER_UPLOAD = 5000 // Support massive wedding galleries
export const MAX_CONCURRENT_UPLOADS = 12 // Aggressive parallel uploads (adaptive will tune)
export const SIGNED_URL_BATCH_SIZE = 50 // Smaller batches = faster first response
export const PREFETCH_AHEAD = 30 // Pre-generate this many signed URLs ahead

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

// Image size presets for responsive loading
// Thumbnails load fast, downloads remain full resolution
export const IMAGE_SIZES = {
  // Grid thumbnails - crisp for retina displays
  THUMBNAIL: {
    width: 600,
    quality: 80,
  },
  // Dashboard cover images - crisp, fewer images so higher quality OK
  COVER: {
    width: 800,
    quality: 90,
  },
  // Fullscreen preview - high quality but optimized
  PREVIEW: {
    width: 1920,
    quality: 85,
  },
  // Profile/Portfolio - highest quality for showcase pages
  PORTFOLIO: {
    width: 2400,
    quality: 92,
  },
  // Download - no transform, original file
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
