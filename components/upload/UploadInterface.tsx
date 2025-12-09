'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'
import { UploadZoneV2 } from './UploadZoneV2'

interface UploadInterfaceProps {
  gallery: {
    id: string
    title: string
    slug: string
  }
  images: any[]
}

export function UploadInterface({ gallery, images }: UploadInterfaceProps) {
  const router = useRouter()

  // Handle upload completion - redirect to cinematic reveal
  const handleUploadComplete = () => {
    router.push(`/gallery/${gallery.id}/ready`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Desktop: Back with text */}
            <Link 
              href={`/gallery/${gallery.id}`}
              className="hidden sm:flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            {/* Mobile: X button - large touch target */}
            <Link 
              href={`/gallery/${gallery.id}`}
              className="sm:hidden flex items-center justify-center w-10 h-10 -ml-2 text-stone-500 hover:text-stone-900 active:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </Link>
            <div className="h-4 w-px bg-stone-200 hidden sm:block" />
            <h1 className="text-sm font-medium text-stone-900 truncate max-w-[200px] sm:max-w-none">{gallery.title}</h1>
          </div>
          <p className="text-xs text-stone-400 tracking-wide uppercase">
            {images.length} Photos
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Upload Zone */}
        <section className="border-b border-stone-100">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-light text-stone-900 mb-2">Add to Collection</h2>
              <p className="text-sm text-stone-400">Drag and drop or click to browse</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-8">
              <UploadZoneV2 
                galleryId={gallery.id} 
                onUploadComplete={handleUploadComplete} 
              />
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
