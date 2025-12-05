# 6. Route-by-Route Implementation Map

## 6.1 Dashboard (`/` - `app/page.tsx`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/page.tsx` |
| **Purpose** | Display user's galleries (My Galleries) |
| **Component Type** | RSC (React Server Component) |
| **Auth Required** | Yes |

### Data Fetching

```typescript
// app/page.tsx
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getUserGalleries } from '@/server/queries/gallery.queries'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { Header } from '@/components/layout/Header'
import { EmptyGallery } from '@/components/gallery/EmptyGallery'

export const dynamic = 'force-dynamic' // Always fresh

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const galleries = await getUserGalleries(userId)
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">My Galleries</h1>
          <a href="/gallery/create" className="btn-primary">
            Create Gallery
          </a>
        </div>
        
        {galleries.length === 0 ? (
          <EmptyGallery />
        ) : (
          <GalleryGrid galleries={galleries} />
        )}
      </main>
    </>
  )
}
```

### Query Function

```typescript
// server/queries/gallery.queries.ts
export async function getUserGalleries(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) return []
  
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
      _count:images(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  // Generate signed URLs for cover images
  const galleriesWithUrls = await Promise.all(
    data.map(async (gallery) => ({
      ...gallery,
      coverImageUrl: gallery.cover_image
        ? await getSignedDownloadUrl(gallery.cover_image.storage_path)
        : null,
      imageCount: gallery._count?.[0]?.count || 0,
      hasPassword: !!gallery.password_hash,
    }))
  )
  
  return galleriesWithUrls
}
```

### Error Handling

```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
        <button onClick={reset} className="btn-secondary">
          Try again
        </button>
      </div>
    </div>
  )
}
```

### Props Flow

```
auth() → userId
  ↓
getUserGalleries(userId) → galleries[]
  ↓
<GalleryGrid galleries={galleries} />
  ↓
<GalleryCard gallery={gallery} /> (for each)
```

---

## 6.2 Public Gallery View (`/g/[galleryId]` - `app/g/[galleryId]/page.tsx`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/g/[galleryId]/page.tsx` |
| **Purpose** | Public gallery view with masonry grid |
| **Component Type** | RSC (data fetch) + Client (masonry/viewer) |
| **Auth Required** | No (password check if protected) |

### Layout

```typescript
// app/g/[galleryId]/layout.tsx
export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Minimal layout - no navigation header
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  )
}
```

### Page Implementation

```typescript
// app/g/[galleryId]/page.tsx
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getGalleryBySlug } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { getSignedUrlsBatch } from '@/lib/storage/signed-urls'
import { verifyUnlockToken } from '@/lib/utils/password'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { GalleryHeader } from '@/components/gallery/GalleryHeader'
import { DownloadAllButton } from '@/components/gallery/DownloadAllButton'

export const revalidate = 60 // ISR: revalidate every 60 seconds

interface Props {
  params: { galleryId: string }
}

export default async function GalleryPage({ params }: Props) {
  const gallery = await getGalleryBySlug(params.galleryId)
  
  if (!gallery) {
    notFound()
  }
  
  // Password protection check
  if (gallery.password_hash) {
    const cookieStore = cookies()
    const unlockCookie = cookieStore.get(`gallery_unlock_${gallery.id}`)
    
    if (!unlockCookie || !verifyUnlockToken(unlockCookie.value, gallery.id)) {
      redirect(`/g/${params.galleryId}/password`)
    }
  }
  
  // Fetch images
  const images = await getGalleryImages(gallery.id)
  
  if (images.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">This gallery is empty.</p>
      </div>
    )
  }
  
  // Generate signed URLs
  const signedUrls = await getSignedUrlsBatch(
    images.map((img) => img.storage_path)
  )
  
  // Map images with signed URLs
  const imagesWithUrls = images.map((img) => ({
    ...img,
    signedUrl: signedUrls.get(img.storage_path) || '',
  }))
  
  return (
    <>
      <GalleryHeader title={gallery.title} />
      
      <main className="container mx-auto px-4 py-8">
        <MasonryGrid images={imagesWithUrls} />
        
        {gallery.download_enabled && (
          <div className="fixed bottom-8 right-8">
            <DownloadAllButton
              galleryId={gallery.id}
              imageCount={images.length}
            />
          </div>
        )}
      </main>
    </>
  )
}
```

### Loading State

```typescript
// app/g/[galleryId]/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function GalleryLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  )
}
```

### Error Handling

```typescript
// app/g/[galleryId]/error.tsx
'use client'

export default function GalleryError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Failed to load gallery.</p>
    </div>
  )
}
```

---

## 6.3 Password Page (`/g/[galleryId]/password`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/g/[galleryId]/password/page.tsx` |
| **Purpose** | Password entry for protected galleries |
| **Component Type** | RSC (check) + Client (form) |
| **Auth Required** | No |

### Implementation

```typescript
// app/g/[galleryId]/password/page.tsx
import { notFound, redirect } from 'next/navigation'
import { getGalleryBySlug } from '@/server/queries/gallery.queries'
import { PasswordGate } from '@/components/gallery/PasswordGate'

interface Props {
  params: { galleryId: string }
}

export default async function PasswordPage({ params }: Props) {
  const gallery = await getGalleryBySlug(params.galleryId)
  
  if (!gallery) {
    notFound()
  }
  
  if (!gallery.password_hash) {
    redirect(`/g/${params.galleryId}`)
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-8">
        <h1 className="text-xl font-semibold text-center mb-2">
          {gallery.title}
        </h1>
        <p className="text-gray-500 text-center mb-6">
          This gallery is password protected.
        </p>
        <PasswordGate
          galleryId={gallery.id}
          gallerySlug={params.galleryId}
        />
      </div>
    </div>
  )
}
```

### Server Action

```typescript
// server/actions/auth.actions.ts
'use server'

import { cookies } from 'next/headers'
import { verifyPassword, generateUnlockToken } from '@/lib/utils/password'
import { getGalleryById } from '@/server/queries/gallery.queries'

export async function validateGalleryPassword(
  galleryId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const gallery = await getGalleryById(galleryId)
  
  if (!gallery || !gallery.password_hash) {
    return { success: false, error: 'Gallery not found' }
  }
  
  const isValid = await verifyPassword(password, gallery.password_hash)
  
  if (!isValid) {
    return { success: false, error: 'Incorrect password' }
  }
  
  // Set unlock cookie
  const token = generateUnlockToken(galleryId)
  const cookieStore = cookies()
  
  cookieStore.set(`gallery_unlock_${galleryId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  
  return { success: true }
}
```

---

## 6.4 Settings Page (`/settings` - `app/settings/page.tsx`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/settings/page.tsx` |
| **Purpose** | User profile and default gallery settings |
| **Component Type** | RSC (data) + Client (form) |
| **Auth Required** | Yes |

### Implementation

```typescript
// app/settings/page.tsx
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getUserSettings } from '@/server/queries/user.queries'
import { Header } from '@/components/layout/Header'
import { SettingsForm } from '@/components/forms/SettingsForm'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const settings = await getUserSettings(userId)
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-8">Settings</h1>
        <SettingsForm initialSettings={settings} />
      </main>
    </>
  )
}
```

### Server Action

```typescript
// server/actions/settings.actions.ts
'use server'

import { auth } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { updateSettingsSchema } from '@/lib/validation/settings.schema'

export async function updateUserSettings(formData: FormData) {
  const { userId } = auth()
  if (!userId) return { error: 'Unauthorized' }
  
  const user = await getUserByClerkId(userId)
  if (!user) return { error: 'User not found' }
  
  const validated = updateSettingsSchema.parse({
    defaultPasswordEnabled: formData.get('defaultPasswordEnabled') === 'true',
    defaultDownloadEnabled: formData.get('defaultDownloadEnabled') === 'true',
  })
  
  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({
      default_password_enabled: validated.defaultPasswordEnabled,
      default_download_enabled: validated.defaultDownloadEnabled,
    })
    .eq('user_id', user.id)
  
  if (error) return { error: 'Failed to update settings' }
  
  revalidatePath('/settings')
  return { success: true }
}
```

---

## 6.5 Create Gallery (`/gallery/create` - `app/gallery/create/page.tsx`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/gallery/create/page.tsx` |
| **Purpose** | Create new gallery form |
| **Component Type** | RSC (shell) + Client (form) |
| **Auth Required** | Yes |

### Implementation

```typescript
// app/gallery/create/page.tsx
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getUserSettings } from '@/server/queries/user.queries'
import { Header } from '@/components/layout/Header'
import { CreateGalleryForm } from '@/components/forms/CreateGalleryForm'

export default async function CreateGalleryPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Get user defaults for form
  const settings = await getUserSettings(userId)
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-8">Create Gallery</h1>
        <CreateGalleryForm defaults={settings} />
      </main>
    </>
  )
}
```

### Server Action

```typescript
// server/actions/gallery.actions.ts
'use server'

import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createGallerySchema } from '@/lib/validation/gallery.schema'
import { hashPassword } from '@/lib/utils/password'
import { generateUniqueSlug } from '@/lib/utils/slug'

export async function createGallery(formData: FormData) {
  const { userId } = auth()
  if (!userId) return { error: 'Unauthorized' }
  
  const user = await getUserByClerkId(userId)
  if (!user) return { error: 'User not found' }
  
  try {
    const validated = createGallerySchema.parse({
      title: formData.get('title'),
      password: formData.get('password') || null,
      downloadEnabled: formData.get('downloadEnabled') === 'true',
    })
    
    const slug = await generateUniqueSlug(validated.title)
    const passwordHash = validated.password
      ? await hashPassword(validated.password)
      : null
    
    const { data, error } = await supabaseAdmin
      .from('galleries')
      .insert({
        user_id: user.id,
        title: validated.title,
        slug,
        password_hash: passwordHash,
        download_enabled: validated.downloadEnabled,
      })
      .select('id, slug')
      .single()
    
    if (error) return { error: 'Failed to create gallery' }
    
    revalidatePath('/')
    
    return { galleryId: data.id, slug: data.slug }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return { error: e.errors[0].message }
    }
    throw e
  }
}
```

---

## 6.6 Edit Gallery (`/gallery/[galleryId]/edit`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/gallery/[galleryId]/edit/page.tsx` |
| **Purpose** | Edit gallery settings |
| **Component Type** | RSC (data) + Client (form) |
| **Auth Required** | Yes |

### Implementation

```typescript
// app/gallery/[galleryId]/edit/page.tsx
import { auth } from '@clerk/nextjs'
import { notFound, redirect } from 'next/navigation'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { Header } from '@/components/layout/Header'
import { EditGalleryForm } from '@/components/forms/EditGalleryForm'

interface Props {
  params: { galleryId: string }
}

export default async function EditGalleryPage({ params }: Props) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getUserByClerkId(userId)
  if (!user) redirect('/sign-in')
  
  const gallery = await getGalleryWithOwnershipCheck(params.galleryId, user.id)
  
  if (!gallery) {
    notFound()
  }
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-8">Edit Gallery</h1>
        <EditGalleryForm gallery={gallery} />
      </main>
    </>
  )
}
```

---

## 6.7 Upload Images (`/gallery/[galleryId]/upload`)

### File Details

| Property | Value |
|----------|-------|
| **Filename** | `app/gallery/[galleryId]/upload/page.tsx` |
| **Purpose** | Upload images to gallery |
| **Component Type** | RSC (auth) + Client (uploader) |
| **Auth Required** | Yes |

### Implementation

```typescript
// app/gallery/[galleryId]/upload/page.tsx
import { auth } from '@clerk/nextjs'
import { notFound, redirect } from 'next/navigation'
import { getGalleryWithOwnershipCheck } from '@/server/queries/gallery.queries'
import { getGalleryImages } from '@/server/queries/image.queries'
import { Header } from '@/components/layout/Header'
import { ImageUploader } from '@/components/gallery/ImageUploader'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'

interface Props {
  params: { galleryId: string }
}

export default async function UploadPage({ params }: Props) {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  const user = await getUserByClerkId(userId)
  if (!user) redirect('/sign-in')
  
  const gallery = await getGalleryWithOwnershipCheck(params.galleryId, user.id)
  
  if (!gallery) {
    notFound()
  }
  
  const images = await getGalleryImages(gallery.id)
  const signedUrls = await getSignedUrlsBatch(
    images.map((img) => img.storage_path)
  )
  
  const imagesWithUrls = images.map((img) => ({
    ...img,
    signedUrl: signedUrls.get(img.storage_path) || '',
  }))
  
  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold">{gallery.title}</h1>
          <a
            href={`/g/${gallery.slug}`}
            target="_blank"
            className="btn-secondary"
          >
            View Gallery
          </a>
        </div>
        
        <ImageUploader galleryId={gallery.id} />
        
        {images.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-medium mb-4">
              Uploaded Images ({images.length})
            </h2>
            <MasonryGrid images={imagesWithUrls} editable />
          </div>
        )}
      </main>
    </>
  )
}
```

### Server Actions

```typescript
// server/actions/upload.actions.ts
'use server'

import { auth } from '@clerk/nextjs'
import { v4 as uuidv4 } from 'uuid'
import { revalidatePath } from 'next/cache'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export async function generateSignedUploadUrls(request: {
  galleryId: string
  files: Array<{
    localId: string
    mimeType: string
    fileSize: number
    originalFilename: string
  }>
}) {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')
  
  const user = await getUserByClerkId(userId)
  if (!user) throw new Error('User not found')
  
  // Verify gallery ownership
  const isOwner = await verifyGalleryOwnership(request.galleryId, user.id)
  if (!isOwner) throw new Error('Access denied')
  
  const responses = []
  
  for (const file of request.files) {
    // Validate
    if (file.fileSize > MAX_FILE_SIZE) {
      throw new Error(`File too large: ${file.originalFilename}`)
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimeType)) {
      throw new Error(`Invalid file type: ${file.mimeType}`)
    }
    
    const imageId = uuidv4()
    const ext = MIME_TO_EXT[file.mimeType]
    const storagePath = `${request.galleryId}/${imageId}.${ext}`
    
    const { data, error } = await supabaseAdmin.storage
      .from('gallery-images')
      .createSignedUploadUrl(storagePath)
    
    if (error) throw new Error('Failed to create upload URL')
    
    responses.push({
      localId: file.localId,
      storagePath,
      signedUrl: data.signedUrl,
      token: data.token,
    })
  }
  
  return responses
}

export async function confirmUploads(request: {
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
}) {
  const { userId } = auth()
  if (!userId) throw new Error('Unauthorized')
  
  const user = await getUserByClerkId(userId)
  if (!user) throw new Error('User not found')
  
  // Verify gallery ownership
  const isOwner = await verifyGalleryOwnership(request.galleryId, user.id)
  if (!isOwner) throw new Error('Access denied')
  
  const imageIds = []
  
  for (const upload of request.uploads) {
    // Insert into database using function for proper positioning
    const { data, error } = await supabaseAdmin.rpc('insert_image_at_position', {
      p_gallery_id: request.galleryId,
      p_storage_path: upload.storagePath,
      p_original_filename: upload.originalFilename,
      p_file_size_bytes: upload.fileSize,
      p_mime_type: upload.mimeType,
      p_width: upload.width || null,
      p_height: upload.height || null,
    })
    
    if (error) throw new Error('Failed to save image')
    
    imageIds.push(data)
  }
  
  // Set first image as cover if no cover exists
  const gallery = await getGalleryById(request.galleryId)
  if (!gallery.cover_image_id && imageIds.length > 0) {
    await supabaseAdmin
      .from('galleries')
      .update({ cover_image_id: imageIds[0] })
      .eq('id', request.galleryId)
  }
  
  revalidatePath(`/g/${gallery.slug}`)
  revalidatePath(`/gallery/${request.galleryId}/upload`)
  
  return { imageIds }
}
```
