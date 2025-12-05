# 7. Upload Flow Engineering Specification

## 7.1 Upload Strategy: Signed URL Direct Upload

### Architecture Decision

| Strategy | Selected | Rationale |
|----------|----------|-----------|
| Direct upload via signed URL | ✅ | Bypasses server, reduces latency, handles large files |
| Server proxy upload | ❌ | Memory pressure, timeout issues, unnecessary hop |
| Chunked/resumable upload | ❌ | Complexity not justified for 25MB limit |

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                     │
├─────────────────────────────────────────────────────────────────────┤
│  1. User selects files via <input type="file" multiple>            │
│  2. Client validates: type, size, count                             │
│  3. Client extracts dimensions (optional, for aspect ratio)         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER ACTION                                   │
│                 generateSignedUploadUrls()                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Verify auth (Clerk userId)                                      │
│  2. Verify gallery ownership                                        │
│  3. Validate file metadata (type, size)                             │
│  4. Generate storage paths: {galleryId}/{uuid}.{ext}                │
│  5. Request signed upload URLs from Supabase Storage                │
│  6. Return: [{ localId, storagePath, signedUrl, token }]            │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT                                     │
│                    Direct Upload to Storage                          │
├─────────────────────────────────────────────────────────────────────┤
│  1. Queue uploads with concurrency limit (3)                        │
│  2. PUT request to signedUrl with file body                         │
│  3. Track progress via XHR upload events                            │
│  4. Handle individual failures, allow retry                         │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVER ACTION                                   │
│                      confirmUploads()                                │
├─────────────────────────────────────────────────────────────────────┤
│  1. Verify auth                                                      │
│  2. Verify gallery ownership                                        │
│  3. Verify upload tokens                                            │
│  4. Insert image records into database                              │
│  5. Set cover image if first upload                                 │
│  6. revalidatePath() for gallery                                    │
│  7. Return: { imageIds }                                            │
└─────────────────────────────────────────────────────────────────────┘
```

## 7.2 Chunked Upload Strategy

### Decision: Not Implemented

**Rationale:**
- Maximum file size is 25MB
- Modern connections handle 25MB in reasonable time
- Supabase Storage doesn't natively support resumable uploads
- Complexity not justified for MVP

**Future consideration:** If file size limit increases beyond 50MB, implement TUS protocol.

## 7.3 Validation

### Client-Side Validation

```typescript
// lib/validation/image.schema.ts
import { z } from 'zod'

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB
export const MAX_FILES_PER_UPLOAD = 100

export const uploadFileSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ALLOWED_MIME_TYPES),
  size: z.number().min(1).max(MAX_FILE_SIZE),
})

export const uploadBatchSchema = z.object({
  files: z.array(uploadFileSchema).min(1).max(MAX_FILES_PER_UPLOAD),
})
```

### Client Validation Implementation

```typescript
// components/gallery/ImageUploader.tsx
'use client'

import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_FILES_PER_UPLOAD } from '@/lib/validation/image.schema'

interface ValidationResult {
  valid: File[]
  invalid: Array<{ file: File; reason: string }>
}

function validateFiles(files: FileList): ValidationResult {
  const result: ValidationResult = { valid: [], invalid: [] }
  
  const fileArray = Array.from(files).slice(0, MAX_FILES_PER_UPLOAD)
  
  for (const file of fileArray) {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      result.invalid.push({
        file,
        reason: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`,
      })
      continue
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      result.invalid.push({
        file,
        reason: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 25MB`,
      })
      continue
    }
    
    // Check file size minimum (empty files)
    if (file.size === 0) {
      result.invalid.push({
        file,
        reason: 'File is empty',
      })
      continue
    }
    
    result.valid.push(file)
  }
  
  return result
}
```

### Server-Side Validation

```typescript
// server/actions/upload.actions.ts
function validateUploadRequest(files: UploadFileMetadata[]): void {
  if (files.length === 0) {
    throw new ValidationError('No files provided')
  }
  
  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new ValidationError(`Maximum ${MAX_FILES_PER_UPLOAD} files per upload`)
  }
  
  for (const file of files) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType as any)) {
      throw new ValidationError(`Invalid file type: ${file.mimeType}`)
    }
    
    if (file.fileSize > MAX_FILE_SIZE) {
      throw new ValidationError(`File too large: ${file.originalFilename}`)
    }
    
    if (file.fileSize <= 0) {
      throw new ValidationError(`Invalid file size: ${file.originalFilename}`)
    }
  }
}
```

## 7.4 MIME Type Verification

### Client-Side (File API)

```typescript
// Read from File object
const mimeType = file.type // e.g., 'image/jpeg'
```

### Server-Side (Magic Bytes)

Not implemented for MVP. Supabase Storage validates MIME type on upload.

**Future enhancement:** Verify magic bytes match declared MIME type.

### Extension Mapping

```typescript
// lib/utils/mime.ts
export const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export function getExtensionFromMime(mimeType: string): string {
  const ext = MIME_TO_EXT[mimeType]
  if (!ext) throw new Error(`Unsupported MIME type: ${mimeType}`)
  return ext
}
```

## 7.5 File Size Limits

| Limit | Value | Enforced At |
|-------|-------|-------------|
| Per file | 25 MB | Client, Server, Storage bucket |
| Per upload batch | 100 files | Client, Server |
| Total per gallery | Unlimited | N/A |

### Bucket Configuration

```sql
-- Supabase bucket file size limit
UPDATE storage.buckets
SET file_size_limit = 26214400  -- 25MB in bytes
WHERE id = 'gallery-images';
```

## 7.6 Multi-File Batching

### Batch Request Structure

```typescript
interface UploadBatchRequest {
  galleryId: string
  files: Array<{
    localId: string        // Client-generated ID for tracking
    mimeType: string       // e.g., 'image/jpeg'
    fileSize: number       // Bytes
    originalFilename: string
  }>
}

interface UploadBatchResponse {
  uploads: Array<{
    localId: string
    storagePath: string    // e.g., '{galleryId}/{uuid}.jpg'
    signedUrl: string      // PUT URL for upload
    token: string          // Verification token
  }>
}
```

### Batch Processing

```typescript
// server/actions/upload.actions.ts
export async function generateSignedUploadUrls(
  request: UploadBatchRequest
): Promise<UploadBatchResponse> {
  // Auth check
  const user = await getAuthenticatedUser()
  
  // Ownership check
  await verifyGalleryOwnership(request.galleryId, user.id)
  
  // Validation
  validateUploadRequest(request.files)
  
  // Generate all signed URLs
  const uploads = await Promise.all(
    request.files.map(async (file) => {
      const imageId = uuidv4()
      const ext = getExtensionFromMime(file.mimeType)
      const storagePath = `${request.galleryId}/${imageId}.${ext}`
      
      const { data, error } = await supabaseAdmin.storage
        .from('gallery-images')
        .createSignedUploadUrl(storagePath)
      
      if (error) {
        throw new StorageError(`Failed to create upload URL: ${error.message}`)
      }
      
      return {
        localId: file.localId,
        storagePath,
        signedUrl: data.signedUrl,
        token: data.token,
      }
    })
  )
  
  return { uploads }
}
```

## 7.7 Parallelization Strategy

### Client-Side Upload Queue

```typescript
// lib/hooks/use-upload.ts
import PQueue from 'p-queue'

const MAX_CONCURRENT_UPLOADS = 3

export function useUpload(galleryId: string) {
  const [state, setState] = useState<UploadState>({
    status: 'idle',
    uploads: [],
    errors: [],
  })
  
  const uploadQueue = useMemo(
    () => new PQueue({ concurrency: MAX_CONCURRENT_UPLOADS }),
    []
  )
  
  const uploadFiles = useCallback(async (files: File[]) => {
    setState((s) => ({ ...s, status: 'preparing' }))
    
    // Initialize upload state for each file
    const uploadItems: UploadItem[] = files.map((file, i) => ({
      localId: `upload-${Date.now()}-${i}`,
      file,
      status: 'pending',
      progress: 0,
    }))
    
    setState((s) => ({ ...s, uploads: uploadItems }))
    
    // Request signed URLs
    const urlResponse = await generateSignedUploadUrls({
      galleryId,
      files: uploadItems.map((item) => ({
        localId: item.localId,
        mimeType: item.file.type,
        fileSize: item.file.size,
        originalFilename: item.file.name,
      })),
    })
    
    setState((s) => ({ ...s, status: 'uploading' }))
    
    // Queue uploads
    const uploadPromises = urlResponse.uploads.map((urlInfo) => {
      const item = uploadItems.find((u) => u.localId === urlInfo.localId)!
      
      return uploadQueue.add(async () => {
        // Update status to uploading
        setState((s) => ({
          ...s,
          uploads: s.uploads.map((u) =>
            u.localId === urlInfo.localId
              ? { ...u, status: 'uploading' }
              : u
          ),
        }))
        
        try {
          await uploadFileToStorage(
            item.file,
            urlInfo.signedUrl,
            (progress) => {
              setState((s) => ({
                ...s,
                uploads: s.uploads.map((u) =>
                  u.localId === urlInfo.localId
                    ? { ...u, progress }
                    : u
                ),
              }))
            }
          )
          
          // Mark as uploaded
          setState((s) => ({
            ...s,
            uploads: s.uploads.map((u) =>
              u.localId === urlInfo.localId
                ? { ...u, status: 'uploaded', progress: 100 }
                : u
            ),
          }))
          
          return { ...urlInfo, success: true }
        } catch (error) {
          setState((s) => ({
            ...s,
            uploads: s.uploads.map((u) =>
              u.localId === urlInfo.localId
                ? { ...u, status: 'error', error: (error as Error).message }
                : u
            ),
          }))
          
          return { ...urlInfo, success: false, error }
        }
      })
    })
    
    const results = await Promise.all(uploadPromises)
    
    // Confirm successful uploads
    const successfulUploads = results.filter((r) => r.success)
    
    if (successfulUploads.length > 0) {
      await confirmUploads({
        galleryId,
        uploads: successfulUploads.map((r) => {
          const item = uploadItems.find((u) => u.localId === r.localId)!
          return {
            storagePath: r.storagePath,
            token: r.token,
            originalFilename: item.file.name,
            fileSize: item.file.size,
            mimeType: item.file.type,
          }
        }),
      })
    }
    
    setState((s) => ({ ...s, status: 'complete' }))
  }, [galleryId, uploadQueue])
  
  return { state, uploadFiles }
}
```

### XHR Upload with Progress

```typescript
// lib/storage/upload.ts
export function uploadFileToStorage(
  file: File,
  signedUrl: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100)
        onProgress(percent)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed: network error'))
    })
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'))
    })
    
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
```

## 7.8 Post-Upload Database Write Sequence

### Confirmation Flow

```typescript
// server/actions/upload.actions.ts
export async function confirmUploads(request: ConfirmUploadsRequest) {
  const user = await getAuthenticatedUser()
  await verifyGalleryOwnership(request.galleryId, user.id)
  
  const imageIds: string[] = []
  
  // Process uploads sequentially to maintain order
  for (const upload of request.uploads) {
    // 1. Verify file exists in storage
    const { data: fileData } = await supabaseAdmin.storage
      .from('gallery-images')
      .list(request.galleryId, {
        search: upload.storagePath.split('/').pop(),
      })
    
    if (!fileData || fileData.length === 0) {
      throw new Error(`File not found in storage: ${upload.storagePath}`)
    }
    
    // 2. Insert image record with proper position
    const { data: imageId, error } = await supabaseAdmin.rpc(
      'insert_image_at_position',
      {
        p_gallery_id: request.galleryId,
        p_storage_path: upload.storagePath,
        p_original_filename: upload.originalFilename,
        p_file_size_bytes: upload.fileSize,
        p_mime_type: upload.mimeType,
        p_width: upload.width || null,
        p_height: upload.height || null,
      }
    )
    
    if (error) {
      throw new Error(`Failed to save image record: ${error.message}`)
    }
    
    imageIds.push(imageId)
  }
  
  // 3. Set cover image if none exists
  const { data: gallery } = await supabaseAdmin
    .from('galleries')
    .select('cover_image_id, slug')
    .eq('id', request.galleryId)
    .single()
  
  if (!gallery.cover_image_id && imageIds.length > 0) {
    await supabaseAdmin
      .from('galleries')
      .update({ cover_image_id: imageIds[0] })
      .eq('id', request.galleryId)
  }
  
  // 4. Revalidate paths
  revalidatePath(`/g/${gallery.slug}`)
  revalidatePath(`/gallery/${request.galleryId}/upload`)
  revalidatePath('/')
  
  return { imageIds }
}
```

## 7.9 Error Recovery

### Retry Strategy

```typescript
// components/gallery/ImageUploader.tsx
interface UploadItem {
  localId: string
  file: File
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  progress: number
  error?: string
  retryCount: number
  urlInfo?: UploadUrlInfo
}

const MAX_RETRIES = 3

async function retryUpload(item: UploadItem): Promise<void> {
  if (item.retryCount >= MAX_RETRIES) {
    throw new Error('Maximum retries exceeded')
  }
  
  // Request new signed URL (old one may have expired)
  const [urlInfo] = await generateSignedUploadUrls({
    galleryId,
    files: [{
      localId: item.localId,
      mimeType: item.file.type,
      fileSize: item.file.size,
      originalFilename: item.file.name,
    }],
  }).then(r => r.uploads)
  
  // Attempt upload
  await uploadFileToStorage(item.file, urlInfo.signedUrl, onProgress)
  
  // Confirm
  await confirmUploads({
    galleryId,
    uploads: [{
      storagePath: urlInfo.storagePath,
      token: urlInfo.token,
      originalFilename: item.file.name,
      fileSize: item.file.size,
      mimeType: item.file.type,
    }],
  })
}
```

### Error States

| Error Type | Handling |
|------------|----------|
| Network error | Show retry button, preserve file reference |
| Signed URL expired | Request new URL on retry |
| File too large | Show error, remove from queue |
| Invalid file type | Show error, remove from queue |
| Server error | Show retry button, log error |
| Storage quota exceeded | Show error, notify user |

## 7.10 Race Condition Avoidance

### Image Ordering

The `insert_image_at_position` database function handles ordering atomically:

```sql
CREATE OR REPLACE FUNCTION public.insert_image_at_position(
    p_gallery_id UUID,
    p_storage_path TEXT,
    p_original_filename TEXT,
    p_file_size_bytes BIGINT,
    p_mime_type TEXT,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_next_position INTEGER;
    v_image_id UUID;
BEGIN
    -- Lock the gallery row to prevent concurrent position calculation
    PERFORM id FROM public.galleries WHERE id = p_gallery_id FOR UPDATE;
    
    -- Get next position atomically
    SELECT COALESCE(MAX(position), -1) + 1 INTO v_next_position
    FROM public.images
    WHERE gallery_id = p_gallery_id;
    
    -- Insert with calculated position
    INSERT INTO public.images (
        gallery_id, storage_path, original_filename,
        file_size_bytes, mime_type, width, height, position
    ) VALUES (
        p_gallery_id, p_storage_path, p_original_filename,
        p_file_size_bytes, p_mime_type, p_width, p_height, v_next_position
    )
    RETURNING id INTO v_image_id;
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;
```

### Concurrent Upload Handling

- Signed URLs are unique per file (UUID in path)
- Database inserts use atomic position calculation
- Confirmation processes uploads sequentially within a batch
- Multiple concurrent batches are safe due to row-level locking

### Cover Image Race Condition

```typescript
// Atomic cover image update
const { error } = await supabaseAdmin
  .from('galleries')
  .update({ cover_image_id: imageIds[0] })
  .eq('id', request.galleryId)
  .is('cover_image_id', null)  // Only update if null

// No error if another process already set it
```
