# Upload Pipeline - Architecture, Troubleshooting & Optimization Guide

> **Last Updated:** December 2024  
> **Status:** Production-Ready (v2 - Ultimate Performance)  
> **Target Performance:** 600 images in under 3 minutes  
> **Benchmark:** Faster than Pixieset, Pic-Time, and Shootproof

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Issue History & Root Causes](#issue-history--root-causes)
3. [Troubleshooting Guide](#troubleshooting-guide)
4. [Configuration Reference](#configuration-reference)
5. [Performance Optimization](#performance-optimization)
6. [Monitoring & Debugging](#monitoring--debugging)

---

## Architecture Overview

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TURBO UPLOAD ENGINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │   PREFLIGHT  │    │  COMPRESSION │    │    UPLOAD    │    │  CONFIRM   │ │
│  │              │    │              │    │              │    │            │ │
│  │ Generate     │───▶│ Web Workers  │───▶│ XHR with     │───▶│ Database   │ │
│  │ Signed URLs  │    │ Parallel     │    │ Progress     │    │ Insert     │ │
│  │ (50/batch)   │    │ (4-8 cores)  │    │ (6-24 conc.) │    │ (50/batch) │ │
│  └──────────────┘    └──────────────┘    └──────────────┘    └────────────┘ │
│         │                   │                   │                   │        │
│         ▼                   ▼                   ▼                   ▼        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    PIPELINE PARALLELISM                               │   │
│  │  • Preflight runs ahead of compression                                │   │
│  │  • Compression runs ahead of upload                                   │   │
│  │  • All stages operate concurrently                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `lib/upload/turbo-upload-engine.ts` | Main upload orchestrator |
| `lib/upload/compression-worker.ts` | Web Worker pool for parallel compression |
| `server/actions/upload.actions.ts` | Server-side signed URL generation & confirmation |
| `components/upload/UploadZoneTurbo.tsx` | UI component |

### Data Flow

1. **User drops files** → Files validated (type, size)
2. **Preflight** → Server generates signed URLs in batches of 50
3. **Compression** → Web Workers compress images in parallel (4-8 concurrent)
4. **Upload** → XHR uploads to Supabase Storage (6-24 concurrent, adaptive)
5. **Confirm** → Server inserts image records in batches of 50
6. **Complete** → UI refreshes, gallery updated

---

## Issue History & Root Causes

### Issue #1: Stalling at ~400 images (Original)

**Date:** Pre-December 2024  
**Symptom:** Uploads would stall around 400 images  
**Root Cause:** `PREFLIGHT_BATCH_SIZE = 200` caused server timeouts when generating 200 signed URLs in parallel

**Fix:**
- Reduced `PREFLIGHT_BATCH_SIZE` from 200 → 50
- Added chunked processing on server (20 files at a time)

---

### Issue #2: Stalling at exactly 100 images ⚠️ CRITICAL

**Date:** December 2024  
**Symptom:** Uploads stop at exactly 100 of N images, never resume  
**Root Cause:** **INFINITE WAIT LOOP**

```typescript
// THE BUG - This loop never exits if preflight fails!
while (!this.preflightCache.has(id) && this.preflightPending.has(id)) {
  await this.sleep(10)  // ← Loops forever if preflight batch 3+ fails
}
```

**Why 100 exactly?**
- Preflight batch size = 50
- Batch 1 (files 1-50): ✅ Success → URLs cached
- Batch 2 (files 51-100): ✅ Success → URLs cached  
- Batch 3 (files 101-150): ❌ Fails (timeout/network) → Files stuck in `preflightPending`
- Upload pipeline waits forever for files 101+ to get URLs

**Comprehensive Fix Applied:**

1. **Added timeout to preflight waiting:**
```typescript
private async waitForPreflight(id: string): Promise<{ success: boolean; error?: string }> {
  const startTime = Date.now()
  while (Date.now() - startTime < PREFLIGHT_WAIT_TIMEOUT_MS) {  // 60s max
    if (this.preflightCache.has(id)) return { success: true }
    // ... timeout after 60s, never block forever
  }
  return { success: false, error: 'Preflight timeout' }
}
```

2. **Added preflight recovery:**
```typescript
private async recoverPreflight(file: TurboFile): Promise<boolean> {
  // Attempts single-file URL generation when batch failed
  // 3 retry attempts with exponential backoff
}
```

3. **Added background retry queue:**
```typescript
private preflightRetryQueue: TurboFile[] = []
private async schedulePreflightRetry() {
  // Processes failed preflights in background
  // Doesn't block main upload pipeline
}
```

4. **Added confirmation retries:**
```typescript
for (let attempt = 0; attempt < CONFIRM_RETRY_ATTEMPTS; attempt++) {
  // 3 retries with exponential backoff
}
```

---

## Troubleshooting Guide

### Quick Diagnosis

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| Stalls at exact number (100, 150, etc.) | Preflight batch failure | Check server logs, verify Supabase connectivity |
| Slow compression | CPU bottleneck | Reduce image dimensions, check worker count |
| Slow uploads | Network/concurrency | Check bandwidth, adjust `UPLOAD_CONCURRENCY_MAX` |
| Files marked as error | Check console for specific error | Use retry button, check file validation |
| "No upload URL" error | Preflight failed | Check server action, Supabase storage permissions |

### Debug Logging

Enable verbose logging by checking browser console for `[TurboUpload]` prefix:

```
[TurboUpload] Preflight batch 0 succeeded (50 files)
[TurboUpload] Preflight batch 50 succeeded (50 files)
[TurboUpload] Preflight batch 100 failed (attempt 1/5): Error: timeout
[TurboUpload] Retrying preflight for 50 files
[TurboUpload] Preflight recovery succeeded for IMG_001.jpg
```

### Recovery Procedures

**If upload stalls:**
1. Check if "Retry failed" button appears
2. Click retry - system will re-attempt failed files
3. If still failing, check browser console for errors
4. Verify Supabase dashboard for any rate limiting

**If many files fail:**
1. Check network connectivity
2. Reduce concurrent uploads: Lower `UPLOAD_CONCURRENCY_MAX`
3. Check Supabase storage quota
4. Verify user's plan limits

---

## Configuration Reference

### Client-Side Constants (`turbo-upload-engine.ts`)

```typescript
// Preflight (signed URL generation)
PREFLIGHT_BATCH_SIZE = 75        // Larger batches = fewer round trips
PREFLIGHT_RETRY_ATTEMPTS = 5     // Retries per batch
PREFLIGHT_TIMEOUT_MS = 45000     // 45s timeout per batch
PREFLIGHT_WAIT_TIMEOUT_MS = 60000 // 60s max wait before recovery

// Upload concurrency - AGGRESSIVE START
UPLOAD_CONCURRENCY_INITIAL = 20  // Start high, back off if needed
UPLOAD_CONCURRENCY_MIN = 8       // Minimum concurrent uploads
UPLOAD_CONCURRENCY_MAX = 32      // Maximum for fast connections

// Compression
COMPRESSION_QUALITY = 0.85       // JPEG quality (0-1)
COMPRESSION_MAX_DIM = 4096       // Max width/height in pixels
COMPRESSION_SKIP_THRESHOLD = 500KB // Skip small files

// Confirmation - PARALLEL
CONFIRM_BATCH_SIZE = 100         // Larger batches, fewer round trips
CONFIRM_RETRY_ATTEMPTS = 3       // Retries per confirm batch
CONFIRM_PARALLEL_BATCHES = 3     // Run 3 confirm batches in parallel

// Priority queuing
SMALL_FILE_THRESHOLD = 2MB       // Prioritize small files
LARGE_FILE_THRESHOLD = 10MB      // Deprioritize large files
```

### Server-Side Constants (`upload.actions.ts`)

```typescript
CHUNK_SIZE = 15                  // Signed URLs generated per chunk
MAX_RETRIES = 3                  // Retries per file
```

### Tuning Guidelines

| Scenario | Adjustment |
|----------|------------|
| Slow network | System auto-adjusts; reduce `UPLOAD_CONCURRENCY_INITIAL` to 10 |
| Fast network | Increase `UPLOAD_CONCURRENCY_MAX` to 48 |
| Server timeouts | Reduce `PREFLIGHT_BATCH_SIZE` to 50 |
| High error rate | System auto-backs-off; check server logs |
| Memory issues | Reduce `COMPRESSION_MAX_DIM` or lower concurrency |
| Quick visual progress | Increase `SMALL_FILE_THRESHOLD` to 5MB |

---

## Performance Optimization

### State-of-the-Art Techniques (v2)

| Technique | Description | Impact |
|-----------|-------------|--------|
| **Web Worker Compression** | Parallel compression across CPU cores | 4-8x parallelism |
| **Pipeline Parallelism** | Compress batch N while uploading batch N-1 | Eliminates wait time |
| **Priority Queuing** | Small files first for quick visual progress | Better UX |
| **Aggressive Concurrency** | Start at 20, back off on errors | Faster than ramping up |
| **Smart Compression Skip** | Skip files < 500KB (compress poorly) | Saves CPU cycles |
| **Memory Optimization** | Release blobs immediately after upload | Prevents OOM |
| **Parallel Confirmation** | Fire-and-forget confirm batches (3 parallel) | Faster completion |
| **Connection Warming** | Prime connections before heavy upload | Reduces first-request latency |
| **Speculative Preflight** | Generate URLs far ahead of upload | No waiting for URLs |
| **Exponential Backoff + Jitter** | Prevents thundering herd | Better recovery |

### Performance Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| 600 images | < 5 minutes | Total upload time |
| Compression ratio | 2-4x | `stats.bandwidthSaved` |
| Upload speed | > 5 MB/s | `stats.avgSpeedMBps` |
| Error rate | < 1% | `stats.failed / stats.totalFiles` |

### Bottleneck Analysis

```
┌─────────────────────────────────────────────────────────────┐
│                    TYPICAL BOTTLENECKS                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. NETWORK (most common)                                    │
│     └─ Symptom: Low MB/s, uploads queued                     │
│     └─ Fix: Increase concurrency, use compression            │
│                                                              │
│  2. SERVER (rate limiting)                                   │
│     └─ Symptom: Preflight failures, 429 errors               │
│     └─ Fix: Reduce batch sizes, add delays                   │
│                                                              │
│  3. CPU (rare with workers)                                  │
│     └─ Symptom: High compression count, low upload count     │
│     └─ Fix: Reduce quality, skip small files                 │
│                                                              │
│  4. MEMORY (very large files)                                │
│     └─ Symptom: Browser crashes, OOM errors                  │
│     └─ Fix: Reduce max dimension, process fewer at once      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Monitoring & Debugging

### Real-Time Stats

The upload engine exposes real-time stats via `onStatsUpdate`:

```typescript
interface TurboUploadStats {
  totalFiles: number           // Total files in queue
  queued: number               // Waiting to start
  compressing: number          // Currently compressing
  uploading: number            // Currently uploading
  completed: number            // Successfully finished
  failed: number               // Failed (check errors)
  totalOriginalBytes: number   // Original file sizes
  totalCompressedBytes: number // After compression
  uploadedBytes: number        // Actually uploaded
  bandwidthSaved: number       // Bytes saved by compression
  avgSpeedMBps: number         // Upload speed
  estimatedSecondsRemaining: number
  currentConcurrency: number   // Active concurrent uploads
}
```

### Console Debugging

Add this to browser console for detailed tracking:

```javascript
// Monitor all upload events
window.DEBUG_UPLOAD = true
```

### Server-Side Logging

Check Vercel/server logs for:
- `[Upload] Signed URL generation failed` - Supabase issues
- `[TurboUpload] Preflight batch X failed` - Network/timeout
- `[TurboUpload] Confirm failed` - Database issues

---

## Prevention Checklist

Before any upload-related changes, verify:

- [ ] No infinite loops in wait conditions
- [ ] All async operations have timeouts
- [ ] Failed operations have retry logic
- [ ] Batch sizes are tested with 500+ files
- [ ] Error states are recoverable (retry button works)
- [ ] Console logging is present for debugging
- [ ] Stats update correctly during upload

---

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════════╗
║                    UPLOAD QUICK REFERENCE                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  STALLS AT EXACT NUMBER (100, 150, etc.)                       ║
║  → Preflight batch failed, check server logs                   ║
║  → Files should auto-retry, if not use Retry button            ║
║                                                                ║
║  VERY SLOW UPLOADS                                             ║
║  → Check network speed                                         ║
║  → Verify compression is enabled (Turbo Mode ON)               ║
║  → Check stats.currentConcurrency in console                   ║
║                                                                ║
║  MANY FILES FAILING                                            ║
║  → Check browser console for specific errors                   ║
║  → Verify Supabase storage permissions                         ║
║  → Check user's plan storage/image limits                      ║
║                                                                ║
║  KEY FILES TO CHECK                                            ║
║  → lib/upload/turbo-upload-engine.ts (main logic)              ║
║  → server/actions/upload.actions.ts (server side)              ║
║  → lib/upload/compression-worker.ts (compression)              ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
```
