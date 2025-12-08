'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Download, Check, ChevronDown, X } from 'lucide-react'
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

interface CinematicGalleryProps {
  title: string
  images: GalleryImage[]
  galleryId: string
  gallerySlug?: string
  downloadEnabled?: boolean
  totalFileSizeBytes?: number
  presentation?: PresentationData | null
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Get natural aspect ratio class
function getAspectClass(img: GalleryImage): string {
  if (!img.width || !img.height) return 'aspect-[3/4]'
  const ratio = img.width / img.height
  if (ratio > 1.4) return 'aspect-[3/2]' // Landscape
  if (ratio < 0.7) return 'aspect-[2/3]' // Portrait
  return 'aspect-[4/5]' // Near square
}

// Layout row types
type RowLayout = 'hero' | 'single-center' | 'trio-float' | 'duo-offset' | 'single-left' | 'single-right'

interface LayoutRow {
  type: RowLayout
  images: GalleryImage[]
}

function generateLayout(images: GalleryImage[]): LayoutRow[] {
  if (images.length === 0) return []
  
  const rows: LayoutRow[] = []
  let i = 0
  
  // Hero - first image
  if (images.length > 0) {
    rows.push({ type: 'hero', images: [images[0]] })
    i = 1
  }
  
  // Generate varied rows
  const patterns: RowLayout[] = ['trio-float', 'single-center', 'duo-offset', 'single-left', 'trio-float', 'single-right']
  let patternIdx = 0
  
  while (i < images.length) {
    const remaining = images.length - i
    const pattern = patterns[patternIdx % patterns.length]
    
    if (pattern === 'trio-float' && remaining >= 3) {
      rows.push({ type: 'trio-float', images: images.slice(i, i + 3) })
      i += 3
    } else if (pattern === 'duo-offset' && remaining >= 2) {
      rows.push({ type: 'duo-offset', images: images.slice(i, i + 2) })
      i += 2
    } else if (remaining >= 1) {
      // Single variations
      const singleType = patternIdx % 3 === 0 ? 'single-center' : patternIdx % 3 === 1 ? 'single-left' : 'single-right'
      rows.push({ type: singleType, images: [images[i]] })
      i += 1
    }
    
    patternIdx++
  }
  
  return rows
}

export function CinematicGallery({
  title,
  images,
  galleryId,
  gallerySlug,
  downloadEnabled = true,
  totalFileSizeBytes,
  presentation,
}: CinematicGalleryProps) {
  const [showCopied, setShowCopied] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  const rows = useMemo(() => generateLayout(images), [images])
  
  const coverImage = presentation?.coverImageId 
    ? images.find(img => img.id === presentation.coverImageId) || images[0]
    : images[0]
  
  const displayTitle = presentation?.coupleNames?.partner1 
    ? presentation.coupleNames.partner2
      ? `${presentation.coupleNames.partner1} & ${presentation.coupleNames.partner2}`
      : presentation.coupleNames.partner1
    : title
  
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {}
  }
  
  const handleDownload = () => {
    window.location.href = `/api/gallery/${galleryId}/download`
  }

  const openLightbox = (img: GalleryImage) => {
    const idx = images.findIndex(i => i.id === img.id)
    setLightboxIndex(idx >= 0 ? idx : 0)
    setLightboxImage(img)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'next' 
      ? Math.min(lightboxIndex + 1, images.length - 1)
      : Math.max(lightboxIndex - 1, 0)
    setLightboxIndex(newIndex)
    setLightboxImage(images[newIndex])
  }

  // Pure black editorial palette
  const bgColor = 'bg-black'
  const textColor = 'text-white'
  const accentColor = 'text-white'

  return (
    <div className={`min-h-screen ${bgColor}`}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-5 flex items-center justify-between">
        <Link 
          href={`/gallery/${gallerySlug || galleryId}`}
          className={`text-sm ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
        >
          ← Back
        </Link>
        
        <div className="flex items-center gap-6">
          <button
            onClick={handleShare}
            className={`text-sm ${textColor} opacity-60 hover:opacity-100 transition-opacity`}
          >
            {showCopied ? 'Copied!' : 'Share'}
          </button>
          
          {downloadEnabled && (
            <button
              onClick={handleDownload}
              className={`text-sm ${accentColor} hover:opacity-80 transition-opacity`}
            >
              Download
            </button>
          )}
        </div>
      </header>

      {/* Hero Section - Editorial split layout */}
      <section className="min-h-screen flex items-center justify-center px-8 pt-20 pb-16">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Cover Image with vertical text */}
          <div className="relative">
            {/* Vertical photographer credit - editorial style */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute -left-12 top-1/2 -translate-y-1/2 hidden lg:block"
            >
              <span className="text-[10px] text-white/30 uppercase tracking-[0.3em] whitespace-nowrap transform -rotate-90 block origin-center">
                Photos by 12img
              </span>
            </motion.div>
            
            {coverImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative cursor-pointer"
                onClick={() => openLightbox(coverImage)}
              >
                <div className={`relative ${getAspectClass(coverImage)} max-h-[75vh]`}>
                  <Image
                    src={coverImage.previewUrl || coverImage.thumbnailUrl}
                    alt=""
                    fill
                    className="object-cover"
                    style={{ objectPosition: `${coverImage.focalX ?? 50}% ${coverImage.focalY ?? 50}%` }}
                    priority
                    sizes="50vw"
                  />
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Title & Info - Editorial typography */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:pl-8"
          >
            {/* Large serif title */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight mb-8 leading-[1.1]">
              {displayTitle}
            </h1>
            
            {/* Thin divider line */}
            <div className="w-16 h-px bg-white/20 mb-8" />
            
            {/* Event date - elegant small caps */}
            {presentation?.eventDate && (
              <p className="text-sm text-white/50 tracking-widest uppercase mb-6">
                {formatDate(presentation.eventDate)}
              </p>
            )}
            
            {/* Subtitle / Location */}
            {presentation?.subtitle && (
              <p className="text-white/40 text-sm tracking-wide mb-8">
                {presentation.subtitle}
              </p>
            )}
            
            {/* Image count - minimal */}
            <p className="text-xs text-white/30 tracking-[0.2em] uppercase">
              {images.length} photographs
            </p>
            
            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="mt-16 hidden lg:block"
            >
              <ChevronDown className="w-5 h-5 text-white/20 animate-bounce" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Floating Images Grid */}
      <section className="pb-24">
        {rows.slice(1).map((row, idx) => (
          <RowRenderer
            key={idx}
            row={row}
            onImageClick={openLightbox}
            textColor={textColor}
          />
        ))}
      </section>

      {/* Footer - Editorial minimal */}
      <footer className="py-32 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          {/* Custom message in elegant italic */}
          {presentation?.customMessage && (
            <p className="text-xl text-white/50 mb-16 italic font-serif max-w-xl mx-auto leading-relaxed">
              "{presentation.customMessage}"
            </p>
          )}
          
          {/* Download CTA - minimal elegant */}
          {downloadEnabled && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-3 px-10 py-4 text-sm font-light tracking-widest uppercase border border-white/20 text-white/80 hover:bg-white hover:text-black transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Download All
              {totalFileSizeBytes && (
                <span className="opacity-50 ml-2">({formatFileSize(totalFileSizeBytes)})</span>
              )}
            </button>
          )}
          
          {/* Fin marker - editorial style */}
          <div className="mt-24 flex flex-col items-center gap-4">
            <div className="w-px h-12 bg-white/10" />
            <p className="text-[10px] text-white/20 uppercase tracking-[0.4em]">
              Fin
            </p>
          </div>
          
          {/* Branding - ultra subtle */}
          <p className="text-[9px] text-white/10 mt-16 uppercase tracking-[0.3em]">
            Crafted with 12img
          </p>
        </div>
      </footer>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxImage(null)}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 p-3 text-white/60 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('prev') }}
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white transition-colors z-10"
              >
                <ChevronDown className="w-8 h-8 rotate-90" />
              </button>
            )}
            {lightboxIndex < images.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); navigateLightbox('next') }}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-white/40 hover:text-white transition-colors z-10"
              >
                <ChevronDown className="w-8 h-8 -rotate-90" />
              </button>
            )}

            <motion.div
              key={lightboxImage.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxImage.previewUrl || lightboxImage.thumbnailUrl}
                alt=""
                width={lightboxImage.width || 1920}
                height={lightboxImage.height || 1080}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </motion.div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Row Renderer - Creates floating, asymmetric layouts
function RowRenderer({ 
  row, 
  onImageClick,
  textColor
}: { 
  row: LayoutRow
  onImageClick: (img: GalleryImage) => void
  textColor: string
}) {
  const FloatingImage = ({ img, className = '' }: { img: GalleryImage; className?: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.8 }}
      className={`relative cursor-pointer group ${className}`}
      onClick={() => onImageClick(img)}
    >
      <div className={`relative ${getAspectClass(img)} overflow-hidden`}>
        <Image
          src={img.previewUrl || img.thumbnailUrl}
          alt=""
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          style={{ objectPosition: `${img.focalX ?? 50}% ${img.focalY ?? 50}%` }}
          sizes="(max-width: 768px) 90vw, 40vw"
        />
      </div>
    </motion.div>
  )

  switch (row.type) {
    case 'trio-float':
      // Three images floating at different heights - like the reference
      return (
        <div className="px-8 md:px-16 py-16">
          <div className="max-w-7xl mx-auto flex flex-wrap md:flex-nowrap items-end gap-6 md:gap-8">
            <FloatingImage 
              img={row.images[0]} 
              className="w-full md:w-[30%] md:mb-20"
            />
            <FloatingImage 
              img={row.images[1]} 
              className="w-full md:w-[25%] md:mb-8"
            />
            <FloatingImage 
              img={row.images[2]} 
              className="w-full md:w-[35%] md:ml-auto"
            />
          </div>
        </div>
      )

    case 'duo-offset':
      // Two images, offset vertically
      return (
        <div className="px-8 md:px-16 py-16">
          <div className="max-w-5xl mx-auto flex flex-wrap md:flex-nowrap items-start gap-6 md:gap-12">
            <FloatingImage 
              img={row.images[0]} 
              className="w-full md:w-[45%] md:mt-24"
            />
            <FloatingImage 
              img={row.images[1]} 
              className="w-full md:w-[45%] md:ml-auto"
            />
          </div>
        </div>
      )

    case 'single-center':
      return (
        <div className="px-8 md:px-24 py-16">
          <div className="max-w-3xl mx-auto">
            <FloatingImage img={row.images[0]} />
          </div>
        </div>
      )

    case 'single-left':
      return (
        <div className="px-8 md:px-16 py-16">
          <div className="max-w-6xl">
            <FloatingImage 
              img={row.images[0]} 
              className="w-full md:w-[50%]"
            />
          </div>
        </div>
      )

    case 'single-right':
      return (
        <div className="px-8 md:px-16 py-16">
          <div className="max-w-6xl ml-auto">
            <FloatingImage 
              img={row.images[0]} 
              className="w-full md:w-[50%] md:ml-auto"
            />
          </div>
        </div>
      )

    default:
      return null
  }
}
