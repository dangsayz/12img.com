# 13. Performance Optimization Checklist

## 13.1 Vercel Edge Caching

### Cache Configuration by Route

| Route | Strategy | Headers |
|-------|----------|---------|
| `/` (Dashboard) | No cache | `Cache-Control: private, no-store` |
| `/g/[slug]` | ISR 60s | `Cache-Control: public, s-maxage=60, stale-while-revalidate` |
| `/settings` | No cache | `Cache-Control: private, no-store` |
| `/gallery/*` | No cache | `Cache-Control: private, no-store` |
| Static assets | Immutable | `Cache-Control: public, max-age=31536000, immutable` |

### Implementation

```typescript
// app/g/[galleryId]/page.tsx
export const revalidate = 60  // ISR: revalidate every 60 seconds

// app/page.tsx (Dashboard)
export const dynamic = 'force-dynamic'  // No caching

// app/settings/page.tsx
export const dynamic = 'force-dynamic'
```

### Cache Invalidation

```typescript
// server/actions/image.actions.ts
import { revalidatePath, revalidateTag } from 'next/cache'

export async function deleteImage(imageId: string) {
  // ... delete logic ...

  // Invalidate gallery page cache
  revalidatePath(`/g/${gallery.slug}`)

  // Invalidate dashboard
  revalidatePath('/')
}

export async function confirmUploads(request: ConfirmUploadsRequest) {
  // ... upload logic ...

  // Invalidate caches
  revalidatePath(`/g/${gallery.slug}`)
  revalidatePath(`/gallery/${request.galleryId}/upload`)
  revalidatePath('/')
}
```

## 13.2 RSC Streaming

### Streaming Architecture

```typescript
// app/g/[galleryId]/page.tsx
import { Suspense } from 'react'

export default async function GalleryPage({ params }: Props) {
  // Fast: Gallery metadata (streams first)
  const gallery = await getGalleryBySlug(params.galleryId)

  if (!gallery) notFound()

  return (
    <>
      {/* Immediate render */}
      <GalleryHeader title={gallery.title} />

      {/* Streams when ready */}
      <Suspense fallback={<GalleryGridSkeleton />}>
        <GalleryImages galleryId={gallery.id} />
      </Suspense>

      {/* Streams independently */}
      {gallery.download_enabled && (
        <Suspense fallback={null}>
          <DownloadSection galleryId={gallery.id} />
        </Suspense>
      )}
    </>
  )
}

// Separate async component for parallel streaming
async function GalleryImages({ galleryId }: { galleryId: string }) {
  const images = await getGalleryImages(galleryId)
  const signedUrls = await getSignedUrlsBatch(
    images.map(img => img.storage_path)
  )

  return <MasonryGrid images={images} signedUrls={signedUrls} />
}
```

### Streaming Benefits

- **TTFB**: Header renders immediately
- **Progressive**: Content appears as data loads
- **Parallel**: Independent suspense boundaries load concurrently

## 13.3 Bundle Size Reduction

### Dynamic Imports

```typescript
// components/gallery/MasonryGrid.tsx
import dynamic from 'next/dynamic'

// Lazy load fullscreen viewer (not needed on initial render)
const FullscreenViewer = dynamic(
  () => import('./FullscreenViewer').then(mod => mod.FullscreenViewer),
  {
    loading: () => null,
    ssr: false,  // Client-only component
  }
)
```

### Tree Shaking

```typescript
// ❌ Bad: Imports entire library
import _ from 'lodash'
const slug = _.kebabCase(title)

// ✅ Good: Import only what's needed
import kebabCase from 'lodash/kebabCase'
const slug = kebabCase(title)

// ✅ Better: Use native or smaller alternative
import slugify from 'slugify'
const slug = slugify(title, { lower: true })
```

### Package Analysis

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

```typescript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer({
  // config
})
```

### Minimal Dependencies

| Category | Package | Size |
|----------|---------|------|
| UI | Tailwind CSS | 0 runtime |
| Icons | Lucide React | Tree-shakeable |
| Forms | Zod | ~12KB |
| ID Generation | nanoid | ~1KB |
| Hashing | bcryptjs | ~15KB |
| Queue | p-queue | ~3KB |

## 13.4 Image Lazy Loading

### Native Lazy Loading

```tsx
// components/gallery/MasonryItem.tsx
<img
  src={signedUrl}
  alt=""
  loading="lazy"           // Native lazy loading
  decoding="async"         // Non-blocking decode
  fetchPriority="low"      // Lower priority for off-screen
/>
```

### Above-the-Fold Optimization

```tsx
// components/gallery/MasonryGrid.tsx
{images.map((image, index) => (
  <MasonryItem
    key={image.id}
    image={image}
    // First 4 images load eagerly (above fold)
    priority={index < 4}
  />
))}

// components/gallery/MasonryItem.tsx
interface MasonryItemProps {
  image: Image
  priority?: boolean
}

export function MasonryItem({ image, priority = false }: MasonryItemProps) {
  return (
    <img
      src={image.signedUrl}
      alt=""
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
```

### Placeholder Strategy

```tsx
// components/gallery/MasonryItem.tsx
export function MasonryItem({ image }: MasonryItemProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="masonry-item relative">
      {/* Placeholder */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-gray-100 animate-pulse"
          style={{
            aspectRatio: image.width && image.height
              ? `${image.width}/${image.height}`
              : '1/1',
          }}
        />
      )}

      {/* Actual image */}
      <img
        src={image.signedUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-auto ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ transition: 'opacity 0.3s ease' }}
      />
    </div>
  )
}
```

## 13.5 Parallel Data Fetching

### Parallel Queries in RSC

```typescript
// app/page.tsx (Dashboard)
export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')

  // Parallel fetch
  const [galleries, settings] = await Promise.all([
    getUserGalleries(userId),
    getUserSettings(userId),
  ])

  return <DashboardContent galleries={galleries} settings={settings} />
}
```

### Parallel Signed URL Generation

```typescript
// server/queries/gallery.queries.ts
export async function getUserGalleries(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) return []

  const { data: galleries } = await supabaseAdmin
    .from('galleries')
    .select(`
      id, title, slug, password_hash, download_enabled,
      created_at, updated_at,
      cover_image:images!cover_image_id(id, storage_path),
      images(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Batch signed URL generation (single API call)
  const coverPaths = galleries
    .filter(g => g.cover_image)
    .map(g => g.cover_image!.storage_path)

  const signedUrls = coverPaths.length > 0
    ? await getSignedUrlsBatch(coverPaths)  // Single batch call
    : new Map()

  return galleries.map(g => ({
    ...g,
    coverImageUrl: g.cover_image
      ? signedUrls.get(g.cover_image.storage_path)
      : null,
  }))
}
```

### Supabase Batch Operations

```typescript
// lib/storage/signed-urls.ts
export async function getSignedUrlsBatch(
  paths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map()

  // Supabase supports batch signed URL creation
  const { data, error } = await supabaseAdmin.storage
    .from('gallery-images')
    .createSignedUrls(paths, expiresIn)

  if (error) throw error

  const urlMap = new Map<string, string>()
  for (const item of data) {
    if (item.signedUrl) {
      urlMap.set(item.path, item.signedUrl)
    }
  }

  return urlMap
}
```

## 13.6 Suspense Segmentation

### Optimal Boundaries

```typescript
// app/g/[galleryId]/page.tsx
export default async function GalleryPage({ params }: Props) {
  const gallery = await getGalleryBySlug(params.galleryId)

  return (
    <main>
      {/* No suspense - renders immediately */}
      <GalleryHeader title={gallery.title} />

      {/* Suspense boundary 1: Main content */}
      <Suspense fallback={<GalleryGridSkeleton />}>
        <GalleryContent galleryId={gallery.id} />
      </Suspense>

      {/* Suspense boundary 2: Secondary content */}
      <Suspense fallback={null}>
        <GalleryFooter gallery={gallery} />
      </Suspense>
    </main>
  )
}
```

### Avoid Over-Segmentation

```typescript
// ❌ Bad: Too many suspense boundaries
{images.map(image => (
  <Suspense key={image.id} fallback={<Skeleton />}>
    <ImageCard image={image} />
  </Suspense>
))}

// ✅ Good: Single boundary for the list
<Suspense fallback={<GridSkeleton />}>
  <ImageGrid images={images} />
</Suspense>
```

## 13.7 SQL Indexing Strategy

### Index Definitions

```sql
-- Primary access patterns

-- Users: Lookup by Clerk ID
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);

-- Galleries: User's galleries sorted by date
CREATE INDEX idx_galleries_user_id ON public.galleries(user_id);
CREATE INDEX idx_galleries_created_at ON public.galleries(created_at DESC);

-- Galleries: Public lookup by slug
CREATE UNIQUE INDEX idx_galleries_slug ON public.galleries(slug);

-- Images: Gallery's images sorted by position
CREATE INDEX idx_images_gallery_id ON public.images(gallery_id);
CREATE INDEX idx_images_gallery_position ON public.images(gallery_id, position);

-- Images: Unique storage path
CREATE UNIQUE INDEX idx_images_storage_path ON public.images(storage_path);
```

### Query Optimization

```sql
-- Dashboard query (uses idx_galleries_user_id, idx_galleries_created_at)
SELECT g.*, 
       (SELECT COUNT(*) FROM images WHERE gallery_id = g.id) as image_count
FROM galleries g
WHERE g.user_id = $1
ORDER BY g.created_at DESC;

-- Gallery view query (uses idx_galleries_slug)
SELECT * FROM galleries WHERE slug = $1;

-- Gallery images query (uses idx_images_gallery_position)
SELECT * FROM images
WHERE gallery_id = $1
ORDER BY position ASC;
```

### Index Monitoring

```sql
-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Find missing indexes
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND seq_scan > idx_scan
ORDER BY seq_tup_read DESC;
```

## 13.8 Performance Monitoring

### Core Web Vitals Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| LCP | < 2.5s | Largest image load |
| FID | < 100ms | First interaction delay |
| CLS | < 0.1 | Layout shift score |
| TTFB | < 800ms | Server response time |

### Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Performance Checklist

- [ ] Images use `loading="lazy"` except above-fold
- [ ] First 4 gallery images have `priority`
- [ ] Suspense boundaries for async content
- [ ] Parallel data fetching where possible
- [ ] Batch signed URL generation
- [ ] Database indexes on query columns
- [ ] Dynamic imports for heavy components
- [ ] Bundle analyzer run before deploy
- [ ] Core Web Vitals monitored in production
