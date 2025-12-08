# Media Pipeline Roadmap: Pixieset/Pic-Time Parity

> Implementation guide for upgrading 12img to a high-throughput, low-latency photo gallery SaaS competitive with Pixieset and Pic-Time.

---

## Executive Summary

### Current State (What 12img Has)

| Component | Status | Implementation |
|-----------|--------|----------------|
| **Upload Layer** | ✅ Basic | Direct-to-storage via presigned URLs, 10 concurrent uploads |
| **Storage** | ✅ Basic | Supabase Storage (S3-compatible), private bucket |
| **Responsive Images** | ✅ Basic | On-the-fly transforms (400px thumb, 1920px preview) |
| **ZIP Downloads** | ✅ Complete | Streaming ZIP generation, async job queue |
| **CDN** | ⚠️ Partial | Supabase CDN only, no dedicated edge caching |
| **Background Processing** | ❌ None | No derivative pre-generation, no watermarking |
| **Resumable Uploads** | ❌ None | No chunked/multipart support |
| **EXIF/Metadata** | ❌ None | No extraction or indexing |

### Target State (Pixieset/Pic-Time Parity)

| Component | Priority | Effort |
|-----------|----------|--------|
| Pre-generated derivatives | P0 | High |
| Resumable uploads (TUS) | P1 | Medium |
| EXIF extraction pipeline | P1 | Medium |
| Watermarking system | P2 | Medium |
| Dedicated CDN (Cloudflare) | P2 | Low |
| RAW file support | P3 | High |

---

## 1. Upload Layer & Protocols

### 1.1 Current Implementation

```
Location: server/actions/upload.actions.ts
          components/upload/UploadZone.tsx
          lib/storage/signed-urls.ts
```

**What exists:**
- Direct-to-storage upload via Supabase presigned URLs
- Batch signed URL generation (100 files per batch)
- 10 concurrent uploads (configurable in `lib/utils/constants.ts`)
- Client-side validation (MIME type, file size ≤25MB)
- XHR progress tracking per file

**Storage path scheme:**
```
gallery-images/{galleryId}/{imageId}.{ext}
```

### 1.2 Gap: Resumable/Chunked Uploads

**Current limitation:** No resume on connection loss. Large galleries (500+ images) risk partial uploads.

**Implementation Plan:**

```typescript
// NEW: lib/upload/resumable.ts

interface UploadSession {
  id: string
  galleryId: string
  userId: string
  status: 'initiated' | 'in_progress' | 'completed' | 'aborted'
  files: UploadSessionFile[]
  createdAt: Date
  expiresAt: Date
}

interface UploadSessionFile {
  localId: string
  filename: string
  mimeType: string
  totalBytes: number
  uploadedBytes: number
  storagePath: string
  checksum?: string  // MD5 for integrity
  status: 'pending' | 'uploading' | 'uploaded' | 'failed'
}
```

**Database migration required:**
```sql
-- NEW TABLE: upload_sessions
CREATE TABLE upload_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'initiated',
  file_count INTEGER NOT NULL,
  uploaded_count INTEGER NOT NULL DEFAULT 0,
  total_bytes BIGINT NOT NULL,
  uploaded_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours'
);

-- NEW TABLE: upload_session_files
CREATE TABLE upload_session_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  local_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  total_bytes BIGINT NOT NULL,
  uploaded_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT,
  checksum TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**API contracts:**
```typescript
// POST /api/upload/session
interface CreateSessionRequest {
  galleryId: string
  files: { localId: string; filename: string; mimeType: string; size: number }[]
}
interface CreateSessionResponse {
  sessionId: string
  files: { localId: string; signedUrl: string; token: string }[]
  expiresAt: string
}

// GET /api/upload/session/:id
// Returns session state for resume

// POST /api/upload/session/:id/complete
// Finalizes session, triggers processing
```

---

## 2. Background Processing Pipeline

### 2.1 Current State

**No background processing exists.** Images are stored as-is. Supabase Image Transformations generate derivatives on-the-fly.

**Current derivative strategy (on-demand):**
```typescript
// lib/utils/constants.ts
export const IMAGE_SIZES = {
  THUMBNAIL: { width: 400, quality: 75 },   // Grid
  COVER: { width: 800, quality: 90 },       // Dashboard
  PREVIEW: { width: 1920, quality: 85 },    // Fullscreen
  ORIGINAL: null,                            // Downloads
}
```

### 2.2 Target: Pre-Generated Derivatives

**Why pre-generate:**
- Eliminates first-view latency (Supabase transforms take 200-500ms)
- Enables watermarking (can't watermark on-the-fly)
- Reduces Supabase transform costs at scale
- Enables srcset with multiple sizes

**Derivative set (Pixieset-style):**

| Size Code | Long Edge | Use Case | Quality |
|-----------|-----------|----------|---------|
| `xs` | 200px | Grid thumbnail (mobile) | 70% |
| `sm` | 400px | Grid thumbnail (desktop) | 75% |
| `md` | 800px | Lightbox initial (mobile) | 80% |
| `lg` | 1600px | Lightbox default (desktop) | 85% |
| `xl` | 2400px | Web high-res download | 90% |
| `original` | - | Print download | 100% |

**Storage key scheme:**
```
gallery-images/
  {galleryId}/
    {photoId}/
      original.jpg
      xs.jpg
      sm.jpg
      md.jpg
      lg.jpg
      xl.jpg
      watermarked/
        sm.jpg
        md.jpg
        lg.jpg
```

### 2.3 Processing Architecture

**Option A: Supabase Edge Functions (Recommended for MVP)**
```
Upload Complete → Database Trigger → Edge Function → Generate Derivatives
```

**Option B: External Worker (Scale)**
```
Upload Complete → Postgres NOTIFY → Worker Fleet → Generate Derivatives
```

**Implementation (Edge Function):**

```typescript
// supabase/functions/process-image/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

const DERIVATIVE_SIZES = [
  { code: 'xs', width: 200, quality: 70 },
  { code: 'sm', width: 400, quality: 75 },
  { code: 'md', width: 800, quality: 80 },
  { code: 'lg', width: 1600, quality: 85 },
  { code: 'xl', width: 2400, quality: 90 },
]

serve(async (req) => {
  const { imageId, galleryId, storagePath } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  
  // 1. Download original
  const { data: original } = await supabase.storage
    .from('gallery-images')
    .download(storagePath)
  
  // 2. Generate each derivative using Sharp (via Deno)
  for (const size of DERIVATIVE_SIZES) {
    const derivative = await processImage(original, size)
    const derivativePath = `${galleryId}/${imageId}/${size.code}.jpg`
    
    await supabase.storage
      .from('gallery-images')
      .upload(derivativePath, derivative, { contentType: 'image/jpeg' })
    
    // 3. Record derivative in database
    await supabase.from('photo_derivatives').insert({
      photo_id: imageId,
      size_code: size.code,
      storage_path: derivativePath,
      width: size.width,
      status: 'ready'
    })
  }
  
  // 4. Update photo status
  await supabase.from('images')
    .update({ processing_status: 'ready' })
    .eq('id', imageId)
  
  return new Response(JSON.stringify({ success: true }))
})
```

**Database changes:**
```sql
-- Add processing status to images
ALTER TABLE images ADD COLUMN processing_status TEXT DEFAULT 'pending';
-- Values: pending, processing, ready, failed

-- NEW TABLE: photo_derivatives
CREATE TABLE photo_derivatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  size_code TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER,
  byte_size INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(photo_id, size_code)
);

CREATE INDEX idx_derivatives_photo ON photo_derivatives(photo_id);
```

### 2.4 Processing DAG

```
┌─────────────────────────────────────────────────────────────┐
│                    ORIGINAL UPLOADED                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. VALIDATE                                                  │
│    - Verify checksum                                         │
│    - Extract EXIF (orientation, capture_time, camera, GPS)  │
│    - Detect ICC profile                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. NORMALIZE                                                 │
│    - Apply EXIF orientation (rotate/flip)                   │
│    - Convert to sRGB color space                            │
│    - Strip metadata (privacy)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GENERATE DERIVATIVES (parallel)                          │
│    ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│    │ xs   │ │ sm   │ │ md   │ │ lg   │ │ xl   │            │
│    │200px │ │400px │ │800px │ │1600px│ │2400px│            │
│    └──────┘ └──────┘ └──────┘ └──────┘ └──────┘            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. OPTIONAL: WATERMARK                                       │
│    - Apply to sm, md, lg only                               │
│    - Store in /watermarked/ subfolder                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. PERSIST & UPDATE STATUS                                   │
│    - Upload derivatives to storage                          │
│    - Insert photo_derivatives rows                          │
│    - Update images.processing_status = 'ready'              │
│    - Emit 'photo.ready' event                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Responsive Image Delivery

### 3.1 Current Implementation

```typescript
// lib/storage/signed-urls.ts
// getSignedUrlsWithSizes() returns thumbnail + preview + original
// Uses Supabase on-the-fly transforms
```

### 3.2 Target: srcset with Pre-Generated Derivatives

**Frontend contract:**
```typescript
interface Photo {
  id: string
  galleryId: string
  originalFilename: string
  width: number
  height: number
  captureTime?: string
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed'
  derivatives: {
    xs?: string  // Signed URL
    sm?: string
    md?: string
    lg?: string
    xl?: string
    original?: string
  }
}
```

**Responsive image component:**
```tsx
// components/gallery/ResponsiveImage.tsx
interface ResponsiveImageProps {
  photo: Photo
  sizes: string  // e.g., "(max-width: 640px) 100vw, 400px"
  priority?: boolean
}

export function ResponsiveImage({ photo, sizes, priority }: ResponsiveImageProps) {
  const { derivatives } = photo
  
  // Build srcset from available derivatives
  const srcset = [
    derivatives.xs && `${derivatives.xs} 200w`,
    derivatives.sm && `${derivatives.sm} 400w`,
    derivatives.md && `${derivatives.md} 800w`,
    derivatives.lg && `${derivatives.lg} 1600w`,
    derivatives.xl && `${derivatives.xl} 2400w`,
  ].filter(Boolean).join(', ')
  
  return (
    <img
      src={derivatives.sm || derivatives.xs}  // Fallback
      srcSet={srcset}
      sizes={sizes}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className="w-full h-full object-cover"
    />
  )
}
```

**Grid usage:**
```tsx
<ResponsiveImage
  photo={photo}
  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
/>
```

**Lightbox usage:**
```tsx
<ResponsiveImage
  photo={photo}
  sizes="100vw"
  priority
/>
```

### 3.3 Cache Headers

**For pre-generated derivatives (immutable):**
```
Cache-Control: public, max-age=31536000, immutable
```

**Implementation via Supabase Storage policies or Cloudflare:**
- Hash in filename OR
- Query string version parameter

---

## 4. Download & ZIP Orchestration

### 4.1 Current Implementation ✅

```
Location: server/services/archive.service.ts
          server/actions/archive.actions.ts
          app/api/cron/process-archives/route.ts
```

**What exists:**
- Streaming ZIP generation (archiver library)
- Async job queue with status tracking
- Idempotency via images_hash
- Email notification on completion
- Signed download URLs (7-day expiry)

**Archive status flow:**
```
pending → processing → completed
                    → failed
```

### 4.2 Enhancement: Resolution Selection

**Current:** ZIP contains original files only.

**Target:** Allow resolution selection.

```typescript
// NEW: server/actions/archive.actions.ts
interface CreateArchiveRequest {
  galleryId: string
  resolution: 'original' | 'xl' | 'lg' | 'md'  // NEW
  filter?: 'all' | 'favorites' | 'selected'
  selectedIds?: string[]
}
```

**ZIP naming:**
```
{gallery-title}_{resolution}_{timestamp}.zip
```

---

## 5. EXIF Extraction & Metadata

### 5.1 Current State

**No EXIF extraction.** Images table has `width` and `height` but they're optional and rarely populated.

### 5.2 Implementation Plan

**Extract on upload confirmation:**
```typescript
// server/actions/upload.actions.ts - confirmUploads()
// After inserting image record, queue EXIF extraction

import ExifReader from 'exifreader'

async function extractExif(storagePath: string): Promise<ExifData> {
  const { data } = await supabase.storage
    .from('gallery-images')
    .download(storagePath)
  
  const tags = ExifReader.load(await data.arrayBuffer())
  
  return {
    width: tags['Image Width']?.value,
    height: tags['Image Height']?.value,
    orientation: tags['Orientation']?.value,
    captureTime: tags['DateTimeOriginal']?.description,
    camera: tags['Model']?.description,
    lens: tags['LensModel']?.description,
    focalLength: tags['FocalLength']?.description,
    aperture: tags['FNumber']?.description,
    iso: tags['ISOSpeedRatings']?.value,
    shutterSpeed: tags['ExposureTime']?.description,
    gpsLat: tags['GPSLatitude']?.description,
    gpsLon: tags['GPSLongitude']?.description,
  }
}
```

**Database changes:**
```sql
ALTER TABLE images ADD COLUMN orientation INTEGER;
ALTER TABLE images ADD COLUMN capture_time TIMESTAMPTZ;
ALTER TABLE images ADD COLUMN camera TEXT;
ALTER TABLE images ADD COLUMN lens TEXT;
ALTER TABLE images ADD COLUMN focal_length TEXT;
ALTER TABLE images ADD COLUMN aperture TEXT;
ALTER TABLE images ADD COLUMN iso INTEGER;
ALTER TABLE images ADD COLUMN shutter_speed TEXT;
ALTER TABLE images ADD COLUMN gps_lat DECIMAL(10, 8);
ALTER TABLE images ADD COLUMN gps_lon DECIMAL(11, 8);
```

---

## 6. CDN & Global Delivery

### 6.1 Current State

Supabase Storage uses its own CDN (backed by Cloudflare in some regions). No dedicated CDN configuration.

### 6.2 Enhancement: Cloudflare in Front

**Benefits:**
- Global edge caching
- Better cache control
- Image optimization (Polish, Mirage)
- DDoS protection

**Implementation:**
1. Add custom domain to Supabase project
2. Configure Cloudflare DNS (proxied)
3. Set cache rules for `/storage/` paths

**Cloudflare Page Rules:**
```
Match: *12img.com/storage/gallery-images/*
Cache Level: Cache Everything
Edge Cache TTL: 1 month
Browser Cache TTL: 1 year
```

---

## 7. Watermarking System

### 7.1 Design

**Watermark types:**
- Text overlay (photographer name/logo)
- Image overlay (PNG with transparency)

**Application:**
- Applied during derivative generation
- Only on web-viewable sizes (sm, md, lg)
- NOT on original or xl (download sizes)

**User settings:**
```sql
ALTER TABLE user_settings ADD COLUMN watermark_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE user_settings ADD COLUMN watermark_type TEXT; -- 'text' | 'image'
ALTER TABLE user_settings ADD COLUMN watermark_text TEXT;
ALTER TABLE user_settings ADD COLUMN watermark_image_path TEXT;
ALTER TABLE user_settings ADD COLUMN watermark_position TEXT DEFAULT 'bottom-right';
ALTER TABLE user_settings ADD COLUMN watermark_opacity INTEGER DEFAULT 50;
```

---

## 8. Data Models Summary

### 8.1 Updated Schema

```typescript
// types/database.ts - ADDITIONS

interface Image {
  // Existing fields...
  
  // NEW: Processing
  processing_status: 'pending' | 'processing' | 'ready' | 'failed'
  processing_version: number  // For reprocessing
  
  // NEW: EXIF
  orientation: number | null
  capture_time: string | null
  camera: string | null
  lens: string | null
  focal_length: string | null
  aperture: string | null
  iso: number | null
  shutter_speed: string | null
  gps_lat: number | null
  gps_lon: number | null
}

interface PhotoDerivative {
  id: string
  photo_id: string
  size_code: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  storage_path: string
  width: number
  height: number | null
  byte_size: number | null
  is_watermarked: boolean
  status: 'pending' | 'processing' | 'ready' | 'failed'
  created_at: string
}

interface UploadSession {
  id: string
  gallery_id: string
  user_id: string
  status: 'initiated' | 'in_progress' | 'completed' | 'aborted'
  file_count: number
  uploaded_count: number
  total_bytes: number
  uploaded_bytes: number
  created_at: string
  expires_at: string
}
```

---

## 9. Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Add `processing_status` to images table
- [ ] Create `photo_derivatives` table
- [ ] Create Supabase Edge Function for processing
- [ ] Update upload flow to trigger processing
- [ ] Add "processing" indicator in gallery UI

### Phase 2: Derivatives (Week 3-4)
- [ ] Implement derivative generation (Sharp)
- [ ] Update frontend to use derivatives
- [ ] Implement srcset in MasonryGrid
- [ ] Update FullscreenViewer for lg/xl sizes
- [ ] Add derivative selection to downloads

### Phase 3: Metadata (Week 5)
- [ ] Implement EXIF extraction
- [ ] Add metadata columns to images
- [ ] Display capture time in gallery
- [ ] Sort by capture time option

### Phase 4: Resumable Uploads (Week 6)
- [ ] Create upload_sessions tables
- [ ] Implement session API endpoints
- [ ] Update UploadZone for resume support
- [ ] Add session recovery UI

### Phase 5: Watermarking (Week 7-8)
- [ ] Add watermark settings to user_settings
- [ ] Implement watermark UI in settings
- [ ] Add watermark step to processing pipeline
- [ ] Store watermarked derivatives separately

### Phase 6: CDN Optimization (Week 9)
- [ ] Configure Cloudflare
- [ ] Set up custom domain
- [ ] Implement cache headers
- [ ] Test global delivery performance

---

## 10. Files to Modify/Create

### New Files
```
lib/upload/resumable.ts           # Resumable upload logic
lib/processing/derivatives.ts     # Derivative generation
lib/processing/exif.ts            # EXIF extraction
lib/processing/watermark.ts       # Watermark application
supabase/functions/process-image/ # Edge function
components/gallery/ResponsiveImage.tsx
database/migrations/020-processing-status.sql
database/migrations/021-photo-derivatives.sql
database/migrations/022-upload-sessions.sql
database/migrations/023-exif-columns.sql
database/migrations/024-watermark-settings.sql
```

### Modified Files
```
server/actions/upload.actions.ts  # Trigger processing
lib/storage/signed-urls.ts        # Return derivative URLs
components/upload/UploadZone.tsx  # Resume support
components/gallery/MasonryGrid.tsx # srcset
components/gallery/MasonryItem.tsx # ResponsiveImage
components/gallery/FullscreenViewer.tsx # Derivative sizes
app/gallery/[id]/page.tsx         # Fetch derivatives
types/database.ts                 # New types
```

---

## 11. Performance Targets

| Metric | Current | Target |
|--------|---------|--------|
| Time to first thumbnail | ~500ms | <100ms |
| Lightbox image load | ~800ms | <200ms |
| Gallery page LCP | ~2s | <1s |
| Upload throughput | 10 concurrent | 20 concurrent |
| ZIP generation (100 images) | ~60s | ~30s |

---

## 12. Cost Considerations

| Component | Current Cost | Projected Cost |
|-----------|--------------|----------------|
| Supabase Storage | ~$0.02/GB | ~$0.04/GB (5x derivatives) |
| Supabase Transforms | ~$5/10K | $0 (pre-generated) |
| Edge Function invocations | $0 | ~$2/100K uploads |
| Cloudflare | $0 | $20/mo (Pro plan) |

**Net:** Slight storage increase, significant transform savings at scale.

---

*Document generated: 2024-12-07*
*Based on 12img codebase analysis*
