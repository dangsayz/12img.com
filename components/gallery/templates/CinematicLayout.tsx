'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Download, ChevronDown } from 'lucide-react'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  aspectRatio?: number
}

interface CinematicLayoutProps {
  images: GalleryImage[]
  galleryName: string
  galleryDate?: string
  photographerName?: string
  onImageClick?: (index: number) => void
  downloadEnabled?: boolean
}

export function CinematicLayout({ 
  images, 
  galleryName, 
  galleryDate,
  photographerName,
  onImageClick,
  downloadEnabled = true 
}: CinematicLayoutProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Create cinematic spreads - 2 small left + 1 large right, or variations
  const spreads = useMemo(() => {
    const result: GalleryImage[][] = []
    let i = 0
    
    while (i < images.length) {
      const remaining = images.length - i
      if (remaining >= 3) {
        result.push(images.slice(i, i + 3))
        i += 3
      } else {
        result.push(images.slice(i))
        i = images.length
      }
    }
    
    return result
  }, [images])

  // Extract dominant color from first image for background (simplified - use dark)
  const bgColor = 'bg-stone-900'

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Hero Cover */}
      <div className="relative h-screen flex items-center justify-center">
        {images[0] && (
          <div className="absolute inset-0">
            <Image
              src={images[0].previewUrl}
              alt=""
              fill
              className="object-cover opacity-30 blur-sm"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />
          </div>
        )}
        
        <div className="relative z-10 text-center text-white">
          {photographerName && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm uppercase tracking-[0.4em] text-white/60 mb-6 [writing-mode:vertical-lr] absolute -left-16 top-1/2 -translate-y-1/2"
            >
              Photos by {photographerName}
            </motion.p>
          )}
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-light tracking-wide mb-4"
          >
            {galleryName}
          </motion.h1>
          
          {galleryDate && (
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-white/60"
            >
              {galleryDate}
            </motion.p>
          )}
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            <ChevronDown className="w-8 h-8 text-white/40" />
          </motion.div>
        </motion.div>
      </div>

      {/* Cinematic Spreads */}
      <div className="px-8 md:px-16 py-16 space-y-16">
        {spreads.map((spread, spreadIndex) => (
          <motion.div
            key={spreadIndex}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className={`
              grid gap-4
              ${spread.length === 3 
                ? 'grid-cols-3 grid-rows-2' 
                : spread.length === 2 
                  ? 'grid-cols-2' 
                  : 'grid-cols-1'
              }
            `}
            style={{ minHeight: '70vh' }}
          >
            {spread.map((image, imageIndex) => {
              const globalIndex = spreads.slice(0, spreadIndex).reduce((acc, s) => acc + s.length, 0) + imageIndex
              const isLarge = spread.length === 3 && imageIndex === 2
              
              return (
                <motion.div
                  key={image.id}
                  className={`
                    relative group cursor-pointer overflow-hidden
                    ${isLarge ? 'col-start-2 col-end-4 row-span-2' : ''}
                  `}
                  onMouseEnter={() => setHoveredId(image.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onImageClick?.(globalIndex)}
                >
                  {/* White Border Frame */}
                  <div className="absolute inset-0 border-4 border-white/10 z-10 pointer-events-none" />
                  
                  <Image
                    src={image.previewUrl}
                    alt=""
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes={isLarge ? '60vw' : '30vw'}
                  />
                  
                  {/* Hover Actions */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredId === image.id ? 1 : 0 }}
                    className="absolute inset-0 bg-black/30 flex items-end justify-center pb-8 z-20"
                  >
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                        <Heart className="w-5 h-5" />
                      </button>
                      {downloadEnabled && (
                        <button className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <footer className="py-16 text-center">
        <p className="text-sm text-white/30">
          © {new Date().getFullYear()} {photographerName}
        </p>
      </footer>
    </div>
  )
}
