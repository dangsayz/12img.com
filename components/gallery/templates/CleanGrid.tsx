'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Download, Share2, Lock } from 'lucide-react'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  width: number | null
  height: number | null
}

interface CleanGridProps {
  images: GalleryImage[]
  galleryName: string
  photographerName?: string
  onImageClick?: (index: number) => void
  downloadEnabled?: boolean
}

export function CleanGrid({ 
  images, 
  galleryName, 
  photographerName,
  onImageClick,
  downloadEnabled = true 
}: CleanGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="py-12 text-center border-b border-stone-100">
        {photographerName && (
          <p className="text-xs uppercase tracking-[0.3em] text-stone-400 mb-4">
            {photographerName}
          </p>
        )}
        <h1 className="text-2xl font-light tracking-wide text-stone-900">
          {galleryName}
        </h1>
      </header>

      {/* True Masonry Grid using CSS columns */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((image, index) => {
            // Calculate aspect ratio from dimensions, default to 4:5 if unknown
            const aspectRatio = image.width && image.height 
              ? image.width / image.height 
              : 0.8
            
            return (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.4 }}
                className="relative bg-stone-100 cursor-pointer group overflow-hidden break-inside-avoid mb-4"
                style={{ aspectRatio: aspectRatio }}
                onMouseEnter={() => setHoveredId(image.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onImageClick?.(index)}
              >
                <Image
                  src={image.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                
                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredId === image.id ? 1 : 0 }}
                  className="absolute inset-0 bg-black/20 flex items-end justify-center pb-4"
                >
                  <div className="flex items-center gap-3">
                    <button className="w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                      <Heart className="w-4 h-4 text-stone-700" />
                    </button>
                    {downloadEnabled && (
                      <button className="w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                        <Download className="w-4 h-4 text-stone-700" />
                      </button>
                    )}
                    <button className="w-9 h-9 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                      <Share2 className="w-4 h-4 text-stone-700" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-stone-100">
        <p className="text-xs text-stone-400">
          © {new Date().getFullYear()} {photographerName || 'Photographer'}
        </p>
      </footer>
    </div>
  )
}
