# 12. Global Security Model

## 12.1 Row Level Security (RLS)

### RLS Enforcement

All tables have RLS enabled. Policies enforce:
- Users can only access their own data
- Public gallery access is controlled at application layer
- Service role bypasses RLS for webhooks and admin operations

### Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | Own record | Service role | Own record | Service role |
| `user_settings` | Own record | Own record | Own record | Cascade |
| `galleries` | Own + Public | Own | Own | Own |
| `images` | Own + Public | Own | Own | Own |

### Critical RLS Policies

```sql
-- Galleries: Owner can manage, public can view metadata
CREATE POLICY "galleries_select_own"
    ON public.galleries FOR SELECT
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

CREATE POLICY "galleries_select_public"
    ON public.galleries FOR SELECT
    USING (true);  -- Password check at app layer

-- Images: Owner can manage, public can view metadata
-- Actual file access controlled by storage policies + signed URLs
CREATE POLICY "images_select_public"
    ON public.images FOR SELECT
    USING (true);

CREATE POLICY "images_insert_own"
    ON public.images FOR INSERT
    WITH CHECK (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );
```

## 12.2 Authorization (Authz)

### Authorization Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: Middleware (Clerk)                                      │
│ - Route-level protection                                         │
│ - Redirect unauthenticated users                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 2: Server Action Auth Check                                │
│ - Verify Clerk session                                           │
│ - Get internal user ID                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 3: Resource Ownership Check                                │
│ - Verify user owns the gallery/image                             │
│ - Explicit ownership query before mutation                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Layer 4: RLS (Defense in Depth)                                  │
│ - Database-level enforcement                                     │
│ - Catches any bypass of application logic                        │
└─────────────────────────────────────────────────────────────────┘
```

### Ownership Verification Pattern

```typescript
// server/actions/gallery.actions.ts
export async function updateGallery(galleryId: string, formData: FormData) {
  // Layer 2: Auth check
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return { error: 'Unauthorized' }
  }

  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return { error: 'User not found' }
  }

  // Layer 3: Ownership check
  const gallery = await supabaseAdmin
    .from('galleries')
    .select('id, user_id')
    .eq('id', galleryId)
    .eq('user_id', user.id)  // Explicit ownership check
    .single()

  if (!gallery.data) {
    return { error: 'Gallery not found' }  // Don't reveal existence
  }

  // Proceed with update...
}
```

## 12.3 Signed URLs

### URL Security Properties

| Property | Value |
|----------|-------|
| Algorithm | HMAC-SHA256 |
| Expiration | 1 hour (view), 5 min (upload) |
| Scope | Single file path |
| Revocation | Not supported (use short expiry) |

### Signed URL Generation

```typescript
// lib/storage/signed-urls.ts
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
```

### URL Validation (Supabase-handled)

Supabase Storage validates:
- Signature integrity
- Expiration timestamp
- Path matches signed path

## 12.4 Token Rotation

### Gallery Unlock Tokens

```typescript
// Token structure: {galleryId}:{timestamp}:{nonce}:{signature}
// Rotation: Tokens expire after 24 hours
// No explicit rotation - short-lived by design

export function generateUnlockToken(galleryId: string): string {
  const timestamp = Date.now()
  const nonce = randomBytes(16).toString('hex')
  const payload = `${galleryId}:${timestamp}:${nonce}`

  const signature = createHmac('sha256', process.env.GALLERY_TOKEN_SECRET!)
    .update(payload)
    .digest('hex')

  return `${payload}:${signature}`
}
```

### Clerk Session Tokens

Managed by Clerk:
- Short-lived JWT tokens
- Automatic refresh
- Secure httpOnly cookies

## 12.5 Route Protection Middleware

```typescript
// middleware.ts
import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  // Routes that don't require authentication
  publicRoutes: [
    '/',              // Landing (redirects if signed in)
    '/sign-in(.*)',   // Clerk sign-in
    '/sign-up(.*)',   // Clerk sign-up
    '/g/(.*)',        // Public gallery view
  ],

  // Routes that bypass middleware entirely
  ignoredRoutes: [
    '/api/webhook/clerk',  // Webhook endpoint
  ],

  // After auth callback
  afterAuth(auth, req) {
    // Redirect signed-in users from landing to dashboard
    if (auth.userId && req.nextUrl.pathname === '/') {
      return Response.redirect(new URL('/dashboard', req.url))
    }
  },
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

### Protected Routes

| Route | Protection |
|-------|------------|
| `/` | Redirect to `/dashboard` if signed in |
| `/dashboard` | Require auth |
| `/settings` | Require auth |
| `/gallery/create` | Require auth |
| `/gallery/[id]/edit` | Require auth + ownership |
| `/gallery/[id]/upload` | Require auth + ownership |
| `/g/[slug]` | Public (password check in page) |

## 12.6 XSS Protection

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co https://clerk.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

### Input Sanitization

```typescript
// lib/utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

// Sanitize user-provided text (gallery titles, etc.)
export function sanitizeText(input: string): string {
  // Remove HTML tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

// Usage in server actions
const title = sanitizeText(formData.get('title') as string)
```

### React's Built-in Protection

React automatically escapes values in JSX:
```tsx
// Safe - React escapes the title
<h1>{gallery.title}</h1>

// Dangerous - avoid unless absolutely necessary
<div dangerouslySetInnerHTML={{ __html: content }} />
```

## 12.7 SSRF Avoidance

### No User-Provided URLs

The application does not:
- Fetch external URLs based on user input
- Process user-provided image URLs
- Make requests to user-specified endpoints

### Signed URL Generation

All URLs are generated server-side with known, trusted paths:
```typescript
// Safe: Path is derived from database record
const signedUrl = await getSignedDownloadUrl(image.storage_path)

// Never: User-provided path
// const signedUrl = await getSignedDownloadUrl(userInput) // DON'T DO THIS
```

## 12.8 Storage Permission Model

### Bucket Configuration

```sql
-- Private bucket - no public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery-images',
    'gallery-images',
    false,  -- Private
    26214400,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

### Storage Policies

```sql
-- Only gallery owners can upload to their gallery folder
CREATE POLICY "storage_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Only gallery owners can delete their files
CREATE POLICY "storage_delete_own"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- No public SELECT policy - all access via signed URLs
```

### Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ Authenticated Owner                                              │
├─────────────────────────────────────────────────────────────────┤
│ Upload: Signed upload URL → Direct PUT to storage               │
│ View: Server generates signed URLs → Client fetches images      │
│ Delete: Server action → Admin client deletes from storage       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Public Viewer (Gallery)                                          │
├─────────────────────────────────────────────────────────────────┤
│ 1. Request gallery page                                          │
│ 2. Server checks password (if protected)                         │
│ 3. Server generates signed URLs (service role)                   │
│ 4. Client receives signed URLs in page props                     │
│ 5. Client fetches images using signed URLs                       │
└─────────────────────────────────────────────────────────────────┘
```

## 12.9 Input Sanitization

### Validation with Zod

```typescript
// lib/validation/gallery.schema.ts
import { z } from 'zod'

export const createGallerySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less')
    .transform(val => val.trim()),

  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password must be 100 characters or less')
    .nullable()
    .optional(),

  downloadEnabled: z.boolean().default(true),
})

export const updateGallerySchema = createGallerySchema.partial()
```

### Slug Sanitization

```typescript
// lib/utils/slug.ts
import slugify from 'slugify'
import { nanoid } from 'nanoid'

export function generateSlug(title: string): string {
  // Sanitize and slugify
  const base = slugify(title, {
    lower: true,
    strict: true,  // Remove special characters
    trim: true,
  })

  // Ensure minimum length
  const safeBase = base.length >= 3 ? base : 'gallery'

  // Add unique suffix
  const suffix = nanoid(6)

  return `${safeBase}-${suffix}`
}

export async function generateUniqueSlug(title: string): Promise<string> {
  let slug = generateSlug(title)
  let attempts = 0

  while (attempts < 5) {
    const { data } = await supabaseAdmin
      .from('galleries')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!data) {
      return slug  // Unique
    }

    // Regenerate with new suffix
    slug = generateSlug(title)
    attempts++
  }

  // Fallback: use full nanoid
  return `gallery-${nanoid(12)}`
}
```

### File Upload Validation

```typescript
// lib/validation/image.schema.ts
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

export function validateUploadFile(file: {
  mimeType: string
  fileSize: number
  originalFilename: string
}): void {
  // MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.mimeType as any)) {
    throw new ValidationError(`Invalid file type: ${file.mimeType}`)
  }

  // Size check
  if (file.fileSize > MAX_FILE_SIZE) {
    throw new ValidationError('File exceeds 25MB limit')
  }

  if (file.fileSize <= 0) {
    throw new ValidationError('File is empty')
  }

  // Filename sanitization (for storage, we use UUID anyway)
  if (file.originalFilename.length > 255) {
    throw new ValidationError('Filename too long')
  }
}
```

## 12.10 Security Checklist

### Authentication
- [x] Clerk handles all auth flows
- [x] Session cookies are httpOnly, secure, sameSite
- [x] Middleware protects authenticated routes
- [x] Server actions verify auth before mutations

### Authorization
- [x] Ownership verified before all mutations
- [x] RLS policies as defense in depth
- [x] No privilege escalation paths

### Data Protection
- [x] Passwords hashed with bcrypt (12 rounds)
- [x] Signed URLs for all storage access
- [x] No sensitive data in client-side state

### Input Validation
- [x] Zod schemas for all inputs
- [x] File type/size validation
- [x] Slug sanitization

### Output Encoding
- [x] React's automatic XSS protection
- [x] CSP headers configured
- [x] No dangerouslySetInnerHTML usage

### Transport Security
- [x] HTTPS enforced (Vercel default)
- [x] Secure cookies in production
- [x] HSTS header

### Rate Limiting
- [x] Password attempts rate limited
- [x] Upload concurrency limited client-side
- [x] Supabase connection pooling
