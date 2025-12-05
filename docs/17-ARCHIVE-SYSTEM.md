# 17. Archive System (ZIP + Email Backup)

## Overview

The archive system provides automatic ZIP bundling of gallery images with email backup delivery. This is a key differentiator from competitors like Pixieset - clients always have a secure backup of their images, even if the gallery is later modified or deleted.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User uploads images to gallery                                          │
│                    │                                                         │
│                    ▼                                                         │
│  2. User clicks "Publish" / "Finish Upload"                                 │
│                    │                                                         │
│                    ▼                                                         │
│  3. Server Action → enqueueArchiveJob(galleryId)                            │
│                    │                                                         │
│                    ▼                                                         │
│  4. archive_jobs table (PostgreSQL queue)                                   │
│                    │                                                         │
│                    ▼                                                         │
│  5. Cron Worker (every minute) acquires job                                 │
│                    │                                                         │
│                    ▼                                                         │
│  6. createStreamingZipArchive()                                             │
│     ├── Fetch images metadata from DB                                       │
│     ├── Stream each image from Supabase Storage                            │
│     ├── Pipe into archiver (ZIP compression)                               │
│     └── Upload ZIP to gallery-archives bucket                              │
│                    │                                                         │
│                    ▼                                                         │
│  7. Verify ZIP integrity (checksum + HEAD request)                          │
│                    │                                                         │
│                    ▼                                                         │
│  8. Update gallery_archives record (status: completed)                      │
│                    │                                                         │
│                    ▼                                                         │
│  9. sendArchiveNotificationsToClients()                                     │
│     ├── Fetch gallery_clients                                               │
│     ├── Generate signed download URL (7-day expiry)                        │
│     └── Send email via Resend                                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### gallery_archives

Tracks ZIP archives per gallery with versioning.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gallery_id | UUID | FK to galleries |
| version | INTEGER | Archive version (increments per gallery) |
| images_hash | TEXT | SHA256 of image IDs for idempotency |
| storage_path | TEXT | Path in storage bucket |
| file_size_bytes | BIGINT | Final ZIP size |
| checksum | TEXT | SHA256 of ZIP for integrity |
| image_count | INTEGER | Number of images in archive |
| status | ENUM | pending, processing, completed, failed |
| error_message | TEXT | Error details if failed |
| email_sent | BOOLEAN | Whether notification was sent |
| email_sent_at | TIMESTAMPTZ | When email was sent |
| email_recipient | TEXT | Email address notified |
| created_at | TIMESTAMPTZ | Creation time |
| completed_at | TIMESTAMPTZ | When ZIP was finished |
| expires_at | TIMESTAMPTZ | Optional retention expiry |

### gallery_clients

Client contacts for email notifications.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gallery_id | UUID | FK to galleries |
| email | TEXT | Client email |
| name | TEXT | Optional client name |
| notify_on_archive | BOOLEAN | Whether to notify |
| created_at | TIMESTAMPTZ | Creation time |

### archive_jobs

PostgreSQL-based job queue.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| gallery_id | UUID | FK to galleries |
| archive_id | UUID | FK to gallery_archives |
| status | TEXT | pending, processing, completed, failed |
| priority | INTEGER | Job priority (higher = first) |
| attempts | INTEGER | Retry count |
| max_attempts | INTEGER | Max retries (default: 3) |
| last_error | TEXT | Last error message |
| run_at | TIMESTAMPTZ | When to run (for backoff) |
| locked_by | TEXT | Worker ID holding lock |
| locked_at | TIMESTAMPTZ | When lock was acquired |

## API Endpoints

### Download Endpoints

**GET /api/download/[archiveId]**
- Authenticated download for specific archive
- Supports Clerk session or signed token
- Returns redirect to signed URL

**GET /api/gallery/[galleryId]/download**
- Public download endpoint
- Supports password authentication
- Auto-creates archive if needed
- Returns 202 if archive is pending

### Cron Endpoints

**POST /api/cron/process-archives**
- Protected by CRON_SECRET
- Processes pending jobs from queue
- Runs every minute via Vercel Cron

## Server Actions

### createArchive(galleryId)
Enqueues an archive job for a gallery.

### getDownloadAllUrl(galleryId)
Gets download URL, creating archive if needed.

### getArchiveStatus(galleryId)
Returns current archive status (none, pending, processing, ready, outdated).

### addGalleryClient(galleryId, email, name?)
Adds a client to receive archive notifications.

### resendArchiveEmail(galleryId, archiveId, recipientEmail)
Manually resend archive notification.

## Usage Examples

### Frontend Integration

```tsx
import { createArchive, getDownloadAllUrl } from '@/server/actions/archive.actions'

// Trigger archive on publish
async function handlePublish(galleryId: string) {
  const result = await createArchive(galleryId)
  if (result.error) {
    toast.error(result.error)
    return
  }
  toast.success(result.message)
}

// Download button
async function handleDownloadAll(galleryId: string) {
  const result = await getDownloadAllUrl(galleryId)
  if (result.error) {
    toast.error(result.error)
    return
  }
  if (result.pending) {
    toast.info(result.message)
    return
  }
  if (result.downloadUrl) {
    window.location.href = result.downloadUrl
  }
}
```

### Adding Client for Notifications

```tsx
import { addGalleryClient } from '@/server/actions/archive.actions'

async function handleAddClient(galleryId: string, email: string) {
  const result = await addGalleryClient(galleryId, email, 'Client Name')
  if (result.success) {
    toast.success('Client added')
  }
}
```

## Idempotency

The system ensures idempotency through:

1. **Images Hash**: SHA256 of sorted image IDs
2. **Unique Index**: Only one completed archive per (gallery_id, images_hash)
3. **Job Deduplication**: Checks for existing pending/processing jobs

If the same set of images has already been archived, the existing archive is reused.

## Error Handling

### Job Retries
- Jobs retry up to 3 times with exponential backoff (2s, 4s, 8s)
- Stale locks (5+ minutes) are automatically released

### Archive Failures
- Failed archives are marked in DB with error message
- Can be regenerated via `regenerateArchive(galleryId)`

### Email Failures
- Email failures logged but don't fail the archive
- Can be retried via `resendArchiveEmail()`

## Configuration

### Environment Variables

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=12img <noreply@yourdomain.com>

# Cron authentication
CRON_SECRET=your-random-secret

# Existing
GALLERY_TOKEN_SECRET=your-token-secret
```

### Constants (lib/utils/constants.ts)

```typescript
export const ARCHIVE_CONFIG = {
  BUCKET_NAME: 'gallery-archives',
  MAX_RETRY_ATTEMPTS: 3,
  JOB_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  RETENTION_YEARS: 2,
  CHUNK_SIZE: 64 * 1024, // 64KB
  MAX_CONCURRENT_DOWNLOADS: 5,
}

export const SIGNED_URL_EXPIRY = {
  ARCHIVE_EMAIL: 7 * 24 * 3600, // 7 days
}
```

## Storage Structure

```
gallery-archives/
└── galleries/
    └── {galleryId}/
        └── archives/
            ├── 1.zip
            ├── 2.zip
            └── 3.zip
```

## Email Template

The email includes:
- Gallery title
- Image count
- Archive size
- Download button with 7-day expiry link
- Expiry warning
- Photographer info

## Performance Considerations

### Memory Efficiency
- Uses streaming ZIP creation (archiver)
- Images are streamed directly from storage to ZIP
- No full images held in RAM

### Large Galleries
- Galleries with 20+ images are processed async
- Job queue prevents server timeouts
- Progress tracking via archive status

### Scalability
- PostgreSQL-based queue scales with connection pool
- Workers can run on multiple instances (via SKIP LOCKED)
- Consider pg-boss or Redis for very high volumes

## Security

### Authentication
- Archive downloads require owner session OR signed token
- Tokens include timestamp + HMAC signature
- Password-protected galleries require password for download

### Signed URLs
- All storage access via time-limited signed URLs
- Email links expire after 7 days
- Can regenerate links without re-compressing

## Monitoring

Log all operations:
```
[Archive] Starting archive creation { galleryId, imageCount }
[Archive] Added image to archive { imageId, progress }
[Archive] Archive compression complete { fileSizeBytes, checksum }
[Archive] Archive upload complete { storagePath }
[Email] Sending archive notification { archiveId, recipient }
[JobQueue] Acquired job { jobId, workerId, attempt }
[JobQueue] Job completed successfully { jobId }
```

## Migration Steps

1. Run database migration: `002-gallery-archives.sql`
2. Create storage bucket in Supabase Dashboard
3. Apply storage policies: `003-archive-storage-bucket.sql`
4. Add environment variables
5. Install dependencies: `pnpm install`
6. Deploy with Vercel Cron enabled

## Future Improvements

- [ ] Webhook notifications (in addition to email)
- [ ] Archive download analytics
- [ ] Selective image inclusion in archive
- [ ] Multiple archive formats (ZIP, TAR)
- [ ] CDN caching for popular archives
- [ ] S3 lifecycle rules for cost optimization
