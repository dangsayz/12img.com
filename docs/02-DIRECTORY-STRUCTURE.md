# 2. Complete Directory Structure

```
/12img
├── .env.local                          # Local environment variables
├── .env.example                        # Environment template
├── .eslintrc.json                      # ESLint configuration
├── .gitignore                          # Git ignore rules
├── .prettierrc                         # Prettier configuration
├── next.config.js                      # Next.js configuration
├── package.json                        # Dependencies and scripts
├── pnpm-lock.yaml                      # Lock file (pnpm)
├── postcss.config.js                   # PostCSS configuration
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
├── middleware.ts                       # Clerk auth middleware
│
├── /app                                # Next.js App Router
│   ├── layout.tsx                      # Root layout (ClerkProvider, fonts)
│   ├── page.tsx                        # Dashboard (My Galleries)
│   ├── loading.tsx                     # Root loading state
│   ├── error.tsx                       # Root error boundary
│   ├── not-found.tsx                   # 404 page
│   ├── globals.css                     # Global styles + Tailwind
│   │
│   ├── /sign-in                        # Clerk sign-in
│   │   └── /[[...sign-in]]
│   │       └── page.tsx                # Clerk SignIn component
│   │
│   ├── /sign-up                        # Clerk sign-up
│   │   └── /[[...sign-up]]
│   │       └── page.tsx                # Clerk SignUp component
│   │
│   ├── /g                              # Public gallery routes
│   │   └── /[galleryId]
│   │       ├── page.tsx                # Gallery view (RSC)
│   │       ├── loading.tsx             # Gallery loading skeleton
│   │       ├── error.tsx               # Gallery error boundary
│   │       └── layout.tsx              # Minimal layout (no nav)
│   │
│   ├── /gallery                        # Authenticated gallery management
│   │   ├── /create
│   │   │   └── page.tsx                # Create gallery form
│   │   └── /[galleryId]
│   │       ├── /edit
│   │       │   └── page.tsx            # Edit gallery settings
│   │       └── /upload
│   │           └── page.tsx            # Upload images to gallery
│   │
│   ├── /settings
│   │   └── page.tsx                    # User settings page
│   │
│   └── /api
│       └── /webhook
│           └── /clerk
│               └── route.ts            # Clerk webhook handler
│
├── /components                         # React components
│   ├── /ui                             # Base UI primitives
│   │   ├── button.tsx                  # Button component
│   │   ├── input.tsx                   # Input component
│   │   ├── label.tsx                   # Label component
│   │   ├── switch.tsx                  # Toggle switch
│   │   ├── dialog.tsx                  # Modal dialog
│   │   ├── skeleton.tsx                # Loading skeleton
│   │   ├── toast.tsx                   # Toast notifications
│   │   └── toaster.tsx                 # Toast container
│   │
│   ├── /gallery                        # Gallery-specific components
│   │   ├── MasonryGrid.tsx             # Masonry layout (client)
│   │   ├── MasonryItem.tsx             # Single masonry cell
│   │   ├── FullscreenViewer.tsx        # Fullscreen image viewer (client)
│   │   ├── ImageUploader.tsx           # Multi-file uploader (client)
│   │   ├── UploadProgress.tsx          # Upload progress display
│   │   ├── GalleryCard.tsx             # Gallery preview card
│   │   ├── GalleryGrid.tsx             # Dashboard gallery grid
│   │   ├── GalleryHeader.tsx           # Gallery title + actions
│   │   ├── PasswordGate.tsx            # Password protection form (client)
│   │   ├── DownloadAllButton.tsx       # Download ZIP button (client)
│   │   └── EmptyGallery.tsx            # Empty state
│   │
│   ├── /forms                          # Form components
│   │   ├── CreateGalleryForm.tsx       # Gallery creation form (client)
│   │   ├── EditGalleryForm.tsx         # Gallery edit form (client)
│   │   ├── SettingsForm.tsx            # User settings form (client)
│   │   └── PasswordForm.tsx            # Password input form (client)
│   │
│   ├── /layout                         # Layout components
│   │   ├── Header.tsx                  # Main navigation header
│   │   ├── Logo.tsx                    # Logo component
│   │   ├── UserMenu.tsx                # Clerk UserButton wrapper
│   │   └── Container.tsx               # Max-width container
│   │
│   └── /shared                         # Shared components
│       ├── LoadingSpinner.tsx          # Spinner animation
│       ├── ErrorMessage.tsx            # Error display
│       └── ConfirmDialog.tsx           # Confirmation modal
│
├── /server                             # Server-side code
│   ├── /actions                        # Server Actions
│   │   ├── gallery.actions.ts          # Gallery CRUD actions
│   │   ├── image.actions.ts            # Image management actions
│   │   ├── upload.actions.ts           # Upload URL generation
│   │   ├── settings.actions.ts         # User settings actions
│   │   └── auth.actions.ts             # Password validation
│   │
│   └── /queries                        # Data fetching functions
│       ├── gallery.queries.ts          # Gallery fetch functions
│       ├── image.queries.ts            # Image fetch functions
│       └── user.queries.ts             # User data fetch functions
│
├── /lib                                # Shared utilities
│   ├── /supabase
│   │   ├── client.ts                   # Browser Supabase client
│   │   ├── server.ts                   # Server Supabase client
│   │   ├── admin.ts                    # Admin Supabase client (service role)
│   │   └── types.ts                    # Generated database types
│   │
│   ├── /clerk
│   │   └── server.ts                   # Clerk server utilities
│   │
│   ├── /storage
│   │   ├── signed-urls.ts              # Signed URL generation
│   │   └── upload.ts                   # Upload utilities
│   │
│   ├── /validation
│   │   ├── gallery.schema.ts           # Gallery Zod schemas
│   │   ├── image.schema.ts             # Image Zod schemas
│   │   └── settings.schema.ts          # Settings Zod schemas
│   │
│   ├── /utils
│   │   ├── cn.ts                       # Class name merger (clsx + twMerge)
│   │   ├── errors.ts                   # Error classes
│   │   ├── constants.ts                # App constants
│   │   └── id.ts                       # ID generation (nanoid)
│   │
│   └── /hooks                          # Custom React hooks
│       ├── use-upload.ts               # Upload state management
│       ├── use-fullscreen.ts           # Fullscreen viewer state
│       ├── use-masonry.ts              # Masonry layout calculations
│       └── use-swipe.ts                # Swipe gesture detection
│
├── /types                              # TypeScript type definitions
│   ├── database.ts                     # Database row types
│   ├── gallery.ts                      # Gallery-related types
│   ├── image.ts                        # Image-related types
│   └── api.ts                          # API response types
│
├── /styles                             # Additional styles
│   └── masonry.css                     # Masonry-specific styles
│
├── /database                           # Database files
│   ├── schema.sql                      # Full database schema
│   ├── rls-policies.sql                # RLS policies
│   ├── storage-policies.sql            # Storage bucket policies
│   ├── functions.sql                   # Database functions
│   └── seed.sql                        # Development seed data
│
└── /public                             # Static assets
    ├── favicon.ico                     # Favicon
    ├── logo.svg                        # Logo SVG
    └── /fonts                          # Self-hosted fonts (if any)
```

## File Purposes Summary

### `/app` - Route Handlers

| File | Purpose |
|------|---------|
| `layout.tsx` | Root layout with ClerkProvider, global styles, fonts |
| `page.tsx` | Dashboard showing user's galleries |
| `loading.tsx` | Suspense fallback for root |
| `error.tsx` | Error boundary for root |
| `not-found.tsx` | Custom 404 page |
| `globals.css` | Tailwind directives + CSS variables |

### `/components` - UI Components

| Directory | Purpose |
|-----------|---------|
| `/ui` | Shadcn-style primitives (button, input, dialog, etc.) |
| `/gallery` | Gallery-specific components (masonry, viewer, uploader) |
| `/forms` | Form components with validation |
| `/layout` | Header, navigation, containers |
| `/shared` | Reusable utilities (spinner, error, confirm) |

### `/server` - Server-Side Logic

| Directory | Purpose |
|-----------|---------|
| `/actions` | Server Actions for mutations |
| `/queries` | Data fetching functions for RSC |

### `/lib` - Utilities

| Directory | Purpose |
|-----------|---------|
| `/supabase` | Supabase client initialization |
| `/clerk` | Clerk server utilities |
| `/storage` | Storage helpers (signed URLs) |
| `/validation` | Zod schemas for validation |
| `/utils` | General utilities |
| `/hooks` | Custom React hooks |

### `/database` - SQL Files

| File | Purpose |
|------|---------|
| `schema.sql` | CREATE TABLE statements |
| `rls-policies.sql` | Row Level Security policies |
| `storage-policies.sql` | Storage bucket policies |
| `functions.sql` | PostgreSQL functions |
| `seed.sql` | Development seed data |
