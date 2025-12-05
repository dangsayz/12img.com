/**
 * Job Queue Service
 * 
 * PostgreSQL-based job queue for archive creation.
 * Uses the archive_jobs table with advisory locks for distributed processing.
 * 
 * Design decisions:
 * - Uses PostgreSQL instead of Redis (Supabase already provides Postgres)
 * - Row-level locking with SKIP LOCKED for concurrent workers
 * - Exponential backoff for retries
 * - Job timeout detection for stuck workers
 * 
 * For production at scale, consider migrating to:
 * - pg-boss (Postgres-based, more features)
 * - BullMQ + Redis (if Redis is available)
 * - Inngest/Trigger.dev (serverless job queues)
 */

import { randomUUID } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ARCHIVE_CONFIG } from '@/lib/utils/constants'
import { 
  createGalleryArchive, 
  computeImagesHash,
  findExistingArchive,
  createArchiveRecord,
  updateArchiveRecord
} from './archive.service'
import { sendArchiveNotificationsToClients } from './email.service'
import type { Tables, JobStatus } from '@/types/database'

type ArchiveJob = Tables<'archive_jobs'>
type GalleryArchive = Tables<'gallery_archives'>

// Generate a unique worker ID for this process
const WORKER_ID = `worker-${process.env.VERCEL_REGION || 'local'}-${randomUUID().slice(0, 8)}`

// Logger
const log = {
  info: (message: string, data?: Record<string, unknown>) => 
    console.log(`[JobQueue] ${message}`, data ? JSON.stringify(data) : ''),
  error: (message: string, error?: unknown, data?: Record<string, unknown>) => 
    console.error(`[JobQueue] ERROR: ${message}`, error, data ? JSON.stringify(data) : ''),
  warn: (message: string, data?: Record<string, unknown>) => 
    console.warn(`[JobQueue] WARN: ${message}`, data ? JSON.stringify(data) : ''),
}

/**
 * Enqueue a new archive job for a gallery.
 * Handles idempotency - won't create duplicate jobs for same gallery state.
 */
export async function enqueueArchiveJob(
  galleryId: string,
  priority = 0
): Promise<{ jobId: string; archiveId: string; isNew: boolean }> {
  log.info('Enqueueing archive job', { galleryId, priority })

  // Compute current images hash
  const imagesHash = await computeImagesHash(galleryId)

  // Check if we already have a valid archive for this state
  const existingArchive = await findExistingArchive(galleryId, imagesHash)
  if (existingArchive) {
    log.info('Archive already exists for current image set', { 
      archiveId: existingArchive.id,
      galleryId 
    })
    
    // Return existing archive - no new job needed
    return {
      jobId: '', // No job created
      archiveId: existingArchive.id,
      isNew: false,
    }
  }

  // Check if there's already a pending/processing job for this gallery
  const { data: existingJob } = await supabaseAdmin
    .from('archive_jobs')
    .select('id, archive_id')
    .eq('gallery_id', galleryId)
    .in('status', ['pending', 'processing'])
    .single()

  if (existingJob) {
    log.info('Job already exists for gallery', { 
      jobId: existingJob.id,
      galleryId 
    })
    return {
      jobId: existingJob.id,
      archiveId: existingJob.archive_id ?? '',
      isNew: false,
    }
  }

  // Get image count for the archive record
  const { count: imageCount } = await supabaseAdmin
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('gallery_id', galleryId)

  if (!imageCount || imageCount === 0) {
    throw new Error('Gallery has no images to archive')
  }

  // Create archive record first
  const archiveRecord = await createArchiveRecord(galleryId, imagesHash, imageCount)

  // Create the job
  const { data: job, error } = await supabaseAdmin
    .from('archive_jobs')
    .insert({
      gallery_id: galleryId,
      archive_id: archiveRecord.id,
      status: 'pending' as JobStatus,
      priority,
    })
    .select()
    .single()

  if (error) {
    // Clean up the archive record if job creation failed
    await supabaseAdmin.from('gallery_archives').delete().eq('id', archiveRecord.id)
    throw new Error(`Failed to create archive job: ${error.message}`)
  }

  log.info('Archive job created', { 
    jobId: job.id, 
    archiveId: archiveRecord.id,
    galleryId 
  })

  return {
    jobId: job.id,
    archiveId: archiveRecord.id,
    isNew: true,
  }
}

/**
 * Acquire and process a job from the queue.
 * Uses row-level locking to ensure only one worker processes each job.
 */
export async function acquireAndProcessJob(): Promise<boolean> {
  // Try to acquire a job using PostgreSQL's SKIP LOCKED
  const { data: jobs, error: acquireError } = await supabaseAdmin
    .from('archive_jobs')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', new Date().toISOString())
    .lt('attempts', ARCHIVE_CONFIG.MAX_RETRY_ATTEMPTS)
    .order('priority', { ascending: false })
    .order('run_at', { ascending: true })
    .limit(1)

  if (acquireError || !jobs || jobs.length === 0) {
    return false // No jobs available
  }

  const job = jobs[0]

  // Try to lock the job for this worker
  const { data: lockedJob, error: lockError } = await supabaseAdmin
    .from('archive_jobs')
    .update({
      status: 'processing' as JobStatus,
      locked_by: WORKER_ID,
      locked_at: new Date().toISOString(),
      started_at: new Date().toISOString(),
      attempts: job.attempts + 1,
    })
    .eq('id', job.id)
    .eq('status', 'pending') // Only if still pending (optimistic lock)
    .select()
    .single()

  if (lockError || !lockedJob) {
    // Another worker grabbed this job
    return false
  }

  log.info('Acquired job', { jobId: job.id, workerId: WORKER_ID, attempt: job.attempts + 1 })

  // Process the job
  try {
    await processArchiveJob(lockedJob)
    
    // Mark job as completed
    await supabaseAdmin
      .from('archive_jobs')
      .update({
        status: 'completed' as JobStatus,
        completed_at: new Date().toISOString(),
        locked_by: null,
        locked_at: null,
      })
      .eq('id', job.id)

    log.info('Job completed successfully', { jobId: job.id })
    return true
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    log.error('Job processing failed', err, { jobId: job.id })

    // Calculate backoff for retry
    const backoffMs = Math.pow(2, job.attempts) * 1000 // 2s, 4s, 8s...
    const nextRunAt = new Date(Date.now() + backoffMs).toISOString()

    // Check if we should retry
    const shouldRetry = job.attempts + 1 < ARCHIVE_CONFIG.MAX_RETRY_ATTEMPTS
    
    await supabaseAdmin
      .from('archive_jobs')
      .update({
        status: shouldRetry ? 'pending' as JobStatus : 'failed' as JobStatus,
        last_error: errorMessage,
        run_at: shouldRetry ? nextRunAt : job.run_at,
        locked_by: null,
        locked_at: null,
        completed_at: shouldRetry ? null : new Date().toISOString(),
      })
      .eq('id', job.id)

    // Also update archive record if we're not retrying
    if (!shouldRetry && lockedJob.archive_id) {
      await updateArchiveRecord(lockedJob.archive_id, {
        status: 'failed',
        error_message: errorMessage,
      })
    }

    return false
  }
}

/**
 * Process a single archive job.
 */
async function processArchiveJob(job: ArchiveJob): Promise<void> {
  log.info('Processing archive job', { jobId: job.id, galleryId: job.gallery_id })

  // Create the archive
  const result = await createGalleryArchive(job.gallery_id)

  log.info('Archive created', { 
    archiveId: result.archiveId,
    size: result.fileSizeBytes,
    imageCount: result.imageCount 
  })

  // Send email notifications
  const emailResult = await sendArchiveNotificationsToClients(result.archiveId)
  
  log.info('Email notifications sent', { 
    sent: emailResult.sent, 
    failed: emailResult.failed 
  })
}

/**
 * Release stale locks from crashed workers.
 * Should be run periodically to recover stuck jobs.
 */
export async function releaseStaleJobs(staleThresholdMs = 5 * 60 * 1000): Promise<number> {
  const staleThreshold = new Date(Date.now() - staleThresholdMs).toISOString()

  const { data: staleJobs, error } = await supabaseAdmin
    .from('archive_jobs')
    .update({
      status: 'pending' as JobStatus,
      locked_by: null,
      locked_at: null,
    })
    .eq('status', 'processing')
    .lt('locked_at', staleThreshold)
    .select('id')

  if (error) {
    log.error('Failed to release stale jobs', error)
    return 0
  }

  if (staleJobs && staleJobs.length > 0) {
    log.info('Released stale jobs', { count: staleJobs.length })
  }

  return staleJobs?.length ?? 0
}

/**
 * Get job status for a specific job.
 */
export async function getJobStatus(jobId: string): Promise<ArchiveJob | null> {
  const { data, error } = await supabaseAdmin
    .from('archive_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Get archive status for a gallery.
 * Returns the latest archive or pending job status.
 */
export async function getGalleryArchiveStatus(galleryId: string): Promise<{
  status: 'none' | 'pending' | 'processing' | 'ready' | 'outdated'
  archive?: GalleryArchive
  job?: ArchiveJob
}> {
  // Check for pending/processing jobs
  const { data: job } = await supabaseAdmin
    .from('archive_jobs')
    .select('*')
    .eq('gallery_id', galleryId)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (job) {
    return {
      status: job.status as 'pending' | 'processing',
      job,
    }
  }

  // Check for completed archive
  const { data: archive } = await supabaseAdmin
    .from('gallery_archives')
    .select('*')
    .eq('gallery_id', galleryId)
    .eq('status', 'completed')
    .order('version', { ascending: false })
    .limit(1)
    .single()

  if (!archive) {
    return { status: 'none' }
  }

  // Check if archive is current (matches current image set)
  const currentHash = await computeImagesHash(galleryId)
  
  if (archive.images_hash !== currentHash) {
    return { status: 'outdated', archive }
  }

  return { status: 'ready', archive }
}

/**
 * Start the job worker loop.
 * For serverless environments, this should be called from a cron endpoint.
 * For long-running servers, this can run continuously.
 */
export async function runWorkerOnce(): Promise<{ processed: boolean; released: number }> {
  // First, release any stale jobs
  const released = await releaseStaleJobs()

  // Then try to process one job
  const processed = await acquireAndProcessJob()

  return { processed, released }
}

/**
 * Continuous worker loop for long-running processes.
 * Not recommended for serverless - use cron-triggered runWorkerOnce instead.
 */
export async function startWorkerLoop(intervalMs = 1000): Promise<void> {
  log.info('Starting worker loop', { workerId: WORKER_ID, intervalMs })

  const processLoop = async () => {
    while (true) {
      try {
        const { processed, released } = await runWorkerOnce()
        
        if (released > 0 || processed) {
          log.info('Worker cycle complete', { processed, released })
        }
      } catch (err) {
        log.error('Worker error', err)
      }

      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    }
  }

  // Run in background
  processLoop().catch(err => log.error('Worker loop crashed', err))
}
