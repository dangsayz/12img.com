# 12img Engineering Blueprint

## Document Index

| Section | File | Description |
|---------|------|-------------|
| 1 | [01-SYSTEM-ARCHITECTURE.md](./01-SYSTEM-ARCHITECTURE.md) | RSC/Client split, Server Actions, API boundaries, caching, security layers |
| 2 | [02-DIRECTORY-STRUCTURE.md](./02-DIRECTORY-STRUCTURE.md) | Complete file tree for production Next.js App Router project |
| 3 | [03-DATABASE-SCHEMA.md](./03-DATABASE-SCHEMA.md) | Full SQL schema, RLS policies, storage policies, TypeScript types |
| 4 | [04-IMAGE-STORAGE.md](./04-IMAGE-STORAGE.md) | Bucket config, path schemas, signed URLs, upload workflow |
| 5 | [05-AUTHENTICATION.md](./05-AUTHENTICATION.md) | Clerk middleware, session patterns, route protection, webhooks |
| 6 | [06-ROUTE-IMPLEMENTATION.md](./06-ROUTE-IMPLEMENTATION.md) | Route-by-route implementation details with code |
| 7 | [07-UPLOAD-FLOW.md](./07-UPLOAD-FLOW.md) | Signed upload URLs, validation, parallelization, error recovery |
| 8 | [08-GALLERY-RENDERING.md](./08-GALLERY-RENDERING.md) | Masonry algorithm, hydration, suspense, gestures |
| 9 | [09-PASSWORD-PROTECTION.md](./09-PASSWORD-PROTECTION.md) | bcrypt hashing, unlock tokens, rate limiting |
| 10 | [10-DASHBOARD.md](./10-DASHBOARD.md) | Pagination, sorting, optimistic updates, cover images |
| 11 | [11-SETTINGS-PAGE.md](./11-SETTINGS-PAGE.md) | Schema, validation, Clerk integration, defaults |
| 12 | [12-SECURITY-MODEL.md](./12-SECURITY-MODEL.md) | RLS, authz, XSS, SSRF, input sanitization |
| 13 | [13-PERFORMANCE.md](./13-PERFORMANCE.md) | Caching, streaming, lazy loading, indexing |
| 14 | [14-DEPLOYMENT.md](./14-DEPLOYMENT.md) | Environment variables, Vercel/Supabase setup, CORS |
| 15 | [15-POST-MVP-HOOKS.md](./15-POST-MVP-HOOKS.md) | Future feature placeholders (DO NOT BUILD) |

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Clerk |
| Deployment | Vercel |

---

## MVP Feature Scope

1. **Authentication** - Clerk sign-in/sign-up
2. **Gallery Creation** - Title, optional password, download toggle
3. **Image Upload** - Multi-file, drag-drop, progress tracking
4. **Public Gallery View** - Masonry grid, fullscreen viewer, swipe/zoom
5. **Password Protection** - Per-gallery passwords with unlock cookies
6. **Download All** - Optional ZIP download for clients
7. **Dashboard** - My Galleries list with cover images
8. **Settings** - Default gallery preferences

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd 12img
pnpm install

# 2. Set up environment
cp .env.example .env.local
# Fill in Supabase and Clerk credentials

# 3. Set up database
# Run SQL files in Supabase SQL Editor:
# - database/schema.sql
# - database/rls-policies.sql
# - database/storage-policies.sql
# - database/functions.sql

# 4. Create storage bucket
# In Supabase Dashboard: Storage → Create bucket "gallery-images"

# 5. Configure Clerk webhook
# Add endpoint: https://yourdomain.com/api/webhook/clerk
# Events: user.created, user.updated, user.deleted

# 6. Run development server
pnpm dev
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           VERCEL                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                     Next.js 14 App                           │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │    │
│  │  │    RSC      │  │   Client    │  │   Server    │          │    │
│  │  │  (pages)    │  │ Components  │  │  Actions    │          │    │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │    │
│  │         │                │                │                  │    │
│  │         └────────────────┼────────────────┘                  │    │
│  │                          │                                   │    │
│  └──────────────────────────┼───────────────────────────────────┘    │
│                             │                                        │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│     CLERK       │  │    SUPABASE     │  │    SUPABASE     │
│                 │  │    POSTGRES     │  │    STORAGE      │
│  - Auth         │  │                 │  │                 │
│  - Sessions     │  │  - users        │  │  - gallery-     │
│  - Webhooks     │  │  - galleries    │  │    images       │
│                 │  │  - images       │  │  - Signed URLs  │
│                 │  │  - settings     │  │                 │
│                 │  │  - RLS          │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Implementation Ready
