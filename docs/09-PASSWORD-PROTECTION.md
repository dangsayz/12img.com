# 9. Password Protection Protocol

## 9.1 Hashing Algorithm Selection

### Decision: bcrypt

| Algorithm | Selected | Rationale |
|-----------|----------|-----------|
| bcrypt | ✅ | Industry standard, built-in salt, configurable work factor |
| scrypt | ❌ | More memory-hard but less common in Node.js ecosystem |
| Argon2 | ❌ | Best security but requires native bindings |
| PBKDF2 | ❌ | Weaker than bcrypt for same computation time |

### Configuration

```typescript
// lib/utils/password.ts
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12  // ~250ms on modern hardware

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### Work Factor Justification

| Rounds | Time (approx) | Use Case |
|--------|---------------|----------|
| 10 | ~100ms | Development |
| 12 | ~250ms | Production (selected) |
| 14 | ~1s | High security |

12 rounds provides good balance:
- Slow enough to resist brute force
- Fast enough for acceptable UX
- Scales with Moore's Law (increase rounds over time)

## 9.2 Salt Strategy

### bcrypt Built-in Salt

bcrypt generates and embeds a unique 128-bit salt per hash.

**Hash format:**
```
$2b$12$N9qo8uLOickgx2ZMRZoMy.MSwVGePrSVJvq3FiAvLxJsKLST5RzHe
│  │  │                      │
│  │  │                      └─ Hash (31 chars)
│  │  └─ Salt (22 chars, base64)
│  └─ Cost factor (12)
└─ Algorithm version (2b)
```

### No Additional Salt Needed

- bcrypt handles salt generation internally
- Salt is stored with hash, no separate column needed
- Each password gets unique salt automatically

## 9.3 Password Storage Location

### Database Column

```sql
-- galleries table
password_hash TEXT  -- NULL = no password protection
```

### Storage Rules

| Scenario | password_hash Value |
|----------|---------------------|
| No password | `NULL` |
| Password set | bcrypt hash string (~60 chars) |
| Password removed | `NULL` (update to null) |

### Schema Constraint

```sql
-- No constraint on password_hash length (bcrypt output is consistent)
-- NULL allowed for unprotected galleries
```

## 9.4 Server-Side Validation Flow

### Password Validation Server Action

```typescript
// server/actions/auth.actions.ts
'use server'

import { cookies } from 'next/headers'
import { verifyPassword, generateUnlockToken } from '@/lib/utils/password'
import { getGalleryById } from '@/server/queries/gallery.queries'

interface ValidatePasswordResult {
  success: boolean
  error?: string
}

export async function validateGalleryPassword(
  galleryId: string,
  password: string
): Promise<ValidatePasswordResult> {
  // Input validation
  if (!galleryId || typeof galleryId !== 'string') {
    return { success: false, error: 'Invalid gallery ID' }
  }
  
  if (!password || typeof password !== 'string') {
    return { success: false, error: 'Password is required' }
  }
  
  // Rate limiting check (see 9.7)
  const rateLimitResult = await checkRateLimit(galleryId)
  if (!rateLimitResult.allowed) {
    return { 
      success: false, 
      error: `Too many attempts. Try again in ${rateLimitResult.retryAfter} seconds.` 
    }
  }
  
  // Fetch gallery
  const gallery = await getGalleryById(galleryId)
  
  if (!gallery) {
    // Don't reveal gallery existence
    await simulateHashTime() // Prevent timing attack
    return { success: false, error: 'Incorrect password' }
  }
  
  if (!gallery.password_hash) {
    // Gallery not password protected
    return { success: false, error: 'Gallery not protected' }
  }
  
  // Verify password
  const isValid = await verifyPassword(password, gallery.password_hash)
  
  if (!isValid) {
    await recordFailedAttempt(galleryId)
    return { success: false, error: 'Incorrect password' }
  }
  
  // Generate unlock token and set cookie
  const token = generateUnlockToken(galleryId)
  
  const cookieStore = cookies()
  cookieStore.set(`gallery_unlock_${galleryId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  })
  
  // Clear rate limit on success
  await clearRateLimit(galleryId)
  
  return { success: true }
}

// Simulate hash time to prevent timing attacks
async function simulateHashTime(): Promise<void> {
  const start = Date.now()
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 100))
}
```

### Validation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Client: User submits password                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Server Action: validateGalleryPassword()                         │
├─────────────────────────────────────────────────────────────────┤
│ 1. Validate input (galleryId, password)                         │
│ 2. Check rate limit                                              │
│ 3. Fetch gallery from database                                   │
│ 4. Verify password with bcrypt.compare()                        │
│ 5. If valid: generate token, set cookie                         │
│ 6. Return result                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ Client: Handle result                                            │
├─────────────────────────────────────────────────────────────────┤
│ Success: router.push(`/g/${gallerySlug}`)                       │
│ Failure: Display error message                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 9.5 Session Unlock Cookie

### Cookie Specification

| Property | Value |
|----------|-------|
| Name | `gallery_unlock_{galleryId}` |
| Value | HMAC-signed token |
| HttpOnly | `true` |
| Secure | `true` (production) |
| SameSite | `lax` |
| MaxAge | 86400 (24 hours) |
| Path | `/` |

### Token Generation

```typescript
// lib/utils/password.ts
import { createHmac, randomBytes } from 'crypto'

const TOKEN_SECRET = process.env.GALLERY_TOKEN_SECRET!

export function generateUnlockToken(galleryId: string): string {
  const timestamp = Date.now()
  const nonce = randomBytes(16).toString('hex')
  const payload = `${galleryId}:${timestamp}:${nonce}`
  
  const signature = createHmac('sha256', TOKEN_SECRET)
    .update(payload)
    .digest('hex')
  
  return `${payload}:${signature}`
}

export function verifyUnlockToken(token: string, galleryId: string): boolean {
  try {
    const parts = token.split(':')
    if (parts.length !== 4) return false
    
    const [tokenGalleryId, timestamp, nonce, signature] = parts
    
    // Verify gallery ID matches
    if (tokenGalleryId !== galleryId) return false
    
    // Verify not expired (24 hours)
    const tokenTime = parseInt(timestamp, 10)
    if (Date.now() - tokenTime > 24 * 60 * 60 * 1000) return false
    
    // Verify signature
    const payload = `${tokenGalleryId}:${timestamp}:${nonce}`
    const expectedSignature = createHmac('sha256', TOKEN_SECRET)
      .update(payload)
      .digest('hex')
    
    return signature === expectedSignature
  } catch {
    return false
  }
}
```

### Cookie Verification in Page

```typescript
// app/g/[galleryId]/page.tsx
import { cookies } from 'next/headers'
import { verifyUnlockToken } from '@/lib/utils/password'

export default async function GalleryPage({ params }: Props) {
  const gallery = await getGalleryBySlug(params.galleryId)
  
  if (!gallery) notFound()
  
  // Check password protection
  if (gallery.password_hash) {
    const cookieStore = cookies()
    const unlockCookie = cookieStore.get(`gallery_unlock_${gallery.id}`)
    
    if (!unlockCookie) {
      redirect(`/g/${params.galleryId}/password`)
    }
    
    if (!verifyUnlockToken(unlockCookie.value, gallery.id)) {
      // Invalid or expired token
      redirect(`/g/${params.galleryId}/password`)
    }
  }
  
  // Proceed with gallery rendering...
}
```

## 9.6 UX Failure States

### Password Form Component

```typescript
// components/gallery/PasswordGate.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { validateGalleryPassword } from '@/server/actions/auth.actions'

interface PasswordGateProps {
  galleryId: string
  gallerySlug: string
}

export function PasswordGate({ galleryId, gallerySlug }: PasswordGateProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }
    
    startTransition(async () => {
      const result = await validateGalleryPassword(galleryId, password)
      
      if (result.success) {
        router.push(`/g/${gallerySlug}`)
        router.refresh()
      } else {
        setError(result.error || 'Incorrect password')
        setAttempts(a => a + 1)
      }
    })
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="Enter password"
          autoComplete="off"
          autoFocus
          disabled={isPending}
          className={`
            w-full px-4 py-3 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-black
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {attempts >= 3 && (
        <p className="text-sm text-gray-500">
          Hint: Contact the photographer if you've forgotten the password.
        </p>
      )}
      
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 bg-black text-white rounded-lg disabled:opacity-50"
      >
        {isPending ? 'Checking...' : 'View Gallery'}
      </button>
    </form>
  )
}
```

### Error States

| State | Display |
|-------|---------|
| Empty password | "Please enter a password" |
| Incorrect password | "Incorrect password" |
| Rate limited | "Too many attempts. Try again in X seconds." |
| Network error | "Something went wrong. Please try again." |
| 3+ failed attempts | Show hint about contacting photographer |

## 9.7 Brute Force Mitigation

### Rate Limiting Strategy

```typescript
// lib/utils/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const MAX_ATTEMPTS = 5
const WINDOW_SECONDS = 300 // 5 minutes
const LOCKOUT_SECONDS = 900 // 15 minutes

interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfter?: number
}

export async function checkRateLimit(
  galleryId: string
): Promise<RateLimitResult> {
  const key = `password_attempts:${galleryId}`
  const lockoutKey = `password_lockout:${galleryId}`
  
  // Check if locked out
  const lockout = await redis.get(lockoutKey)
  if (lockout) {
    const ttl = await redis.ttl(lockoutKey)
    return { allowed: false, remaining: 0, retryAfter: ttl }
  }
  
  // Get current attempts
  const attempts = await redis.get<number>(key) || 0
  
  if (attempts >= MAX_ATTEMPTS) {
    // Set lockout
    await redis.setex(lockoutKey, LOCKOUT_SECONDS, '1')
    return { allowed: false, remaining: 0, retryAfter: LOCKOUT_SECONDS }
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - attempts }
}

export async function recordFailedAttempt(galleryId: string): Promise<void> {
  const key = `password_attempts:${galleryId}`
  
  const attempts = await redis.incr(key)
  
  if (attempts === 1) {
    // Set expiry on first attempt
    await redis.expire(key, WINDOW_SECONDS)
  }
}

export async function clearRateLimit(galleryId: string): Promise<void> {
  const key = `password_attempts:${galleryId}`
  const lockoutKey = `password_lockout:${galleryId}`
  
  await redis.del(key, lockoutKey)
}
```

### Rate Limit Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max attempts | 5 | Allows typos without lockout |
| Window | 5 minutes | Resets after inactivity |
| Lockout duration | 15 minutes | Discourages brute force |

### Alternative: In-Memory Rate Limiting (No Redis)

```typescript
// lib/utils/rate-limit-memory.ts
// For deployments without Redis

const attempts = new Map<string, { count: number; firstAttempt: number }>()

export function checkRateLimit(galleryId: string): RateLimitResult {
  const now = Date.now()
  const record = attempts.get(galleryId)
  
  if (!record) {
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }
  
  // Check if window expired
  if (now - record.firstAttempt > WINDOW_SECONDS * 1000) {
    attempts.delete(galleryId)
    return { allowed: true, remaining: MAX_ATTEMPTS }
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil(
      (LOCKOUT_SECONDS * 1000 - (now - record.firstAttempt)) / 1000
    )
    return { allowed: false, remaining: 0, retryAfter }
  }
  
  return { allowed: true, remaining: MAX_ATTEMPTS - record.count }
}

export function recordFailedAttempt(galleryId: string): void {
  const now = Date.now()
  const record = attempts.get(galleryId)
  
  if (!record) {
    attempts.set(galleryId, { count: 1, firstAttempt: now })
  } else {
    record.count++
  }
}
```

**Note:** In-memory rate limiting resets on server restart and doesn't work across multiple instances. Use Redis for production.

## 9.8 Password Setting/Updating

### Set Password on Gallery Create

```typescript
// server/actions/gallery.actions.ts
export async function createGallery(formData: FormData) {
  const user = await getAuthenticatedUser()
  
  const password = formData.get('password') as string | null
  
  let passwordHash: string | null = null
  if (password && password.trim()) {
    // Validate password strength
    if (password.length < 4) {
      return { error: 'Password must be at least 4 characters' }
    }
    passwordHash = await hashPassword(password)
  }
  
  // Create gallery with password_hash
  const { data, error } = await supabaseAdmin
    .from('galleries')
    .insert({
      user_id: user.id,
      title: formData.get('title'),
      slug: await generateUniqueSlug(formData.get('title')),
      password_hash: passwordHash,
      download_enabled: formData.get('downloadEnabled') === 'true',
    })
    .select()
    .single()
  
  // ...
}
```

### Update Password

```typescript
// server/actions/gallery.actions.ts
export async function updateGalleryPassword(
  galleryId: string,
  newPassword: string | null
) {
  const user = await getAuthenticatedUser()
  
  // Verify ownership
  const isOwner = await verifyGalleryOwnership(galleryId, user.id)
  if (!isOwner) return { error: 'Access denied' }
  
  let passwordHash: string | null = null
  
  if (newPassword && newPassword.trim()) {
    if (newPassword.length < 4) {
      return { error: 'Password must be at least 4 characters' }
    }
    passwordHash = await hashPassword(newPassword)
  }
  
  const { error } = await supabaseAdmin
    .from('galleries')
    .update({ password_hash: passwordHash })
    .eq('id', galleryId)
  
  if (error) return { error: 'Failed to update password' }
  
  // Invalidate existing unlock cookies by changing gallery updated_at
  // (Tokens include timestamp, will be invalid after 24h anyway)
  
  revalidatePath(`/g/${galleryId}`)
  
  return { success: true }
}
```

### Remove Password

```typescript
// Same as update with null password
await updateGalleryPassword(galleryId, null)
```
