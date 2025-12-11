'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Shield, Download, Loader2, AlertCircle, Image as ImageIcon, X } from 'lucide-react'
import { getVaultByAccessToken, getVaultImageUrl } from '@/server/actions/vault.actions'
import { formatBytes } from '@/lib/access/limits'

interface VaultData {
  id: string
  client_email: string
  client_name: string | null
  storage_used_bytes: number
  storage_limit_bytes: number
  image_count: number
  subscription_status: string
  expires_at: string | null
  vault_plans: {
    name: string
    storage_gb: number
  }
  vault_images: Array<{
    id: string
    storage_path: string
    original_filename: string
    file_size_bytes: number
    width: number | null
    height: number | null
  }>
}

export default function VaultViewPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vault, setVault] = useState<VaultData | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!token) {
      setError('Missing access token')
      setLoading(false)
      return
    }

    getVaultByAccessToken(token).then((result) => {
      if (result.error) {
        setError(result.error)
      } else if (result.vault) {
        setVault(result.vault as VaultData)
      }
      setLoading(false)
    })
  }, [token])

  const loadImageUrl = async (imageId: string) => {
    if (!token || imageUrls[imageId] || loadingImages.has(imageId)) return

    setLoadingImages((prev) => new Set([...prev, imageId]))

    const result = await getVaultImageUrl(token, imageId)
    if (result.success && result.url) {
      setImageUrls((prev) => ({ ...prev, [imageId]: result.url! }))
    }

    setLoadingImages((prev) => {
      const next = new Set(prev)
      next.delete(imageId)
      return next
    })
  }

  const handleDownload = async (imageId: string, filename: string) => {
    if (!token) return

    const result = await getVaultImageUrl(token, imageId)
    if (result.success && result.url) {
      const link = document.createElement('a')
      link.href = result.url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your vault...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">Unable to Access Vault</h1>
          <p className="text-stone-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!vault) return null

  const storagePercent = Math.round((vault.storage_used_bytes / vault.storage_limit_bytes) * 100)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-stone-900">Your Photo Vault</h1>
                <p className="text-sm text-stone-500">{vault.vault_plans.name} Plan</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-stone-900">{vault.image_count} photos</p>
              <p className="text-xs text-stone-500">
                {formatBytes(vault.storage_used_bytes)} of {vault.vault_plans.storage_gb}GB used
              </p>
            </div>
          </div>

          {/* Storage bar */}
          <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-stone-900 rounded-full transition-all"
              style={{ width: `${Math.min(storagePercent, 100)}%` }}
            />
          </div>
        </div>
      </header>

      {/* Gallery grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {vault.vault_images.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-stone-900 mb-2">No photos yet</h2>
            <p className="text-stone-500">Your photos will appear here once they&apos;re transferred.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {vault.vault_images.map((image) => (
              <div
                key={image.id}
                className="aspect-square relative group cursor-pointer bg-stone-200 rounded-lg overflow-hidden"
                onClick={() => {
                  setSelectedImage(image.id)
                  loadImageUrl(image.id)
                }}
                onMouseEnter={() => loadImageUrl(image.id)}
              >
                {imageUrls[image.id] ? (
                  <Image
                    src={imageUrls[image.id]}
                    alt={image.original_filename}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(image.id, image.original_filename)
                    }}
                    className="p-2 bg-white rounded-full shadow-lg hover:bg-stone-100 transition-colors"
                  >
                    <Download className="w-5 h-5 text-stone-900" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {imageUrls[selectedImage] ? (
            <Image
              src={imageUrls[selectedImage]}
              alt="Photo"
              fill
              className="object-contain p-4"
              sizes="100vw"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Loader2 className="w-10 h-10 animate-spin text-white" />
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                const image = vault.vault_images.find((i) => i.id === selectedImage)
                if (image) handleDownload(image.id, image.original_filename)
              }}
              className="px-4 py-2 bg-white text-stone-900 rounded-lg font-medium flex items-center gap-2 hover:bg-stone-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
