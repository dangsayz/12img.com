# 10. Dashboard Engineering Checklist

## 10.1 Pagination

### Strategy: Cursor-Based Pagination

**Decision:** Cursor-based (keyset) pagination over offset pagination.

**Rationale:**
- Stable results when galleries are added/deleted
- Better performance for large datasets
- No "page drift" issues

### Implementation

```typescript
// server/queries/gallery.queries.ts
interface PaginationParams {
  cursor?: string  // Gallery ID
  limit?: number
}

interface PaginatedGalleries {
  galleries: Gallery[]
  nextCursor: string | null
  hasMore: boolean
}

export async function getUserGalleriesPaginated(
  clerkId: string,
  params: PaginationParams = {}
): Promise<PaginatedGalleries> {
  const { cursor, limit = 20 } = params
  
  const user = await getUserByClerkId(clerkId)
  if (!user) return { galleries: [], nextCursor: null, hasMore: false }
  
  let query = supabaseAdmin
    .from('galleries')
    .select(`
      id,
      title,
      slug,
      password_hash,
      download_enabled,
      created_at,
      updated_at,
      cover_image:images!cover_image_id(id, storage_path),
      image_count:images(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1)  // Fetch one extra to check hasMore
  
  if (cursor) {
    // Get cursor gallery's created_at
    const { data: cursorGallery } = await supabaseAdmin
      .from('galleries')
      .select('created_at')
      .eq('id', cursor)
      .single()
    
    if (cursorGallery) {
      query = query.lt('created_at', cursorGallery.created_at)
    }
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  const hasMore = data.length > limit
  const galleries = hasMore ? data.slice(0, -1) : data
  const nextCursor = hasMore ? galleries[galleries.length - 1].id : null
  
  // Generate signed URLs for cover images
  const galleriesWithUrls = await Promise.all(
    galleries.map(async (gallery) => ({
      ...gallery,
      coverImageUrl: gallery.cover_image
        ? await getSignedDownloadUrl(gallery.cover_image.storage_path)
        : null,
      imageCount: gallery.image_count?.[0]?.count || 0,
      hasPassword: !!gallery.password_hash,
    }))
  )
  
  return {
    galleries: galleriesWithUrls,
    nextCursor,
    hasMore,
  }
}
```

### Client-Side Infinite Scroll

```typescript
// components/gallery/GalleryGrid.tsx
'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'
import { loadMoreGalleries } from '@/server/actions/gallery.actions'

interface GalleryGridProps {
  initialGalleries: Gallery[]
  initialCursor: string | null
  initialHasMore: boolean
}

export function GalleryGrid({
  initialGalleries,
  initialCursor,
  initialHasMore,
}: GalleryGridProps) {
  const [galleries, setGalleries] = useState(initialGalleries)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [isLoading, setIsLoading] = useState(false)
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })
  
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore || !cursor) return
    
    setIsLoading(true)
    
    try {
      const result = await loadMoreGalleries(cursor)
      setGalleries(prev => [...prev, ...result.galleries])
      setCursor(result.nextCursor)
      setHasMore(result.hasMore)
    } finally {
      setIsLoading(false)
    }
  }, [cursor, hasMore, isLoading])
  
  useEffect(() => {
    if (inView) {
      loadMore()
    }
  }, [inView, loadMore])
  
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {galleries.map((gallery) => (
          <GalleryCard key={gallery.id} gallery={gallery} />
        ))}
      </div>
      
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoading && <LoadingSpinner />}
        </div>
      )}
    </>
  )
}
```

### Alternative: Simple Pagination (MVP)

For MVP with fewer galleries, simple "Load More" button:

```typescript
// app/page.tsx
export default async function DashboardPage() {
  const { userId } = auth()
  if (!userId) redirect('/sign-in')
  
  // Load all galleries (reasonable for MVP)
  const galleries = await getUserGalleries(userId)
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My Galleries</h1>
          <Link href="/gallery/create" className="btn-primary">
            Create Gallery
          </Link>
        </div>
        
        {galleries.length === 0 ? (
          <EmptyGallery />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((gallery) => (
              <GalleryCard key={gallery.id} gallery={gallery} />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
```

## 10.2 Sorting

### Sort Options

| Option | Column | Direction |
|--------|--------|-----------|
| Newest first (default) | `created_at` | DESC |
| Oldest first | `created_at` | ASC |
| Recently updated | `updated_at` | DESC |
| Alphabetical | `title` | ASC |

### Implementation

```typescript
// server/queries/gallery.queries.ts
type SortOption = 'newest' | 'oldest' | 'updated' | 'alphabetical'

const SORT_CONFIG: Record<SortOption, { column: string; ascending: boolean }> = {
  newest: { column: 'created_at', ascending: false },
  oldest: { column: 'created_at', ascending: true },
  updated: { column: 'updated_at', ascending: false },
  alphabetical: { column: 'title', ascending: true },
}

export async function getUserGalleries(
  clerkId: string,
  sort: SortOption = 'newest'
): Promise<Gallery[]> {
  const user = await getUserByClerkId(clerkId)
  if (!user) return []
  
  const { column, ascending } = SORT_CONFIG[sort]
  
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select(`
      id, title, slug, password_hash, download_enabled,
      created_at, updated_at,
      cover_image:images!cover_image_id(id, storage_path),
      image_count:images(count)
    `)
    .eq('user_id', user.id)
    .order(column, { ascending })
  
  if (error) throw error
  
  // ... process and return
}
```

### URL-Based Sort State

```typescript
// app/page.tsx
interface DashboardPageProps {
  searchParams: { sort?: string }
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const sort = (searchParams.sort as SortOption) || 'newest'
  const galleries = await getUserGalleries(userId, sort)
  
  return (
    // ...
    <SortDropdown currentSort={sort} />
    // ...
  )
}

// components/gallery/SortDropdown.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function SortDropdown({ currentSort }: { currentSort: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', e.target.value)
    router.push(`/?${params.toString()}`)
  }
  
  return (
    <select value={currentSort} onChange={handleChange} className="...">
      <option value="newest">Newest first</option>
      <option value="oldest">Oldest first</option>
      <option value="updated">Recently updated</option>
      <option value="alphabetical">Alphabetical</option>
    </select>
  )
}
```

## 10.3 Fetch Pattern

### Server Component Data Fetching

```typescript
// app/page.tsx
export const dynamic = 'force-dynamic'  // Always fresh data

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Single database query with joins
  const galleries = await getUserGalleries(userId)
  
  return <DashboardContent galleries={galleries} />
}
```

### Query Optimization

```typescript
// server/queries/gallery.queries.ts
export async function getUserGalleries(clerkId: string): Promise<Gallery[]> {
  const user = await getUserByClerkId(clerkId)
  if (!user) return []
  
  // Single query with all needed data
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select(`
      id,
      title,
      slug,
      password_hash,
      download_enabled,
      created_at,
      updated_at,
      cover_image:images!cover_image_id(
        id,
        storage_path
      ),
      images(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Batch signed URL generation
  const coverPaths = data
    .filter(g => g.cover_image)
    .map(g => g.cover_image!.storage_path)
  
  const signedUrls = coverPaths.length > 0
    ? await getSignedUrlsBatch(coverPaths)
    : new Map()
  
  return data.map(gallery => ({
    id: gallery.id,
    title: gallery.title,
    slug: gallery.slug,
    hasPassword: !!gallery.password_hash,
    downloadEnabled: gallery.download_enabled,
    createdAt: gallery.created_at,
    updatedAt: gallery.updated_at,
    coverImageUrl: gallery.cover_image
      ? signedUrls.get(gallery.cover_image.storage_path) || null
      : null,
    imageCount: gallery.images?.[0]?.count || 0,
  }))
}
```

## 10.4 Stale-While-Revalidate

### Not Used for Dashboard

**Decision:** Dashboard uses `force-dynamic` instead of SWR/ISR.

**Rationale:**
- Dashboard shows user's own data, should be fresh
- Gallery list changes frequently (create, delete, upload)
- No benefit to caching personalized data

### Cache Headers

```typescript
// app/page.tsx
export const dynamic = 'force-dynamic'
export const revalidate = 0  // No caching
```

## 10.5 Optimistic Delete

### Delete Flow

```typescript
// components/gallery/GalleryCard.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteGallery } from '@/server/actions/gallery.actions'

export function GalleryCard({ gallery }: { gallery: Gallery }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDeleted, setIsDeleted] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  const handleDelete = () => {
    // Optimistic update
    setIsDeleted(true)
    setShowConfirm(false)
    
    startTransition(async () => {
      const result = await deleteGallery(gallery.id)
      
      if (result.error) {
        // Revert optimistic update
        setIsDeleted(false)
        // Show error toast
        toast.error(result.error)
      } else {
        // Refresh to sync server state
        router.refresh()
      }
    })
  }
  
  if (isDeleted) {
    return null  // Optimistically removed from UI
  }
  
  return (
    <div className={`gallery-card ${isPending ? 'opacity-50' : ''}`}>
      {/* Card content */}
      
      <button onClick={() => setShowConfirm(true)}>
        Delete
      </button>
      
      {showConfirm && (
        <ConfirmDialog
          title="Delete Gallery"
          message={`Delete "${gallery.title}" and all its images?`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
          isLoading={isPending}
        />
      )}
    </div>
  )
}
```

### Server Action

```typescript
// server/actions/gallery.actions.ts
'use server'

import { auth } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'

export async function deleteGallery(galleryId: string) {
  const { userId } = auth()
  if (!userId) return { error: 'Unauthorized' }
  
  const user = await getUserByClerkId(userId)
  if (!user) return { error: 'User not found' }
  
  // Verify ownership
  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  if (!gallery) return { error: 'Gallery not found' }
  
  // Get all image paths for storage cleanup
  const { data: images } = await supabaseAdmin
    .from('images')
    .select('storage_path')
    .eq('gallery_id', galleryId)
  
  // Delete from storage
  if (images && images.length > 0) {
    const paths = images.map(img => img.storage_path)
    const { error: storageError } = await supabaseAdmin.storage
      .from('gallery-images')
      .remove(paths)
    
    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue with DB delete anyway
    }
  }
  
  // Delete gallery (cascades to images)
  const { error } = await supabaseAdmin
    .from('galleries')
    .delete()
    .eq('id', galleryId)
  
  if (error) return { error: 'Failed to delete gallery' }
  
  revalidatePath('/')
  
  return { success: true }
}
```

## 10.6 Cover Image Selection Heuristic

### Automatic Cover Selection

```typescript
// Cover image is set automatically:
// 1. First uploaded image becomes cover
// 2. If cover is deleted, next image becomes cover
// 3. Manual override via setCoverImage action

// server/actions/image.actions.ts
export async function deleteImage(imageId: string) {
  const { userId } = auth()
  if (!userId) return { error: 'Unauthorized' }
  
  const user = await getUserByClerkId(userId)
  const image = await getImageWithOwnershipCheck(imageId, user.id)
  if (!image) return { error: 'Image not found' }
  
  const gallery = await getGalleryById(image.gallery_id)
  
  // Delete from storage
  await supabaseAdmin.storage
    .from('gallery-images')
    .remove([image.storage_path])
  
  // Delete from database
  await supabaseAdmin
    .from('images')
    .delete()
    .eq('id', imageId)
  
  // If this was the cover image, set new cover
  if (gallery.cover_image_id === imageId) {
    const { data: nextImage } = await supabaseAdmin
      .from('images')
      .select('id')
      .eq('gallery_id', gallery.id)
      .order('position', { ascending: true })
      .limit(1)
      .single()
    
    await supabaseAdmin
      .from('galleries')
      .update({ cover_image_id: nextImage?.id || null })
      .eq('id', gallery.id)
  }
  
  revalidatePath(`/g/${gallery.slug}`)
  revalidatePath('/')
  
  return { success: true }
}
```

### Manual Cover Selection

```typescript
// server/actions/image.actions.ts
export async function setCoverImage(galleryId: string, imageId: string) {
  const { userId } = auth()
  if (!userId) return { error: 'Unauthorized' }
  
  const user = await getUserByClerkId(userId)
  
  // Verify gallery ownership
  const isOwner = await verifyGalleryOwnership(galleryId, user.id)
  if (!isOwner) return { error: 'Access denied' }
  
  // Verify image belongs to gallery
  const { data: image } = await supabaseAdmin
    .from('images')
    .select('id')
    .eq('id', imageId)
    .eq('gallery_id', galleryId)
    .single()
  
  if (!image) return { error: 'Image not found in gallery' }
  
  // Update cover
  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ cover_image_id: imageId })
    .eq('id', galleryId)
  
  if (error) return { error: 'Failed to set cover image' }
  
  revalidatePath('/')
  
  return { success: true }
}
```

### Cover Image Display

```typescript
// components/gallery/GalleryCard.tsx
export function GalleryCard({ gallery }: { gallery: Gallery }) {
  return (
    <Link href={`/gallery/${gallery.id}/upload`} className="block group">
      <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
        {gallery.coverImageUrl ? (
          <img
            src={gallery.coverImageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <ImageIcon className="w-12 h-12" />
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <h3 className="font-medium truncate">{gallery.title}</h3>
        <p className="text-sm text-gray-500">
          {gallery.imageCount} {gallery.imageCount === 1 ? 'image' : 'images'}
          {gallery.hasPassword && ' • Protected'}
        </p>
      </div>
    </Link>
  )
}
```
