'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Share2, Download, Check, ChevronDown, Heart, X } from 'lucide-react'
import { type PresentationData } from '@/lib/types/presentation'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width?: number | null
  height?: number | null
  focalX?: number | null
  focalY?: number | null
}

interface EditorialGalleryProps {
  title: string
  images: GalleryImage[]
  galleryId: string
  gallerySlug?: string
  downloadEnabled?: boolean
  totalFileSizeBytes?: number
  presentation?: PresentationData | null
}

// Format bytes to human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

// Format date nicely
function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

// Determine if image is portrait
function isPortrait(img: GalleryImage): boolean {
  if (!img.width || !img.height) return false
  return img.height > img.width
}

// Layout types for spreads
type SpreadLayout = 
  | 'hero'           // Full width hero
  | 'single-large'   // Single large centered image
  | 'split'          // Two images side by side
  | 'trio'           // Three images in row
  | 'collage-left'   // Large left, two stacked right
  | 'collage-right'  // Two stacked left, large right
  | 'quad'           // 2x2 grid
  | 'featured'       // One large with text

interface Spread {
  layout: SpreadLayout
  images: GalleryImage[]
}

// Generate editorial spreads from images
function generateSpreads(images: GalleryImage[]): Spread[] {
  if (images.length === 0) return []
  
  const spreads: Spread[] = []
  let i = 0
  
  // First image is always hero
  if (images.length > 0) {
    spreads.push({ layout: 'hero', images: [images[0]] })
    i = 1
  }
  
  // Generate varied layouts for remaining images
  while (i < images.length) {
    const remaining = images.length - i
    const spreadIndex = spreads.length
    
    // Vary layouts based on position and available images
    if (remaining >= 3 && spreadIndex % 5 === 1) {
      // Collage layout
      const isLeft = spreadIndex % 2 === 0
      spreads.push({ 
        layout: isLeft ? 'collage-left' : 'collage-right', 
        images: images.slice(i, i + 3) 
      })
      i += 3
    } else if (remaining >= 4 && spreadIndex % 7 === 3) {
      // Quad grid
      spreads.push({ layout: 'quad', images: images.slice(i, i + 4) })
      i += 4
    } else if (remaining >= 3 && spreadIndex % 4 === 2) {
      // Trio
      spreads.push({ layout: 'trio', images: images.slice(i, i + 3) })
      i += 3
    } else if (remaining >= 2 && spreadIndex % 3 === 0) {
      // Split
      spreads.push({ layout: 'split', images: images.slice(i, i + 2) })
      i += 2
    } else if (remaining >= 1) {
      // Single large
      spreads.push({ layout: 'single-large', images: [images[i]] })
      i += 1
    }
  }
  
  return spreads
}

export function EditorialGallery({
  title,
  images,
  galleryId,
  gallerySlug,
  downloadEnabled = true,
  totalFileSizeBytes,
  presentation,
}: EditorialGalleryProps) {
  const [showCopied, setShowCopied] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)
  
  const spreads = useMemo(() => generateSpreads(images), [images])
  
  // Get cover image (first image or specified)
  const coverImage = presentation?.coverImageId 
    ? images.find(img => img.id === presentation.coverImageId) || images[0]
    : images[0]
  
  // Display title
  const displayTitle = presentation?.coupleNames?.partner1 
    ? presentation.coupleNames.partner2
      ? `${presentation.coupleNames.partner1} & ${presentation.coupleNames.partner2}`
      : presentation.coupleNames.partner1
    : title
  
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {}
  }
  
  const handleDownload = () => {
    window.location.href = `/api/gallery/${galleryId}/download`
  }

  // Color scheme
  const isDark = presentation?.colorScheme === 'dark' || presentation?.colorScheme === 'warm'
  const bgColor = isDark ? 'bg-stone-950' : 'bg-stone-100'
  const textColor = isDark ? 'text-white' : 'text-stone-900'
  const mutedColor = isDark ? 'text-white/60' : 'text-stone-500'
  const borderColor = isDark ? 'border-white/10' : 'border-stone-200'

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      {/* Fixed Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 ${isDark ? 'bg-stone-950/80' : 'bg-stone-100/80'} backdrop-blur-xl border-b ${borderColor}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link 
            href={`/view-reel/${gallerySlug || galleryId}`}
            className={`text-sm font-medium ${mutedColor} hover:${textColor} transition-colors`}
          >
            ← Back
          </Link>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 text-sm ${mutedColor} hover:${textColor} transition-colors`}
            >
              {showCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{showCopied ? 'Copied!' : 'Share'}</span>
            </button>
            
            {downloadEnabled && (
              <button
                onClick={handleDownload}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-stone-900 text-white hover:bg-stone-800'} transition-colors`}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-6xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          {/* Cover Image */}
          {coverImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="relative aspect-[3/4] max-h-[70vh] mx-auto lg:mx-0"
            >
              <Image
                src={coverImage.previewUrl || coverImage.thumbnailUrl}
                alt=""
                fill
                className="object-cover"
                style={{
                  objectPosition: `${coverImage.focalX ?? 50}% ${coverImage.focalY ?? 50}%`
                }}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </motion.div>
          )}
          
          {/* Title & Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left"
          >
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight mb-6">
              {displayTitle}
            </h1>
            
            {presentation?.eventDate && (
              <p className={`text-lg ${mutedColor} mb-4`}>
                {formatDate(presentation.eventDate)}
              </p>
            )}
            
            {presentation?.subtitle && (
              <p className={`text-lg ${mutedColor} italic mb-6`}>
                {presentation.subtitle}
              </p>
            )}
            
            {(presentation?.venue || presentation?.location) && (
              <p className={`text-sm ${mutedColor} uppercase tracking-widest`}>
                {[presentation.venue, presentation.location].filter(Boolean).join(' · ')}
              </p>
            )}
            
            <p className={`text-sm ${mutedColor} mt-8`}>
              {images.length} images in the gallery
            </p>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown className={`w-6 h-6 ${mutedColor} animate-bounce`} />
        </motion.div>
      </section>

      {/* Quote Section */}
      {presentation?.quote && (
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="font-serif text-2xl sm:text-3xl italic leading-relaxed">
              "{presentation.quote}"
            </blockquote>
            {presentation.quoteAttribution && (
              <cite className={`block mt-6 text-sm ${mutedColor} not-italic uppercase tracking-widest`}>
                — {presentation.quoteAttribution}
              </cite>
            )}
          </div>
        </section>
      )}

      {/* Editorial Spreads */}
      <section className="pb-20">
        {spreads.slice(1).map((spread, idx) => (
          <SpreadRenderer
            key={idx}
            spread={spread}
            isDark={isDark}
            onImageClick={setLightboxImage}
          />
        ))}
      </section>

      {/* Footer */}
      <footer className={`py-20 px-6 border-t ${borderColor}`}>
        <div className="max-w-4xl mx-auto text-center">
          {presentation?.customMessage && (
            <p className={`text-lg ${mutedColor} mb-8 italic`}>
              {presentation.customMessage}
            </p>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <Heart className={`w-5 h-5 ${mutedColor}`} />
          </div>
          
          {downloadEnabled && (
            <button
              onClick={handleDownload}
              className={`inline-flex items-center gap-3 px-8 py-4 text-sm font-medium ${isDark ? 'bg-white text-black hover:bg-white/90' : 'bg-stone-900 text-white hover:bg-stone-800'} transition-colors`}
            >
              <Download className="w-5 h-5" />
              Download All {images.length} Photos
              {totalFileSizeBytes && (
                <span className="opacity-60">({formatFileSize(totalFileSizeBytes)})</span>
              )}
            </button>
          )}
          
          <p className={`text-xs ${mutedColor} mt-12 uppercase tracking-widest`}>
            Crafted with 12img
          </p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-6 right-6 p-3 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <Image
            src={lightboxImage.previewUrl || lightboxImage.thumbnailUrl}
            alt=""
            width={lightboxImage.width || 1920}
            height={lightboxImage.height || 1080}
            className="max-w-full max-h-[90vh] object-contain"
            style={{
              objectPosition: `${lightboxImage.focalX ?? 50}% ${lightboxImage.focalY ?? 50}%`
            }}
          />
        </motion.div>
      )}
    </div>
  )
}

// Spread Renderer Component
function SpreadRenderer({ 
  spread, 
  isDark,
  onImageClick 
}: { 
  spread: Spread
  isDark: boolean
  onImageClick: (img: GalleryImage) => void
}) {
  const padding = 'px-6 md:px-12 lg:px-20'
  const gap = 'gap-4 md:gap-6'
  
  const ImageWrapper = ({ img, className = '', aspectRatio = 'aspect-[4/5]' }: { 
    img: GalleryImage
    className?: string
    aspectRatio?: string
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden cursor-pointer group ${aspectRatio} ${className}`}
      onClick={() => onImageClick(img)}
    >
      <Image
        src={img.previewUrl || img.thumbnailUrl}
        alt=""
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        style={{
          objectPosition: `${img.focalX ?? 50}% ${img.focalY ?? 50}%`
        }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </motion.div>
  )

  switch (spread.layout) {
    case 'single-large':
      return (
        <div className={`py-8 md:py-16 ${padding}`}>
          <div className="max-w-4xl mx-auto">
            <ImageWrapper 
              img={spread.images[0]} 
              aspectRatio={isPortrait(spread.images[0]) ? 'aspect-[3/4]' : 'aspect-[4/3]'}
            />
          </div>
        </div>
      )

    case 'split':
      return (
        <div className={`py-8 md:py-16 ${padding}`}>
          <div className={`max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 ${gap}`}>
            {spread.images.map((img, i) => (
              <ImageWrapper 
                key={img.id} 
                img={img}
                aspectRatio="aspect-[4/5]"
              />
            ))}
          </div>
        </div>
      )

    case 'trio':
      return (
        <div className={`py-8 md:py-16 ${padding}`}>
          <div className={`max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 ${gap}`}>
            {spread.images.map((img) => (
              <ImageWrapper 
                key={img.id} 
                img={img}
                aspectRatio="aspect-square"
              />
            ))}
          </div>
        </div>
      )

    case 'collage-left':
      return (
        <div className={`py-8 md:py-16 ${padding}`}>
          <div className={`max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 ${gap}`}>
            <ImageWrapper 
              img={spread.images[0]}
              aspectRatio="aspect-[3/4]"
              className="md:row-span-2"
            />
            <div className={`grid grid-cols-1 ${gap}`}>
              {spread.images.slice(1, 3).map((img) => (
                <ImageWrapper 
                  key={img.id} 
                  img={img}
                  aspectRatio="aspect-[4/3]"
                />
              ))}
            </div>
          </div>
        </div>
      )

    case 'collage-right':
      return (
        <div className={`py-8 md:py-16 ${padding}`}>
          <div className={`max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 ${gap}`}>
            <div className={`grid grid-cols-1 ${gap} order-2 md:order-1`}>
              {spread.images.slice(1, 3).map((img) => (
                <ImageWrapper 
                  key={img.id} 
                  img={img}
                  aspectRatio="aspect-[4/3]"
                />
              ))}
            </div>
            <ImageWrapper 
              img={spread.images[0]}
              aspectRatio="aspect-[3/4]"
              className="md:row-span-2 order-1 md:order-2"
            />
          </div>
        </div>
      )

    case 'quad':
      return (
        <div className={`py-8 md:py-16 ${padding}`}>
          <div className={`max-w-5xl mx-auto grid grid-cols-2 ${gap}`}>
            {spread.images.map((img) => (
              <ImageWrapper 
                key={img.id} 
                img={img}
                aspectRatio="aspect-square"
              />
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}
