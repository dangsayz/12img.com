export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
export const MAX_FILES_PER_UPLOAD = 100
export const MAX_CONCURRENT_UPLOADS = 3

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

// Archive configuration
export const ARCHIVE_CONFIG = {
  BUCKET_NAME: 'gallery-archives',
  MAX_RETRY_ATTEMPTS: 3,
  JOB_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes max for ZIP creation
  RETENTION_YEARS: 2, // How long to keep archives
  CHUNK_SIZE: 64 * 1024, // 64KB chunks for streaming
  MAX_CONCURRENT_DOWNLOADS: 5, // Max concurrent image downloads for ZIP
}
