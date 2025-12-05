# 1. System Architecture Overview

## 1.1 Component Rendering Strategy

### React Server Components (RSC) vs Client Components

| Component Type | Rendering | Use Case |
|----------------|-----------|----------|
| RSC (default) | Server | Data fetching, DB queries, auth checks, layout shells |
| Client (`'use client'`) | Client | Interactivity, gestures, state, browser APIs |

**RSC Components:**
- `app/page.tsx` - Dashboard
- `app/g/[galleryId]/page.tsx` - Gallery view (data fetch layer)
- `app/settings/page.tsx` - Settings form container
- `app/gallery/create/page.tsx` - Create gallery form container
- All `layout.tsx` files

**Client Components:**
- `components/gallery/MasonryGrid.tsx` - Masonry layout with resize observers
- `components/gallery/FullscreenViewer.tsx` - Swipe/zoom gestures
- `components/gallery/ImageUploader.tsx` - File input, drag-drop, progress
- `components/gallery/PasswordForm.tsx` - Password input with submit
- `components/ui/*` - Interactive UI primitives

### Server Actions

Server Actions handle all mutations. Located in `/server/actions/`.

```
/server/actions/
  gallery.actions.ts    # createGallery, updateGallery, deleteGallery
  image.actions.ts      # deleteImage, reorderImages, setCoverImage
  settings.actions.ts   # updateUserSettings
  upload.actions.ts     # generateSignedUploadUrl, confirmUpload
  auth.actions.ts       # validateGalleryPassword
```

**Invocation Pattern:**
```typescript
// Client component
'use client'
import { createGallery } from '@/server/actions/gallery.actions'

// Form submission
const formAction = async (formData: FormData) => {
  const result = await createGallery(formData)
  if (result.error) { /* handle */ }
  router.push(`/gallery/${result.galleryId}/upload`)
}
```

## 1.2 API Boundaries

### No Traditional API Routes Required

All data mutations use Server Actions. No `/api/*` routes needed except:

| Route | Purpose |
|-------|---------|
| `/api/webhook/clerk` | Clerk user sync webhook |

### Data Flow Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │ MasonryGrid │    │  Uploader   │    │   Forms     │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │              │
│         │ props            │ Server Action    │ Server Action│
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVER (RSC / Actions)                   │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  page.tsx   │    │  actions/*  │    │  actions/*  │      │
│  │  (fetch)    │    │  (mutate)   │    │  (mutate)   │      │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘      │
│         │                  │                  │              │
│         │ supabase-js      │ supabase-js      │ supabase-js  │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Postgres   │    │   Storage   │    │     RLS     │      │
│  └─────────────┘    └─────────────┘    └─────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 1.3 Image Processing Strategy

### No Server-Side Processing

Images are stored as-is. No resizing, no thumbnails, no transformations.

**Rationale:** Photographers upload final exports. Processing adds latency and cost.

**Client-Side Optimization:**
- Native `<img loading="lazy">` for viewport-based loading
- `srcset` not used (single resolution per image)
- CSS `object-fit: contain` for display scaling

### Signed URL Strategy

All image access uses time-limited signed URLs.

| Context | URL Type | Duration |
|---------|----------|----------|
| Gallery view (authenticated owner) | Signed | 1 hour |
| Gallery view (public/password-unlocked) | Signed | 1 hour |
| Upload presigned URL | Signed PUT | 5 minutes |

**Generation Flow:**
```typescript
// server/lib/storage.ts
export async function getSignedImageUrl(
  path: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .storage
    .from('gallery-images')
    .createSignedUrl(path, expiresIn)
  
  if (error) throw new StorageError(error.message)
  return data.signedUrl
}
```

## 1.4 SSR vs CSR Boundaries

### SSR (Server-Side Rendering)

| Route | SSR Strategy |
|-------|--------------|
| `/` (Dashboard) | Full SSR, no cache |
| `/g/[galleryId]` | SSR with revalidation |
| `/settings` | Full SSR, no cache |
| `/gallery/create` | Static shell, client form |

### CSR (Client-Side Rendering)

| Component | CSR Reason |
|-----------|------------|
| `MasonryGrid` | ResizeObserver, dynamic column calculation |
| `FullscreenViewer` | Touch events, gesture handling |
| `ImageUploader` | File API, XHR progress |
| `PasswordForm` | Form state, error display |

### Hydration Boundary

```tsx
// app/g/[galleryId]/page.tsx (RSC)
export default async function GalleryPage({ params }) {
  const gallery = await getGallery(params.galleryId)
  const images = await getGalleryImages(params.galleryId)
  const signedUrls = await Promise.all(
    images.map(img => getSignedImageUrl(img.storage_path))
  )
  
  // Hydration boundary - client takes over
  return (
    <GalleryShell gallery={gallery}>
      <MasonryGrid images={images} signedUrls={signedUrls} />
    </GalleryShell>
  )
}
```

## 1.5 Edge Caching Strategy

### Vercel Edge Caching

| Route | Cache Strategy |
|-------|----------------|
| `/` | `no-store` (always fresh) |
| `/g/[galleryId]` | `revalidate: 60` (ISR 60s) |
| `/settings` | `no-store` |
| Static assets | Immutable, 1 year |

**Implementation:**
```typescript
// app/g/[galleryId]/page.tsx
export const revalidate = 60 // ISR: revalidate every 60 seconds

// For dynamic routes that must be fresh:
export const dynamic = 'force-dynamic'
```

### Cache Invalidation

On gallery update (add/delete image, settings change):
```typescript
// server/actions/image.actions.ts
import { revalidatePath } from 'next/cache'

export async function deleteImage(imageId: string) {
  // ... delete logic
  revalidatePath(`/g/${galleryId}`)
}
```

## 1.6 Security Layers

### Layer 1: Middleware (Route Protection)
```typescript
// middleware.ts
- Clerk authMiddleware protects /dashboard, /settings, /gallery/*
- Public routes: /g/*, /sign-in, /sign-up
```

### Layer 2: Server Action Auth
```typescript
// Every server action validates auth
const { userId } = auth()
if (!userId) throw new AuthError('Unauthorized')
```

### Layer 3: Row Level Security (RLS)
```sql
-- All DB queries filtered by user_id
USING (user_id = auth.uid())
```

### Layer 4: Signed URLs
```typescript
// Storage access requires valid signature
createSignedUrl(path, expiresIn)
```

## 1.7 Upload Transport Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│ 1. Client: User selects files                                     │
│    └─> Validate: type (image/*), size (<25MB), count (<100)      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 2. Client: Request signed URLs (batch)                           │
│    └─> Server Action: generateSignedUploadUrls(galleryId, files) │
│        └─> Returns: [{ path, signedUrl, token }]                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 3. Client: Direct upload to Supabase Storage                     │
│    └─> PUT to signedUrl with file body                           │
│    └─> Parallel uploads (max 3 concurrent)                       │
│    └─> Progress tracking per file                                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│ 4. Client: Confirm uploads (batch)                               │
│    └─> Server Action: confirmUploads(galleryId, uploadedPaths)   │
│        └─> Insert rows into `images` table                       │
│        └─> Verify files exist in storage                         │
│        └─> revalidatePath(`/g/${galleryId}`)                     │
└──────────────────────────────────────────────────────────────────┘
```

## 1.8 Concurrent Request Handling

### Database Connection Pooling

Supabase handles connection pooling via PgBouncer. No client-side pooling needed.

```typescript
// lib/supabase/server.ts
// Creates new client per request (stateless)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

### Upload Concurrency

Client-side throttling prevents overwhelming storage:
```typescript
// components/gallery/ImageUploader.tsx
const MAX_CONCURRENT_UPLOADS = 3
const uploadQueue = new PQueue({ concurrency: MAX_CONCURRENT_UPLOADS })
```

### Race Condition Prevention

**Image ordering:** Use `position` column with transaction:
```typescript
// server/actions/image.actions.ts
await supabase.rpc('insert_image_at_position', {
  p_gallery_id: galleryId,
  p_storage_path: path,
  p_position: position
})
```

**Gallery deletion:** CASCADE deletes handle child records atomically.
