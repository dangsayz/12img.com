# 4. Image Storage & Optimization Architecture

## 4.1 Bucket Configuration

### Bucket Name
```
gallery-images
```

### Bucket Settings
| Setting | Value |
|---------|-------|
| Public | `false` |
| File size limit | 25 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |

### Bucket Creation (Supabase Dashboard or SQL)
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery-images',
    'gallery-images',
    false,
    26214400,  -- 25 MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

## 4.2 Path Schema

### Storage Path Format
```
{gallery_id}/{image_id}.{extension}
```

### Examples
```
550e8400-e29b-41d4-a716-446655440000/7c9e6679-7425-40de-944b-e07fc1f90ae7.jpg
550e8400-e29b-41d4-a716-446655440000/8f14e45f-ceea-467f-a8f8-2167e7a9e7a2.png
```

### Path Components

| Component | Source | Format |
|-----------|--------|--------|
| `gallery_id` | `galleries.id` | UUID v4 |
| `image_id` | Generated at upload | UUID v4 |
| `extension` | Derived from MIME type | `jpg`, `png`, `webp`, `gif` |

### Extension Mapping
```typescript
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
```

## 4.3 Image File Naming

### Naming Strategy
- **Original filename**: Stored in `images.original_filename` for reference
- **Storage filename**: UUID-based to prevent collisions and path traversal

### Generation Logic
```typescript
// lib/storage/upload.ts
import { v4 as uuidv4 } from 'uuid'

export function generateStoragePath(
  galleryId: string,
  mimeType: string
): string {
  const imageId = uuidv4()
  const ext = MIME_TO_EXT[mimeType]
  if (!ext) throw new Error(`Unsupported MIME type: ${mimeType}`)
  return `${galleryId}/${imageId}.${ext}`
}
```

## 4.4 Signed URL Configuration

### URL Durations

| Context | Duration | Rationale |
|---------|----------|-----------|
| Gallery view (display) | 3600s (1 hour) | Long enough for viewing session |
| Upload (PUT) | 300s (5 minutes) | Short for security, long enough for slow connections |
| Download (GET) | 3600s (1 hour) | Same as display |

### Signed URL Generation

```typescript
// lib/storage/signed-urls.ts
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getSignedDownloadUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrl(storagePath, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

export async function getSignedUploadUrl(
  storagePath: string,
  expiresIn: number = 300
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUploadUrl(storagePath)

  if (error) {
    throw new Error(`Failed to create upload URL: ${error.message}`)
  }

  return data.signedUrl
}

export async function getSignedUrlsBatch(
  storagePaths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const results = new Map<string, string>()
  
  // Supabase supports batch signed URL generation
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrls(storagePaths, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URLs: ${error.message}`)
  }

  for (const item of data) {
    if (item.signedUrl) {
      results.set(item.path, item.signedUrl)
    }
  }

  return results
}
```

## 4.5 Access Control

### Public vs Private

| Access Type | Implementation |
|-------------|----------------|
| Public bucket | ❌ Not used |
| Private bucket + signed URLs | ✅ Used |

### Access Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Client requests gallery view                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Server (RSC) checks:                                         │
│   1. Gallery exists?                                         │
│   2. Password required? → Redirect to password page          │
│   3. Password cookie valid? → Proceed                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Server generates signed URLs for all images                  │
│   - Uses service role key (bypasses RLS)                     │
│   - URLs valid for 1 hour                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Client receives signed URLs in props                         │
│   - Renders images directly from Supabase Storage            │
│   - No additional auth needed for image requests             │
└─────────────────────────────────────────────────────────────┘
```

## 4.6 Upload Workflow

### Client → Server → Supabase Flow

```typescript
// Step 1: Client prepares files
interface FileToUpload {
  file: File
  localId: string  // For tracking
}

// Step 2: Client requests signed upload URLs
// server/actions/upload.actions.ts
'use server'

import { auth } from '@clerk/nextjs'
import { generateStoragePath } from '@/lib/storage/upload'
import { getSignedUploadUrl } from '@/lib/storage/signed-urls'

interface UploadUrlRequest {
  galleryId: string
  files: Array<{
    localId: string
    mimeType: string
    fileSize: number
    originalFilename: string
  }>
}

interface UploadUrlResponse {
  localId: string
  storagePath: string
  signedUrl: string
  token: string  // For confirmation
}

export async function generateSignedUploadUrls(
  request: UploadUrlRequest
): Promise<UploadUrlResponse[]> {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')

  // Verify gallery ownership
  const gallery = await verifyGalleryOwnership(request.galleryId, userId)
  if (!gallery) throw new Error('Gallery not found')

  const responses: UploadUrlResponse[] = []

  for (const file of request.files) {
    // Validate
    if (file.fileSize > 25 * 1024 * 1024) {
      throw new Error(`File too large: ${file.originalFilename}`)
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new Error(`Invalid file type: ${file.mimeType}`)
    }

    const storagePath = generateStoragePath(request.galleryId, file.mimeType)
    const signedUrl = await getSignedUploadUrl(storagePath)
    const token = generateUploadToken(storagePath, file)

    responses.push({
      localId: file.localId,
      storagePath,
      signedUrl,
      token,
    })
  }

  return responses
}

// Step 3: Client uploads directly to Supabase Storage
// components/gallery/ImageUploader.tsx
async function uploadFile(
  file: File,
  signedUrl: string,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress((e.loaded / e.total) * 100)
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    })
    
    xhr.addEventListener('error', () => reject(new Error('Upload failed')))
    
    xhr.open('PUT', signedUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

// Step 4: Client confirms uploads
// server/actions/upload.actions.ts
interface ConfirmUploadRequest {
  galleryId: string
  uploads: Array<{
    storagePath: string
    token: string
    originalFilename: string
    fileSize: number
    mimeType: string
    width?: number
    height?: number
  }>
}

export async function confirmUploads(
  request: ConfirmUploadRequest
): Promise<{ imageIds: string[] }> {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')

  // Verify gallery ownership
  await verifyGalleryOwnership(request.galleryId, userId)

  const imageIds: string[] = []

  for (const upload of request.uploads) {
    // Verify token
    if (!verifyUploadToken(upload.token, upload.storagePath)) {
      throw new Error('Invalid upload token')
    }

    // Verify file exists in storage
    const exists = await verifyFileExists(upload.storagePath)
    if (!exists) {
      throw new Error(`File not found: ${upload.storagePath}`)
    }

    // Insert into database
    const imageId = await supabase.rpc('insert_image_at_position', {
      p_gallery_id: request.galleryId,
      p_storage_path: upload.storagePath,
      p_original_filename: upload.originalFilename,
      p_file_size_bytes: upload.fileSize,
      p_mime_type: upload.mimeType,
      p_width: upload.width,
      p_height: upload.height,
    })

    imageIds.push(imageId)
  }

  // Revalidate gallery page
  revalidatePath(`/g/${request.galleryId}`)

  return { imageIds }
}
```

## 4.7 Upload Concurrency Limits

### Client-Side Throttling

```typescript
// lib/hooks/use-upload.ts
import PQueue from 'p-queue'

const MAX_CONCURRENT_UPLOADS = 3
const uploadQueue = new PQueue({ concurrency: MAX_CONCURRENT_UPLOADS })

export function useUpload() {
  const [uploads, setUploads] = useState<UploadState[]>([])

  const uploadFiles = async (files: File[], galleryId: string) => {
    // Request signed URLs for all files
    const urlResponses = await generateSignedUploadUrls({
      galleryId,
      files: files.map((f, i) => ({
        localId: `upload-${i}`,
        mimeType: f.type,
        fileSize: f.size,
        originalFilename: f.name,
      })),
    })

    // Queue uploads with concurrency limit
    const uploadPromises = urlResponses.map((response, i) =>
      uploadQueue.add(async () => {
        setUploads((prev) =>
          prev.map((u) =>
            u.localId === response.localId
              ? { ...u, status: 'uploading' }
              : u
          )
        )

        await uploadFile(files[i], response.signedUrl, (percent) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.localId === response.localId
                ? { ...u, progress: percent }
                : u
            )
          )
        })

        return response
      })
    )

    const completed = await Promise.all(uploadPromises)

    // Confirm all uploads
    await confirmUploads({
      galleryId,
      uploads: completed.map((r, i) => ({
        storagePath: r.storagePath,
        token: r.token,
        originalFilename: files[i].name,
        fileSize: files[i].size,
        mimeType: files[i].type,
      })),
    })
  }

  return { uploads, uploadFiles }
}
```

## 4.8 Thumbnail Generation

### Strategy: None

No server-side thumbnail generation for MVP.

**Rationale:**
- Photographers upload optimized exports
- Modern browsers handle large images efficiently
- Adds complexity and cost
- Lazy loading handles perceived performance

### Client-Side Display Optimization

```css
/* styles/masonry.css */
.masonry-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  background-color: #f0f0f0; /* Placeholder color */
}
```

```tsx
// components/gallery/MasonryItem.tsx
<img
  src={signedUrl}
  alt=""
  loading="lazy"
  decoding="async"
  className="masonry-image"
/>
```

## 4.9 Caching Headers

### Supabase Storage Default Headers

Supabase Storage sets appropriate cache headers automatically:
- `Cache-Control: public, max-age=3600` for signed URLs

### Vercel Edge Caching

Images served via signed URLs are not cached at Vercel edge (different origin).

### Browser Caching

Signed URLs include query parameters that change on regeneration, so browser cache is effectively per-session.

## 4.10 File Deletion

### Cascade Delete Flow

```typescript
// server/actions/image.actions.ts
export async function deleteImage(imageId: string): Promise<void> {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')

  // Get image with gallery ownership check
  const image = await getImageWithOwnershipCheck(imageId, userId)
  if (!image) throw new Error('Image not found')

  // Delete from storage first
  const { error: storageError } = await supabaseAdmin.storage
    .from('gallery-images')
    .remove([image.storage_path])

  if (storageError) {
    throw new Error(`Failed to delete file: ${storageError.message}`)
  }

  // Delete from database
  const { error: dbError } = await supabaseAdmin
    .from('images')
    .delete()
    .eq('id', imageId)

  if (dbError) {
    throw new Error(`Failed to delete record: ${dbError.message}`)
  }

  // Revalidate gallery
  revalidatePath(`/g/${image.gallery_id}`)
}
```

### Gallery Deletion

When a gallery is deleted:
1. Database CASCADE deletes all `images` rows
2. Server action must also delete storage files

```typescript
// server/actions/gallery.actions.ts
export async function deleteGallery(galleryId: string): Promise<void> {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')

  // Verify ownership
  const gallery = await verifyGalleryOwnership(galleryId, userId)
  if (!gallery) throw new Error('Gallery not found')

  // Get all image paths
  const { data: images } = await supabaseAdmin
    .from('images')
    .select('storage_path')
    .eq('gallery_id', galleryId)

  // Delete all files from storage
  if (images && images.length > 0) {
    const paths = images.map((img) => img.storage_path)
    await supabaseAdmin.storage.from('gallery-images').remove(paths)
  }

  // Delete gallery (cascades to images table)
  await supabaseAdmin.from('galleries').delete().eq('id', galleryId)

  // Revalidate dashboard
  revalidatePath('/')
}
```
