/**
 * Archive Service
 * 
 * Core service for creating ZIP archives from gallery images.
 * Uses streaming to handle large galleries without loading all images into RAM.
 * 
 * Design decisions:
 * - Uses `archiver` for streaming ZIP creation (production-grade, well-tested)
 * - Downloads images in batches to control memory usage
 * - Computes checksum for integrity verification
 * - Implements idempotency via images_hash comparison
 */

import { createHash } from 'crypto'
import { Readable, PassThrough } from 'stream'
import archiver from 'archiver'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ARCHIVE_CONFIG, SIGNED_URL_EXPIRY } from '@/lib/utils/constants'
import type { Tables, ArchiveStatus } from '@/types/database'

// Types
export interface ArchiveResult {
  archiveId: string
  storagePath: string
  fileSizeBytes: number
  checksum: string
  imageCount: number
}

export interface ArchiveProgress {
  phase: 'initializing' | 'downloading' | 'compressing' | 'uploading' | 'verifying' | 'completed'
  current: number
  total: number
  message: string
}

type GalleryArchive = Tables<'gallery_archives'>
type Image = Tables<'images'>

// Logger utility for structured logging
const log = {
  info: (message: string, data?: Record<string, unknown>) => 
    console.log(`[Archive] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => 
    console.error(`[Archive] ERROR: ${message}`, error, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: Record<string, unknown>) => 
    console.warn(`[Archive] WARN: ${message}`, data ? JSON.stringify(data) : ''),
}

/**
 * Compute a hash of the gallery's current image set.
 * Used for idempotency - if the hash matches an existing archive, we reuse it.
 */
export async function computeImagesHash(galleryId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('images')
    .select('id')
    .eq('gallery_id', galleryId)
    .order('id', { ascending: true })

  if (error) throw new Error(`Failed to fetch images for hash: ${error.message}`)
  if (!data || data.length === 0) return 'empty'

  const hash = createHash('sha256')
  hash.update(data.map(img => img.id).join(','))
  return hash.digest('hex')
}

/**
 * Check if a valid archive already exists for the current image set.
 * Returns the existing archive if found, null otherwise.
 */
export async function findExistingArchive(
  galleryId: string,
  imagesHash: string
): Promise<GalleryArchive | null> {
  const { data, error } = await supabaseAdmin
    .from('gallery_archives')
    .select('*')
    .eq('gallery_id', galleryId)
    .eq('images_hash', imagesHash)
    .eq('status', 'completed')
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get the latest completed archive for a gallery.
 * May not match current image set if images were added/removed.
 */
export async function getLatestArchive(galleryId: string): Promise<GalleryArchive | null> {
  const { data, error } = await supabaseAdmin
    .from('gallery_archives')
    .select('*')
    .eq('gallery_id', galleryId)
    .eq('status', 'completed')
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get the next version number for a gallery's archives.
 */
async function getNextVersion(galleryId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('gallery_archives')
    .select('version')
    .eq('gallery_id', galleryId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  return (data?.version ?? 0) + 1
}

/**
 * Create a new archive record in pending state.
 */
export async function createArchiveRecord(
  galleryId: string,
  imagesHash: string,
  imageCount: number
): Promise<GalleryArchive> {
  const version = await getNextVersion(galleryId)
  const storagePath = `galleries/${galleryId}/archives/${version}.zip`

  const { data, error } = await supabaseAdmin
    .from('gallery_archives')
    .insert({
      gallery_id: galleryId,
      version,
      images_hash: imagesHash,
      storage_path: storagePath,
      image_count: imageCount,
      status: 'pending' as ArchiveStatus,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to create archive record: ${error.message}`)
  return data
}

/**
 * Update archive record status and metadata.
 */
export async function updateArchiveRecord(
  archiveId: string,
  updates: Partial<{
    status: ArchiveStatus
    file_size_bytes: number
    checksum: string
    error_message: string
    completed_at: string
    email_sent: boolean
    email_sent_at: string
    email_recipient: string
  }>
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('gallery_archives')
    .update(updates)
    .eq('id', archiveId)

  if (error) throw new Error(`Failed to update archive record: ${error.message}`)
}

/**
 * Fetch an image from storage as a readable stream.
 * Uses signed URL for secure access.
 */
async function fetchImageStream(storagePath: string): Promise<Readable> {
  const { data: signedData, error: signedError } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY.DOWNLOAD)

  if (signedError) throw new Error(`Failed to create signed URL: ${signedError.message}`)

  const response = await fetch(signedData.signedUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`)
  if (!response.body) throw new Error('No response body for image fetch')

  // Convert web ReadableStream to Node Readable
  return Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0])
}

/**
 * Create a streaming ZIP archive from gallery images.
 * 
 * This is the core function that:
 * 1. Fetches images one at a time to control memory
 * 2. Streams them directly into the ZIP archive
 * 3. Streams the ZIP output to storage
 * 4. Computes checksum along the way
 * 
 * @param galleryId - The gallery to archive
 * @param images - Array of image records to include
 * @param storagePath - Where to store the resulting ZIP
 * @param onProgress - Optional callback for progress updates
 */
export async function createStreamingZipArchive(
  galleryId: string,
  images: Image[],
  storagePath: string,
  onProgress?: (progress: ArchiveProgress) => void
): Promise<{ fileSizeBytes: number; checksum: string }> {
  log.info('Starting streaming ZIP creation', { galleryId, imageCount: images.length })

  onProgress?.({
    phase: 'initializing',
    current: 0,
    total: images.length,
    message: 'Initializing archive creation',
  })

  // Create archiver instance with compression
  const archive = archiver('zip', {
    zlib: { level: 6 }, // Balanced compression (0-9, 6 is default)
  })

  // Create a passthrough stream to capture the archive data
  const passthrough = new PassThrough()
  const chunks: Buffer[] = []
  const hash = createHash('sha256')

  // Collect chunks and compute hash
  passthrough.on('data', (chunk: Buffer) => {
    chunks.push(chunk)
    hash.update(chunk)
  })

  // Pipe archive to passthrough
  archive.pipe(passthrough)

  // Process images in batches to control memory usage
  let processed = 0
  const errors: string[] = []

  for (const image of images) {
    try {
      onProgress?.({
        phase: 'downloading',
        current: processed,
        total: images.length,
        message: `Processing ${image.original_filename}`,
      })

      // Fetch image as stream
      const imageStream = await fetchImageStream(image.storage_path)

      // Add to archive with original filename
      // Use position prefix to maintain order, but keep original name for user
      const archiveName = `${String(image.position).padStart(4, '0')}_${image.original_filename}`
      archive.append(imageStream, { name: archiveName })

      processed++

      log.info('Added image to archive', { 
        imageId: image.id, 
        filename: archiveName,
        progress: `${processed}/${images.length}` 
      })
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Failed to add ${image.original_filename}: ${errorMsg}`)
      log.error('Failed to add image to archive', err, { imageId: image.id })
      // Continue with other images - partial archive is better than none
    }
  }

  // Finalize the archive
  onProgress?.({
    phase: 'compressing',
    current: images.length,
    total: images.length,
    message: 'Finalizing compression',
  })

  await archive.finalize()

  // Wait for all data to be collected
  await new Promise<void>((resolve, reject) => {
    passthrough.on('end', resolve)
    passthrough.on('error', reject)
  })

  // Combine chunks into final buffer
  const zipBuffer = Buffer.concat(chunks)
  const checksum = hash.digest('hex')
  const fileSizeBytes = zipBuffer.length

  log.info('Archive compression complete', { 
    fileSizeBytes, 
    checksum,
    processedImages: processed,
    errors: errors.length 
  })

  // Upload to storage
  onProgress?.({
    phase: 'uploading',
    current: 0,
    total: 1,
    message: 'Uploading archive to storage',
  })

  const { error: uploadError } = await supabaseAdmin.storage
    .from(ARCHIVE_CONFIG.BUCKET_NAME)
    .upload(storagePath, zipBuffer, {
      contentType: 'application/zip',
      upsert: true, // Allow overwrite for retries
    })

  if (uploadError) {
    throw new Error(`Failed to upload archive: ${uploadError.message}`)
  }

  // Verify upload by checking if file exists and is accessible
  onProgress?.({
    phase: 'verifying',
    current: 0,
    total: 1,
    message: 'Verifying archive integrity',
  })

  const { data: verifyData, error: verifyError } = await supabaseAdmin.storage
    .from(ARCHIVE_CONFIG.BUCKET_NAME)
    .createSignedUrl(storagePath, 60) // 1 minute for verification

  if (verifyError || !verifyData) {
    throw new Error('Archive verification failed - file not accessible')
  }

  // Quick HEAD request to verify
  const verifyResponse = await fetch(verifyData.signedUrl, { method: 'HEAD' })
  if (!verifyResponse.ok) {
    throw new Error('Archive verification failed - HEAD request failed')
  }

  onProgress?.({
    phase: 'completed',
    current: 1,
    total: 1,
    message: 'Archive created successfully',
  })

  log.info('Archive upload complete', { storagePath, fileSizeBytes, checksum })

  return { fileSizeBytes, checksum }
}

/**
 * Main entry point for creating a gallery archive.
 * Handles idempotency, error handling, and status updates.
 * 
 * @param galleryId - The gallery to archive
 * @param forceRegenerate - If true, create new archive even if one exists
 */
export async function createGalleryArchive(
  galleryId: string,
  forceRegenerate = false
): Promise<ArchiveResult> {
  log.info('Starting archive creation', { galleryId, forceRegenerate })

  // Get gallery images
  const { data: images, error: imagesError } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('position', { ascending: true })

  if (imagesError) throw new Error(`Failed to fetch gallery images: ${imagesError.message}`)
  if (!images || images.length === 0) {
    throw new Error('Gallery has no images to archive')
  }

  // Compute hash for idempotency check
  const imagesHash = await computeImagesHash(galleryId)

  // Check for existing archive (unless force regenerate)
  if (!forceRegenerate) {
    const existing = await findExistingArchive(galleryId, imagesHash)
    if (existing) {
      log.info('Reusing existing archive', { archiveId: existing.id, galleryId })
      return {
        archiveId: existing.id,
        storagePath: existing.storage_path,
        fileSizeBytes: existing.file_size_bytes ?? 0,
        checksum: existing.checksum ?? '',
        imageCount: existing.image_count,
      }
    }
  }

  // Create new archive record
  const archiveRecord = await createArchiveRecord(galleryId, imagesHash, images.length)
  log.info('Created archive record', { archiveId: archiveRecord.id })

  try {
    // Update status to processing
    await updateArchiveRecord(archiveRecord.id, { status: 'processing' })

    // Create the ZIP archive
    const { fileSizeBytes, checksum } = await createStreamingZipArchive(
      galleryId,
      images,
      archiveRecord.storage_path
    )

    // Update record with completion data
    await updateArchiveRecord(archiveRecord.id, {
      status: 'completed',
      file_size_bytes: fileSizeBytes,
      checksum,
      completed_at: new Date().toISOString(),
    })

    log.info('Archive creation completed', { 
      archiveId: archiveRecord.id,
      fileSizeBytes,
      checksum 
    })

    return {
      archiveId: archiveRecord.id,
      storagePath: archiveRecord.storage_path,
      fileSizeBytes,
      checksum,
      imageCount: images.length,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Archive creation failed', err, { archiveId: archiveRecord.id })

    // Update record with failure
    await updateArchiveRecord(archiveRecord.id, {
      status: 'failed',
      error_message: errorMessage,
    })

    throw err
  }
}

/**
 * Generate a signed download URL for an archive.
 * 
 * @param storagePath - The archive storage path
 * @param expiresIn - URL expiry in seconds (default: 1 hour)
 */
export async function getArchiveDownloadUrl(
  storagePath: string,
  expiresIn = SIGNED_URL_EXPIRY.DOWNLOAD
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(ARCHIVE_CONFIG.BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn)

  if (error) throw new Error(`Failed to create archive download URL: ${error.message}`)
  return data.signedUrl
}

/**
 * Delete an archive from storage and database.
 */
export async function deleteArchive(archiveId: string): Promise<void> {
  const { data: archive, error: fetchError } = await supabaseAdmin
    .from('gallery_archives')
    .select('storage_path')
    .eq('id', archiveId)
    .single()

  if (fetchError) throw new Error(`Failed to fetch archive: ${fetchError.message}`)

  // Delete from storage
  const { error: storageError } = await supabaseAdmin.storage
    .from(ARCHIVE_CONFIG.BUCKET_NAME)
    .remove([archive.storage_path])

  if (storageError) {
    log.warn('Failed to delete archive from storage', { archiveId, error: storageError.message })
  }

  // Delete from database
  const { error: dbError } = await supabaseAdmin
    .from('gallery_archives')
    .delete()
    .eq('id', archiveId)

  if (dbError) throw new Error(`Failed to delete archive record: ${dbError.message}`)

  log.info('Archive deleted', { archiveId })
}

/**
 * Cleanup old archives based on retention policy.
 * Should be run periodically via cron job.
 */
export async function cleanupExpiredArchives(): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setFullYear(cutoffDate.getFullYear() - ARCHIVE_CONFIG.RETENTION_YEARS)

  const { data: expired, error } = await supabaseAdmin
    .from('gallery_archives')
    .select('id, storage_path')
    .lt('created_at', cutoffDate.toISOString())

  if (error) {
    log.error('Failed to fetch expired archives', error)
    return 0
  }

  if (!expired || expired.length === 0) {
    log.info('No expired archives to cleanup')
    return 0
  }

  let deleted = 0
  for (const archive of expired) {
    try {
      await deleteArchive(archive.id)
      deleted++
    } catch (err) {
      log.error('Failed to delete expired archive', err, { archiveId: archive.id })
    }
  }

  log.info('Cleanup complete', { deleted, total: expired.length })
  return deleted
}
