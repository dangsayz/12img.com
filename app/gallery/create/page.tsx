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
      } else if (result.slug) {
        router.push(`/gallery/${result.slug}/upload`)
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <main className="container mx-auto px-4 py-12 flex justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Create Gallery</h1>
            <p className="text-sm text-gray-500 mt-2">Set up your new gallery. You can add images in the next step.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">Gallery Title</Label>
              <Input
                id="title"
                name="title"
                required
                maxLength={100}
                placeholder="e.g. Sarah & James Wedding"
                className="h-12 px-4 rounded-xl border-gray-200 bg-gray-50 focus:bg-white transition-all duration-200 font-medium"
              />
            </div>

            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="passwordToggle" className="text-base font-medium text-gray-900">Password Protection</Label>
                  <p className="text-xs text-gray-500">
                    Require a password to view this gallery
                  </p>
                </div>
                <Switch
                  id="passwordToggle"
                  checked={showPassword}
                  onCheckedChange={setShowPassword}
                />
              </div>

              {showPassword && (
                <div className="pl-4 border-l-2 border-gray-100">
                  <Label htmlFor="password">Gallery Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required={showPassword}
                    minLength={4}
                    placeholder="Enter secure password"
                    className="mt-2 h-11 rounded-xl"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="downloadToggle" className="text-base font-medium text-gray-900">Allow Downloads</Label>
                  <p className="text-xs text-gray-500">
                    Visitors can download full-resolution images
                  </p>
                </div>
                <Switch
                  id="downloadToggle"
                  checked={downloadEnabled}
                  onCheckedChange={setDownloadEnabled}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isPending} 
              className="w-full h-12 rounded-full text-base font-medium shadow-sm hover:shadow-md transition-all bg-black hover:bg-gray-800"
            >
              {isPending ? 'Creating...' : 'Create Gallery'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
