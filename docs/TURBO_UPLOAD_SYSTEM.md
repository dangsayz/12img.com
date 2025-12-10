# World-Class Upload & Download System

## Overview

12img now has the most advanced file transfer system possible in a web browser. This document explains every cutting-edge technique used.

**Performance Targets:**
- 600 images upload: < 5 minutes
- 600 images download (ZIP): < 2 minutes
- Resume interrupted uploads: Yes
- Background uploads: Yes (Service Worker)

## Key Optimizations

### 1. Web Worker Parallel Compression (BIGGEST WIN)

**File:** `lib/upload/compression-worker.ts`

Instead of compressing images one-by-one on the main thread (blocking UI), we use a pool of Web Workers to compress 4-8 images simultaneously across CPU cores.

```typescript
// Old way (sequential, blocks UI):
for (const file of files) {
  await compressImage(file) // 500ms each = 5 minutes for 600 files
}

// New way (parallel, non-blocking):
const workerPool = getCompressionWorkerPool() // 4-8 workers
await Promise.all(files.map(f => workerPool.compress(f))) // All at once!
```

**Benefits:**
- 4-8x faster compression
- UI stays responsive
- Uses all CPU cores

### 2. Pipeline Parallelism

**File:** `lib/upload/turbo-upload-engine.ts`

We run compression and upload pipelines concurrently:

```
Time →
Batch 1: [COMPRESS] → [UPLOAD] → [CONFIRM]
Batch 2:            [COMPRESS] → [UPLOAD] → [CONFIRM]
Batch 3:                       [COMPRESS] → [UPLOAD] → [CONFIRM]
```

While batch 1 is uploading, batch 2 is compressing. Zero idle time.

### 3. Aggressive URL Preflight

**Constants:**
- `PREFETCH_AHEAD = 200` (was 30)
- `SIGNED_URL_BATCH_SIZE = 100` (was 50)

We pre-generate signed URLs for 200 files at once, so uploads never wait for URL generation.

### 4. Adaptive Concurrency

**File:** `lib/upload/adaptive-concurrency.ts`

The system auto-tunes concurrent uploads based on:
- Network speed (measured from recent uploads)
- Success rate (backs off on errors)
- Device capabilities (CPU cores)

Range: 6-24 concurrent uploads (was fixed at 12)

### 5. Client-Side Compression

**File:** `lib/upload/image-compressor.ts`

Before upload, images are compressed to:
- Max 4096px dimension
- 85% JPEG quality
- Only if result is smaller

**Typical savings:** 5-10x smaller files (15MB → 2MB)

## Components

### UploadZoneV2 (Current)
`components/upload/UploadZoneV2.tsx`

The production upload component with:
- Web Worker compression
- Adaptive concurrency
- Turbo Mode toggle
- Bandwidth savings display

### UploadZoneTurbo (Experimental)
`components/upload/UploadZoneTurbo.tsx`

Next-gen upload with:
- Full TurboUploadEngine integration
- Pipeline parallelism
- Pause/resume
- Real-time speed display
- Concurrency indicator

## Configuration

All tunable constants in `lib/utils/constants.ts`:

```typescript
// Upload limits
MAX_FILE_SIZE = 50MB
MAX_FILES_PER_UPLOAD = 5000
MAX_CONCURRENT_UPLOADS = 16

// Batching
SIGNED_URL_BATCH_SIZE = 100
PREFETCH_AHEAD = 200

// Turbo settings
TURBO_UPLOAD_CONCURRENCY_MIN = 6
TURBO_UPLOAD_CONCURRENCY_MAX = 24
TURBO_CONFIRM_BATCH_SIZE = 50

// Compression
COMPRESSION_ENABLED_DEFAULT = true
COMPRESSION_QUALITY = 0.85
COMPRESSION_MAX_DIMENSION = 4096
```

## Performance Targets

| Files | Target Time | Technique |
|-------|-------------|-----------|
| 100   | < 1 min     | Compression + parallel upload |
| 300   | < 2 min     | Worker pool + pipeline |
| 600   | < 5 min     | Full turbo engine |
| 1000+ | < 10 min    | All optimizations |

## Troubleshooting

### Slow uploads?

1. **Check Turbo Mode** - Should be ON (Zap icon)
2. **Check network** - Speed shown in UI
3. **Check concurrency** - Should be 12-24 for fast networks
4. **Check compression** - Should show "X MB saved"

### Workers not working?

Falls back to main thread automatically. Check console for:
```
[UploadZoneV2] Workers unavailable, using main thread
```

### High error rate?

System will automatically reduce concurrency. Check:
- Network stability
- Supabase rate limits
- File validation errors

## Download System - Streaming ZIP

### The Problem (Before)
```typescript
// OLD: Sequential, buffered
for (const image of images) {
  const buffer = await fetchImage(image) // One at a time
  allBuffers.push(buffer) // All in memory
}
const zip = createZip(allBuffers) // Build entire ZIP
return zip // Then send
```

### The Solution (After)
```typescript
// NEW: Parallel, streaming
const stream = createStreamingZip({
  images,
  parallelFetch: 10, // 10 images at once
  compression: 0 // Store only (JPEGs already compressed)
})
return new Response(stream) // Bytes flow immediately
```

### Key Files
- `lib/download/streaming-zip.ts` - Streaming ZIP generator
- `app/api/gallery/[galleryId]/download-turbo/route.ts` - Turbo download endpoint

### Techniques Used

1. **Parallel Image Fetching** - 10 images fetched simultaneously
2. **Store-Only Compression** - Level 0 for JPEGs (already compressed)
3. **True Streaming** - Bytes flow to client as generated
4. **Chunked Transfer** - No Content-Length needed

---

## Advanced Upload Features

### Chunked Uploads with Resumability

**File:** `lib/upload/chunked-upload.ts`

For large files (>10MB), we split into 5MB chunks:
- Each chunk uploaded independently
- Failed chunks retry without restarting
- State persisted in IndexedDB
- Resume after browser crash

```typescript
const manager = new ChunkedUploadManager(file)
await manager.upload(getUploadUrl)
// If interrupted, resume later:
const resumed = await resumeUpload(fileId, file)
```

### Service Worker Background Uploads

**File:** `public/upload-worker.js`

Uploads continue even when:
- Tab is closed
- Browser is minimized
- Network temporarily drops

```typescript
// Register worker
navigator.serviceWorker.register('/upload-worker.js')

// Queue upload for background processing
worker.postMessage({ type: 'QUEUE_UPLOAD', data: uploadData })
```

### Ultimate Upload Hook

**File:** `lib/upload/use-ultra-upload.ts`

Combines ALL techniques:
```typescript
const { files, stats, addFiles, pause, resume, retryFailed } = useUltraUpload({
  galleryId,
  enableCompression: true,
  enableBackgroundSync: true
})
```

---

## Architecture Comparison

### Upload Pipeline

```
BEFORE (Sequential):
File → Compress → Wait → Upload → Wait → Confirm → Next file

AFTER (Pipeline Parallel):
File 1: [Compress] → [Upload] → [Confirm]
File 2:            [Compress] → [Upload] → [Confirm]
File 3:                       [Compress] → [Upload] → [Confirm]
         ↑ Web Workers        ↑ 24 concurrent    ↑ Batched
```

### Download Pipeline

```
BEFORE (Buffered):
[Fetch all images] → [Build ZIP in memory] → [Send to client]
     Sequential           Full buffer            Wait...

AFTER (Streaming):
[Fetch 10 parallel] → [Stream to ZIP] → [Stream to client]
     Concurrent         No buffer         Immediate start
```

---

## Future Improvements

1. **AVIF/WebP output** - Even smaller compressed files
2. **Delta uploads** - Only upload changed portions
3. **P2P acceleration** - WebRTC for faster transfers
4. **Edge caching** - CDN for repeated downloads
