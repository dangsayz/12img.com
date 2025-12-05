# 5. Authentication Architecture (Clerk)

## 5.1 Clerk Configuration

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
CLERK_WEBHOOK_SECRET=whsec_...
```

### Clerk Dashboard Settings

| Setting | Value |
|---------|-------|
| Sign-in methods | Email + Password, Google OAuth |
| Sign-up mode | Open |
| Session lifetime | 7 days |
| Multi-session | Disabled |

## 5.2 Middleware Configuration

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  // Public routes (no auth required)
  publicRoutes: [
    '/',  // Landing page (redirects to dashboard if signed in)
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/g/(.*)',  // All public gallery routes
  ],
  
  // Routes that can be accessed by signed-out users but will
  // receive auth data if signed in
  ignoredRoutes: [
    '/api/webhook/clerk',  // Webhook must be accessible
  ],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### Route Protection Matrix

| Route Pattern | Auth Required | Notes |
|---------------|---------------|-------|
| `/` | Yes | Dashboard (My Galleries) |
| `/sign-in/*` | No | Clerk sign-in |
| `/sign-up/*` | No | Clerk sign-up |
| `/g/*` | No | Public gallery view |
| `/gallery/create` | Yes | Create new gallery |
| `/gallery/[id]/edit` | Yes | Edit gallery settings |
| `/gallery/[id]/upload` | Yes | Upload images |
| `/settings` | Yes | User settings |
| `/api/webhook/clerk` | No | Clerk webhook |

## 5.3 Session Retrieval Patterns

### Server Components (RSC)

```typescript
// app/page.tsx (Dashboard)
import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  // Fetch user's galleries
  const galleries = await getUserGalleries(userId)
  
  return <GalleryGrid galleries={galleries} />
}
```

### Server Actions

```typescript
// server/actions/gallery.actions.ts
'use server'

import { auth } from '@clerk/nextjs'

export async function createGallery(formData: FormData) {
  const { userId } = auth()
  
  if (!userId) {
    return { error: 'Unauthorized' }
  }
  
  // Get internal user ID from Clerk ID
  const user = await getUserByClerkId(userId)
  if (!user) {
    return { error: 'User not found' }
  }
  
  // Create gallery
  const gallery = await supabase
    .from('galleries')
    .insert({
      user_id: user.id,
      title: formData.get('title'),
      slug: generateSlug(formData.get('title')),
    })
    .select()
    .single()
  
  return { galleryId: gallery.data.id }
}
```

### Client Components

```typescript
// components/layout/UserMenu.tsx
'use client'

import { useUser, UserButton } from '@clerk/nextjs'

export function UserMenu() {
  const { isLoaded, isSignedIn, user } = useUser()
  
  if (!isLoaded) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }
  
  if (!isSignedIn) {
    return null
  }
  
  return (
    <UserButton
      afterSignOutUrl="/sign-in"
      appearance={{
        elements: {
          avatarBox: 'h-8 w-8',
        },
      }}
    />
  )
}
```

## 5.4 Public Gallery Exception Pattern

### Password-Protected Gallery Flow

```typescript
// app/g/[galleryId]/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function GalleryPage({
  params,
}: {
  params: { galleryId: string }
}) {
  const gallery = await getGalleryBySlug(params.galleryId)
  
  if (!gallery) {
    notFound()
  }
  
  // Check if password protected
  if (gallery.password_hash) {
    const cookieStore = cookies()
    const unlockCookie = cookieStore.get(`gallery_unlock_${gallery.id}`)
    
    if (!unlockCookie || !verifyUnlockToken(unlockCookie.value, gallery.id)) {
      // Redirect to password page
      redirect(`/g/${params.galleryId}/password`)
    }
  }
  
  // Fetch images and generate signed URLs
  const images = await getGalleryImages(gallery.id)
  const signedUrls = await getSignedUrlsBatch(
    images.map((img) => img.storage_path)
  )
  
  return (
    <GalleryView
      gallery={gallery}
      images={images}
      signedUrls={signedUrls}
    />
  )
}
```

### Password Page

```typescript
// app/g/[galleryId]/password/page.tsx
import { PasswordGate } from '@/components/gallery/PasswordGate'

export default async function PasswordPage({
  params,
}: {
  params: { galleryId: string }
}) {
  const gallery = await getGalleryBySlug(params.galleryId)
  
  if (!gallery) {
    notFound()
  }
  
  if (!gallery.password_hash) {
    // No password required, redirect to gallery
    redirect(`/g/${params.galleryId}`)
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <PasswordGate galleryId={gallery.id} gallerySlug={params.galleryId} />
    </div>
  )
}
```

## 5.5 Server Actions with Auth

### Auth Pattern for All Server Actions

```typescript
// server/actions/base.ts
import { auth } from '@clerk/nextjs'
import { getUserByClerkId } from '@/server/queries/user.queries'

export async function getAuthenticatedUser() {
  const { userId: clerkId } = auth()
  
  if (!clerkId) {
    throw new AuthError('Not authenticated')
  }
  
  const user = await getUserByClerkId(clerkId)
  
  if (!user) {
    throw new AuthError('User not found in database')
  }
  
  return user
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}
```

### Usage in Actions

```typescript
// server/actions/gallery.actions.ts
'use server'

import { getAuthenticatedUser, AuthError } from './base'
import { revalidatePath } from 'next/cache'

export async function createGallery(formData: FormData) {
  try {
    const user = await getAuthenticatedUser()
    
    const title = formData.get('title') as string
    const password = formData.get('password') as string | null
    const downloadEnabled = formData.get('downloadEnabled') === 'true'
    
    // Validate
    const validated = createGallerySchema.parse({
      title,
      password,
      downloadEnabled,
    })
    
    // Generate slug
    const slug = await generateUniqueSlug(validated.title)
    
    // Hash password if provided
    const passwordHash = validated.password
      ? await hashPassword(validated.password)
      : null
    
    // Insert
    const { data, error } = await supabaseAdmin
      .from('galleries')
      .insert({
        user_id: user.id,
        title: validated.title,
        slug,
        password_hash: passwordHash,
        download_enabled: validated.downloadEnabled,
      })
      .select()
      .single()
    
    if (error) {
      return { error: 'Failed to create gallery' }
    }
    
    revalidatePath('/')
    
    return { galleryId: data.id, slug: data.slug }
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: 'Unauthorized' }
    }
    throw e
  }
}
```

## 5.6 Gallery Ownership Enforcement

### Ownership Check Pattern

```typescript
// server/queries/gallery.queries.ts
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function verifyGalleryOwnership(
  galleryId: string,
  userId: string  // Internal user ID, not Clerk ID
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .single()
  
  return !error && !!data
}

export async function getGalleryWithOwnershipCheck(
  galleryId: string,
  userId: string
) {
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .select('*')
    .eq('id', galleryId)
    .eq('user_id', userId)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return data
}
```

### Usage in Server Actions

```typescript
// server/actions/gallery.actions.ts
export async function updateGallery(
  galleryId: string,
  formData: FormData
) {
  const user = await getAuthenticatedUser()
  
  // Verify ownership
  const gallery = await getGalleryWithOwnershipCheck(galleryId, user.id)
  
  if (!gallery) {
    return { error: 'Gallery not found or access denied' }
  }
  
  // Proceed with update...
}

export async function deleteGallery(galleryId: string) {
  const user = await getAuthenticatedUser()
  
  // Verify ownership
  const isOwner = await verifyGalleryOwnership(galleryId, user.id)
  
  if (!isOwner) {
    return { error: 'Gallery not found or access denied' }
  }
  
  // Proceed with deletion...
}
```

## 5.7 Clerk Webhook Handler

### User Sync Webhook

```typescript
// app/api/webhook/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  
  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }
  
  // Get headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')
  
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }
  
  // Get body
  const payload = await req.json()
  const body = JSON.stringify(payload)
  
  // Verify webhook
  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent
  
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }
  
  // Handle events
  const eventType = evt.type
  
  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data
    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    )
    
    // Create user in database
    const { error } = await supabaseAdmin.from('users').insert({
      clerk_id: id,
      email: primaryEmail?.email_address || '',
    })
    
    if (error) {
      console.error('Failed to create user:', error)
      return new Response('Failed to create user', { status: 500 })
    }
    
    // Create default settings
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', id)
      .single()
    
    if (user) {
      await supabaseAdmin.from('user_settings').insert({
        user_id: user.id,
      })
    }
  }
  
  if (eventType === 'user.updated') {
    const { id, email_addresses } = evt.data
    const primaryEmail = email_addresses.find(
      (e) => e.id === evt.data.primary_email_address_id
    )
    
    await supabaseAdmin
      .from('users')
      .update({ email: primaryEmail?.email_address || '' })
      .eq('clerk_id', id)
  }
  
  if (eventType === 'user.deleted') {
    const { id } = evt.data
    
    // Get user to find their galleries
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_id', id)
      .single()
    
    if (user) {
      // Get all gallery images for storage cleanup
      const { data: images } = await supabaseAdmin
        .from('images')
        .select('storage_path, galleries!inner(user_id)')
        .eq('galleries.user_id', user.id)
      
      // Delete storage files
      if (images && images.length > 0) {
        const paths = images.map((img) => img.storage_path)
        await supabaseAdmin.storage.from('gallery-images').remove(paths)
      }
      
      // Delete user (cascades to galleries and images)
      await supabaseAdmin.from('users').delete().eq('clerk_id', id)
    }
  }
  
  return new Response('OK', { status: 200 })
}
```

## 5.8 Root Layout with ClerkProvider

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '12img',
  description: 'Minimal gallery delivery for photographers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

## 5.9 Sign-In/Sign-Up Pages

```typescript
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-none',
          },
        }}
      />
    </div>
  )
}

// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignUp
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-none',
          },
        }}
      />
    </div>
  )
}
```
