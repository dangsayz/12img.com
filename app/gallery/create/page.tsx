'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGallery } from '@/server/actions/gallery.actions'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export default function CreateGalleryPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [downloadEnabled, setDownloadEnabled] = useState(true)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set('downloadEnabled', String(downloadEnabled))

    if (!showPassword) {
      formData.delete('password')
    }

    startTransition(async () => {
      const result = await createGallery(formData)

      if (result.error) {
        setError(result.error)
      } else if (result.galleryId) {
        router.push(`/gallery/${result.galleryId}/upload`)
      }
    })
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-lg">
        <h1 className="text-2xl font-semibold mb-8">Create Gallery</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="flex items-center justify-between py-4 border rounded-lg px-4">
            <div>
              <Label htmlFor="passwordToggle">Password Protection</Label>
              <p className="text-sm text-gray-500">
                Require a password to view
              </p>
            </div>
            <Switch
              id="passwordToggle"
              checked={showPassword}
              onCheckedChange={setShowPassword}
            />
          </div>

          {showPassword && (
            <div>
              <Label htmlFor="password">Gallery Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={showPassword}
                minLength={4}
                placeholder="Enter password"
                className="mt-1"
              />
            </div>
          )}

          <div className="flex items-center justify-between py-4 border rounded-lg px-4">
            <div>
              <Label htmlFor="downloadToggle">Allow Downloads</Label>
              <p className="text-sm text-gray-500">
                Let clients download images
              </p>
            </div>
            <Switch
              id="downloadToggle"
              checked={downloadEnabled}
              onCheckedChange={setDownloadEnabled}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Creating...' : 'Create Gallery'}
          </Button>
        </form>
      </main>
    </>
  )
}
