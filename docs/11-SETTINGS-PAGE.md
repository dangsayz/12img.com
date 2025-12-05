# 11. Settings Page Requirements

## 11.1 Schema

### User Settings Table

```sql
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    default_password_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    default_download_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### TypeScript Types

```typescript
// types/settings.ts
export interface UserSettings {
  id: string
  userId: string
  defaultPasswordEnabled: boolean
  defaultDownloadEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateSettingsInput {
  defaultPasswordEnabled?: boolean
  defaultDownloadEnabled?: boolean
}
```

## 11.2 Validation

### Zod Schema

```typescript
// lib/validation/settings.schema.ts
import { z } from 'zod'

export const updateSettingsSchema = z.object({
  defaultPasswordEnabled: z.boolean().optional(),
  defaultDownloadEnabled: z.boolean().optional(),
})

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>
```

### Server-Side Validation

```typescript
// server/actions/settings.actions.ts
'use server'

import { auth } from '@clerk/nextjs'
import { revalidatePath } from 'next/cache'
import { updateSettingsSchema } from '@/lib/validation/settings.schema'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getUserByClerkId } from '@/server/queries/user.queries'

export async function updateUserSettings(formData: FormData) {
  const { userId: clerkId } = auth()
  if (!clerkId) {
    return { error: 'Unauthorized' }
  }

  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return { error: 'User not found' }
  }

  // Parse form data
  const rawInput = {
    defaultPasswordEnabled: formData.get('defaultPasswordEnabled') === 'true',
    defaultDownloadEnabled: formData.get('defaultDownloadEnabled') === 'true',
  }

  // Validate
  const parseResult = updateSettingsSchema.safeParse(rawInput)
  if (!parseResult.success) {
    return { error: parseResult.error.errors[0].message }
  }

  const input = parseResult.data

  // Update settings
  const { error } = await supabaseAdmin
    .from('user_settings')
    .update({
      default_password_enabled: input.defaultPasswordEnabled,
      default_download_enabled: input.defaultDownloadEnabled,
    })
    .eq('user_id', user.id)

  if (error) {
    return { error: 'Failed to update settings' }
  }

  revalidatePath('/settings')

  return { success: true }
}
```

## 11.3 PATCH vs PUT

### Decision: PATCH Semantics

**Rationale:**
- Settings form may submit partial updates
- Only changed fields should be updated
- Reduces risk of overwriting concurrent changes

### Implementation

```typescript
// PATCH-style update: only update provided fields
export async function updateUserSettings(formData: FormData) {
  // ... auth checks ...

  // Build update object with only provided fields
  const updateData: Record<string, boolean> = {}

  if (formData.has('defaultPasswordEnabled')) {
    updateData.default_password_enabled = 
      formData.get('defaultPasswordEnabled') === 'true'
  }

  if (formData.has('defaultDownloadEnabled')) {
    updateData.default_download_enabled = 
      formData.get('defaultDownloadEnabled') === 'true'
  }

  // Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    return { success: true } // No-op
  }

  const { error } = await supabaseAdmin
    .from('user_settings')
    .update(updateData)
    .eq('user_id', user.id)

  // ...
}
```

## 11.4 Clerk Integration

### User Profile Section

The settings page displays Clerk-managed profile data (email, name) but does not allow editing through our app. Profile changes go through Clerk's UserProfile component.

```typescript
// app/settings/page.tsx
import { auth, currentUser } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { getUserSettings } from '@/server/queries/user.queries'
import { Header } from '@/components/layout/Header'
import { SettingsForm } from '@/components/forms/SettingsForm'
import { UserProfile } from '@clerk/nextjs'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { userId } = auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await currentUser()
  const settings = await getUserSettings(userId)

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold mb-8">Settings</h1>

        {/* Profile Section (Clerk-managed) */}
        <section className="mb-12">
          <h2 className="text-lg font-medium mb-4">Profile</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4">
              {user?.imageUrl && (
                <img
                  src={user.imageUrl}
                  alt=""
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <p className="font-medium">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-gray-500">
                  {user?.emailAddresses[0]?.emailAddress}
                </p>
              </div>
            </div>
            <a
              href="/user-profile"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              Manage profile in Clerk →
            </a>
          </div>
        </section>

        {/* Gallery Defaults Section */}
        <section>
          <h2 className="text-lg font-medium mb-4">Gallery Defaults</h2>
          <SettingsForm initialSettings={settings} />
        </section>
      </main>
    </>
  )
}
```

### Clerk UserProfile Route (Optional)

```typescript
// app/user-profile/[[...user-profile]]/page.tsx
import { UserProfile } from '@clerk/nextjs'

export default function UserProfilePage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <UserProfile
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

## 11.5 Default Password Toggle Logic

### Form Component

```typescript
// components/forms/SettingsForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { updateUserSettings } from '@/server/actions/settings.actions'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SettingsFormProps {
  initialSettings: {
    defaultPasswordEnabled: boolean
    defaultDownloadEnabled: boolean
  }
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [settings, setSettings] = useState(initialSettings)
  const [saved, setSaved] = useState(false)

  const handleToggle = (field: keyof typeof settings) => {
    const newValue = !settings[field]
    setSettings(prev => ({ ...prev, [field]: newValue }))
    setSaved(false)

    // Auto-save on toggle
    const formData = new FormData()
    formData.set(field, String(newValue))

    startTransition(async () => {
      const result = await updateUserSettings(formData)
      if (result.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Password Default Toggle */}
      <div className="flex items-center justify-between py-4 border-b">
        <div>
          <Label htmlFor="defaultPasswordEnabled" className="font-medium">
            Password protect new galleries
          </Label>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, new galleries will require a password by default.
            You can still change this per gallery.
          </p>
        </div>
        <Switch
          id="defaultPasswordEnabled"
          checked={settings.defaultPasswordEnabled}
          onCheckedChange={() => handleToggle('defaultPasswordEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Download Default Toggle */}
      <div className="flex items-center justify-between py-4 border-b">
        <div>
          <Label htmlFor="defaultDownloadEnabled" className="font-medium">
            Allow downloads by default
          </Label>
          <p className="text-sm text-gray-500 mt-1">
            When enabled, clients can download all images from new galleries.
            You can still change this per gallery.
          </p>
        </div>
        <Switch
          id="defaultDownloadEnabled"
          checked={settings.defaultDownloadEnabled}
          onCheckedChange={() => handleToggle('defaultDownloadEnabled')}
          disabled={isPending}
        />
      </div>

      {/* Save indicator */}
      <div className="h-6">
        {isPending && (
          <p className="text-sm text-gray-500">Saving...</p>
        )}
        {saved && !isPending && (
          <p className="text-sm text-green-600">Settings saved</p>
        )}
      </div>
    </div>
  )
}
```

### Default Application on Gallery Create

```typescript
// server/actions/gallery.actions.ts
export async function createGallery(formData: FormData) {
  const user = await getAuthenticatedUser()

  // Get user's default settings
  const { data: settings } = await supabaseAdmin
    .from('user_settings')
    .select('default_password_enabled, default_download_enabled')
    .eq('user_id', user.id)
    .single()

  const title = formData.get('title') as string

  // Use form values if provided, otherwise use defaults
  const passwordFromForm = formData.get('password') as string | null
  const downloadFromForm = formData.get('downloadEnabled')

  // Determine if password should be required
  // If user has default password enabled and no password provided in form,
  // we still create without password (user must explicitly set one)
  const passwordHash = passwordFromForm
    ? await hashPassword(passwordFromForm)
    : null

  // Use form value if explicitly set, otherwise use default
  const downloadEnabled = downloadFromForm !== null
    ? downloadFromForm === 'true'
    : settings?.default_download_enabled ?? true

  const { data, error } = await supabaseAdmin
    .from('galleries')
    .insert({
      user_id: user.id,
      title,
      slug: await generateUniqueSlug(title),
      password_hash: passwordHash,
      download_enabled: downloadEnabled,
    })
    .select('id, slug')
    .single()

  // ...
}
```

### Create Gallery Form with Defaults

```typescript
// components/forms/CreateGalleryForm.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGallery } from '@/server/actions/gallery.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface CreateGalleryFormProps {
  defaults: {
    defaultPasswordEnabled: boolean
    defaultDownloadEnabled: boolean
  }
}

export function CreateGalleryForm({ defaults }: CreateGalleryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Initialize with user's defaults
  const [showPasswordField, setShowPasswordField] = useState(
    defaults.defaultPasswordEnabled
  )
  const [downloadEnabled, setDownloadEnabled] = useState(
    defaults.defaultDownloadEnabled
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('downloadEnabled', String(downloadEnabled))

    // Remove password if field is hidden
    if (!showPasswordField) {
      formData.delete('password')
    }

    startTransition(async () => {
      const result = await createGallery(formData)

      if (result.error) {
        setError(result.error)
      } else {
        router.push(`/gallery/${result.galleryId}/upload`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Gallery Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={100}
          placeholder="Wedding Photos"
          className="mt-1"
        />
      </div>

      {/* Password Protection Toggle */}
      <div className="flex items-center justify-between py-4 border rounded-lg px-4">
        <div>
          <Label htmlFor="passwordToggle">Password Protection</Label>
          <p className="text-sm text-gray-500">
            Require a password to view this gallery
          </p>
        </div>
        <Switch
          id="passwordToggle"
          checked={showPasswordField}
          onCheckedChange={setShowPasswordField}
        />
      </div>

      {/* Password Field (conditional) */}
      {showPasswordField && (
        <div>
          <Label htmlFor="password">Gallery Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required={showPasswordField}
            minLength={4}
            placeholder="Enter password"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Share this password with your clients
          </p>
        </div>
      )}

      {/* Download Toggle */}
      <div className="flex items-center justify-between py-4 border rounded-lg px-4">
        <div>
          <Label htmlFor="downloadToggle">Allow Downloads</Label>
          <p className="text-sm text-gray-500">
            Let clients download all images
          </p>
        </div>
        <Switch
          id="downloadToggle"
          checked={downloadEnabled}
          onCheckedChange={setDownloadEnabled}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Submit */}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating...' : 'Create Gallery'}
      </Button>
    </form>
  )
}
```

## 11.6 Default Download Permission Logic

### Behavior Matrix

| User Default | Form Override | Result |
|--------------|---------------|--------|
| `true` | Not set | `true` |
| `true` | `false` | `false` |
| `false` | Not set | `false` |
| `false` | `true` | `true` |

### Query for Settings

```typescript
// server/queries/user.queries.ts
export async function getUserSettings(clerkId: string) {
  const user = await getUserByClerkId(clerkId)
  if (!user) {
    return {
      defaultPasswordEnabled: false,
      defaultDownloadEnabled: true,
    }
  }

  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('default_password_enabled, default_download_enabled')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    // Return defaults if settings don't exist
    return {
      defaultPasswordEnabled: false,
      defaultDownloadEnabled: true,
    }
  }

  return {
    defaultPasswordEnabled: data.default_password_enabled,
    defaultDownloadEnabled: data.default_download_enabled,
  }
}
```

### Settings Initialization on User Create

```typescript
// app/api/webhook/clerk/route.ts
if (eventType === 'user.created') {
  // Create user record
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_id: id,
      email: primaryEmail?.email_address || '',
    })
    .select('id')
    .single()

  if (userError) {
    console.error('Failed to create user:', userError)
    return new Response('Failed to create user', { status: 500 })
  }

  // Create default settings
  const { error: settingsError } = await supabaseAdmin
    .from('user_settings')
    .insert({
      user_id: user.id,
      default_password_enabled: false,
      default_download_enabled: true,
    })

  if (settingsError) {
    console.error('Failed to create settings:', settingsError)
    // Non-fatal, settings will use defaults
  }
}
```
