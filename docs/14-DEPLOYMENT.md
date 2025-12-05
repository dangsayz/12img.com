# 14. Deployment & Environment Setup

## 14.1 Required Environment Variables

### `.env.local` (Development)

```env
# ===========================================
# Supabase
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===========================================
# Clerk
# ===========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Clerk URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# ===========================================
# Application
# ===========================================
GALLERY_TOKEN_SECRET=your-32-character-random-secret-here

# ===========================================
# Rate Limiting (Optional - Upstash Redis)
# ===========================================
UPSTASH_REDIS_REST_URL=https://xxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxx
```

### `.env.example` (Template)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Application
GALLERY_TOKEN_SECRET=

# Rate Limiting (Optional)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### Environment Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server-only) |
| `CLERK_WEBHOOK_SECRET` | Yes | Clerk webhook signing secret |
| `GALLERY_TOKEN_SECRET` | Yes | Secret for signing gallery unlock tokens (32+ chars) |
| `UPSTASH_REDIS_REST_URL` | No | Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Redis token for rate limiting |

## 14.2 Vercel Project Settings

### Framework Preset

```
Framework: Next.js
Build Command: pnpm build (or npm run build)
Output Directory: .next
Install Command: pnpm install (or npm install)
Development Command: pnpm dev (or npm run dev)
```

### Environment Variables in Vercel

1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Set appropriate environments:
   - `NEXT_PUBLIC_*`: All environments
   - Server secrets: Production only (or all for testing)

### Build Settings

```json
// vercel.json (optional)
{
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"],  // US East (or closest to users)
  "functions": {
    "app/**/*.tsx": {
      "maxDuration": 30
    }
  }
}
```

### Domain Configuration

1. Add custom domain in Vercel dashboard
2. Configure DNS:
   - `A` record: `76.76.21.21`
   - `CNAME` for `www`: `cname.vercel-dns.com`
3. Enable automatic HTTPS

## 14.3 Supabase Project Settings

### Project Creation

1. Create new project at supabase.com
2. Select region closest to users
3. Set strong database password
4. Note project URL and keys

### Database Setup

```bash
# Run schema SQL
psql $DATABASE_URL < database/schema.sql

# Run RLS policies
psql $DATABASE_URL < database/rls-policies.sql

# Run storage policies
psql $DATABASE_URL < database/storage-policies.sql

# Run functions
psql $DATABASE_URL < database/functions.sql
```

### Storage Bucket Setup

```sql
-- Create bucket via SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'gallery-images',
    'gallery-images',
    false,
    26214400,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);
```

Or via Dashboard:
1. Go to Storage → Create bucket
2. Name: `gallery-images`
3. Public: No
4. File size limit: 25 MB
5. Allowed MIME types: image/jpeg, image/png, image/webp, image/gif

### API Settings

1. Go to Settings → API
2. Note:
   - Project URL
   - `anon` public key
   - `service_role` key (keep secret!)

### Auth Settings

1. Go to Authentication → Settings
2. Disable email confirmations (Clerk handles auth)
3. Disable all auth providers (Clerk handles auth)

## 14.4 Build Commands

### Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run with specific port
pnpm dev --port 3001
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server locally
pnpm start

# Analyze bundle
ANALYZE=true pnpm build
```

### Database Commands

```bash
# Generate TypeScript types from Supabase
pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/supabase/types.ts

# Run migrations (if using Supabase CLI)
pnpm supabase db push

# Reset database (development only)
pnpm supabase db reset
```

### Package Scripts

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "analyze": "ANALYZE=true next build",
    "db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > lib/supabase/types.ts"
  }
}
```

## 14.5 CORS Rules

### Supabase CORS (Default)

Supabase allows all origins by default for the REST API. For production, consider restricting:

1. Go to Settings → API
2. Add allowed origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - `http://localhost:3000` (development)

### Next.js API Routes

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}
```

## 14.6 Storage Rules

### Supabase Storage Policies

Already defined in `database/storage-policies.sql`:

```sql
-- Upload: Only gallery owners
CREATE POLICY "storage_insert_own" ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'gallery-images'
    AND (storage.foldername(name))[1] IN (
        SELECT g.id::text FROM public.galleries g
        JOIN public.users u ON g.user_id = u.id
        WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
);

-- Delete: Only gallery owners
CREATE POLICY "storage_delete_own" ON storage.objects FOR DELETE
USING (
    bucket_id = 'gallery-images'
    AND (storage.foldername(name))[1] IN (
        SELECT g.id::text FROM public.galleries g
        JOIN public.users u ON g.user_id = u.id
        WHERE u.clerk_id = auth.jwt() ->> 'sub'
    )
);

-- No public SELECT - all access via signed URLs
```

### Bucket Settings

| Setting | Value |
|---------|-------|
| Public | `false` |
| File size limit | 25 MB |
| Allowed MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |

## 14.7 Production vs Development Differences

### Environment Detection

```typescript
// lib/utils/env.ts
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'
```

### Configuration Differences

| Setting | Development | Production |
|---------|-------------|------------|
| Cookie `secure` | `false` | `true` |
| Cookie `sameSite` | `lax` | `lax` |
| Error details | Verbose | Generic |
| Logging | Debug level | Info level |
| Rate limiting | Disabled/relaxed | Enabled |
| CSP | Report-only | Enforce |

### Cookie Configuration

```typescript
// server/actions/auth.actions.ts
cookieStore.set(`gallery_unlock_${galleryId}`, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24,
  path: '/',
})
```

### Error Handling

```typescript
// lib/utils/errors.ts
export function formatError(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    // Verbose errors in development
    if (error instanceof Error) {
      return `${error.message}\n${error.stack}`
    }
    return String(error)
  }

  // Generic errors in production
  return 'An unexpected error occurred'
}
```

### Logging

```typescript
// lib/utils/logger.ts
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const currentLevel = process.env.NODE_ENV === 'production'
  ? LOG_LEVELS.info
  : LOG_LEVELS.debug

export const logger = {
  debug: (...args: unknown[]) => {
    if (currentLevel <= LOG_LEVELS.debug) {
      console.debug('[DEBUG]', ...args)
    }
  },
  info: (...args: unknown[]) => {
    if (currentLevel <= LOG_LEVELS.info) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args: unknown[]) => {
    if (currentLevel <= LOG_LEVELS.warn) {
      console.warn('[WARN]', ...args)
    }
  },
  error: (...args: unknown[]) => {
    if (currentLevel <= LOG_LEVELS.error) {
      console.error('[ERROR]', ...args)
    }
  },
}
```

## 14.8 Clerk Webhook Setup

### Webhook Configuration

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

### Webhook Endpoint

```typescript
// app/api/webhook/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Missing CLERK_WEBHOOK_SECRET')
  }

  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

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

  // Handle events...
  
  return new Response('OK', { status: 200 })
}
```

## 14.9 Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel
- [ ] Supabase database schema applied
- [ ] Supabase RLS policies applied
- [ ] Supabase storage bucket created
- [ ] Supabase storage policies applied
- [ ] Clerk webhook endpoint configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

### Post-Deployment

- [ ] Verify sign-in/sign-up flow
- [ ] Verify gallery creation
- [ ] Verify image upload
- [ ] Verify public gallery view
- [ ] Verify password protection
- [ ] Verify download functionality
- [ ] Check error tracking (if configured)
- [ ] Monitor Core Web Vitals

### Rollback Plan

1. Vercel automatic rollback:
   - Go to Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

2. Database rollback:
   - Supabase point-in-time recovery
   - Or restore from backup

## 14.10 Monitoring Setup

### Vercel Analytics

Automatically enabled for Pro plans. For Hobby:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Error Tracking (Optional)

```typescript
// lib/utils/error-tracking.ts
// Example with Sentry (optional)
import * as Sentry from '@sentry/nextjs'

export function captureException(error: Error, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context })
  } else {
    console.error(error, context)
  }
}
```

### Supabase Monitoring

1. Go to Supabase Dashboard → Reports
2. Monitor:
   - Database connections
   - Storage usage
   - API requests
   - Error rates
