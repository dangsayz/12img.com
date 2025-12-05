'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import { Download, ChevronDown, Image as ImageIcon } from 'lucide-react'
import { FullscreenViewer } from './FullscreenViewer'

interface Image {
  id: string
  signedUrl: string
  width?: number | null
  height?: number | null
}

interface PublicGalleryViewProps {
  title: string
  images: Image[]
  downloadEnabled?: boolean
  photographerName?: string
}

// Animated image card with scroll reveal
function GalleryImage({ 
  image, 
  index, 
  onClick,
  priority = false
}: { 
  image: Image
  index: number
  onClick: () => void
  priority?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  
  // Determine aspect ratio for sizing
  const aspectRatio = image.width && image.height 
    ? image.width / image.height 
    : 1
  
  // Make some images larger for visual interest
  const isHero = index === 0 || (index > 0 && index % 7 === 0)
  const isVertical = aspectRatio < 0.8
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ 
        duration: 0.6, 
        delay: priority ? 0 : Math.min(index * 0.05, 0.3),
        ease: [0.25, 0.1, 0.25, 1]
      }}
      className={`group relative ${isHero ? 'col-span-2 row-span-2' : ''} ${isVertical && !isHero ? 'row-span-2' : ''}`}
      style={{ breakInside: 'avoid' }}
    >
      <div 
        className="relative overflow-hidden rounded-2xl bg-white shadow-soft cursor-pointer transition-all duration-500 hover:shadow-soft-xl hover:-translate-y-1"
        onClick={onClick}
      >
        {/* Image container with padding for frame effect */}
        <div className="p-2">
          <div className="relative overflow-hidden rounded-xl">
            <img
              src={image.signedUrl}
              alt=""
              loading={priority ? 'eager' : 'lazy'}
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
              style={{
                aspectRatio: aspectRatio || 'auto',
              }}
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>
        
        {/* Subtle frame border */}
        <div className="absolute inset-0 rounded-2xl border border-gray-100 pointer-events-none" />
      </div>
    </motion.div>
  )
}

export function PublicGalleryView({ 
  title, 
  images, 
  downloadEnabled = false,
  photographerName 
}: PublicGalleryViewProps) {
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const heroRef = useRef<HTMLDivElement>(null)
  
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0])
  const heroScale = useTransform(scrollY, [0, 400], [1, 1.1])
  const heroY = useTransform(scrollY, [0, 400], [0, 100])

  const handleImageClick = useCallback((index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])

  const handleViewerClose = useCallback(() => {
    setViewerOpen(false)
  }, [])

  const handleViewerNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      setViewerIndex((current) => {
        if (direction === 'prev') {
          return current > 0 ? current - 1 : images.length - 1
        }
        return current < images.length - 1 ? current + 1 : 0
      })
    },
    [images.length]
  )

  const scrollToGallery = () => {
    document.getElementById('gallery-grid')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Get cover image (first image)
  const coverImage = images[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FA] via-[#F5F6F8] to-[#F2F3F5]">
      {/* Hero Section - Full viewport with cover image */}
      <section 
        ref={heroRef}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* Background image with parallax */}
        <motion.div 
          className="absolute inset-0"
          style={{ scale: heroScale, y: heroY }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-10" />
          <img
            src={coverImage?.signedUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Content overlay */}
        <motion.div 
          className="relative z-20 text-center px-4"
          style={{ opacity: heroOpacity }}
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Gallery title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-white tracking-tight mb-4">
              {title}
            </h1>
            
            {/* Photographer credit */}
            {photographerName && (
              <p className="text-white/70 text-sm md:text-base tracking-widest uppercase mb-8">
                by {photographerName}
              </p>
            )}

            {/* Image count badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-sm">
              <ImageIcon className="w-4 h-4" />
              <span>{images.length} images</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToGallery}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <span className="text-xs tracking-widest uppercase">Scroll to view</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </section>

      {/* Sticky header that appears on scroll */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-3">
            {/* Breadcrumb navigation */}
            <nav className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Gallery</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{title}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">
              {images.length} photos
            </span>
            
            {downloadEnabled && (
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download All</span>
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Gallery Grid */}
      <section id="gallery-grid" className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
        {/* Section intro */}
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-3">
            The Collection
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Click any image to view in full screen
          </p>
        </motion.div>

        {/* Masonry-style grid */}
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {images.map((image, index) => (
            <GalleryImage
              key={image.id}
              image={image}
              index={index}
              onClick={() => handleImageClick(index)}
              priority={index < 4}
            />
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white/50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-soft-lime flex items-center justify-center text-xs font-bold text-gray-900">
                12
              </div>
              <span>Powered by 12img</span>
            </div>
            <p>© {new Date().getFullYear()} All rights reserved</p>
          </div>
        </div>
      </footer>

      {/* Fullscreen Viewer */}
      {viewerOpen && (
        <FullscreenViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={handleViewerClose}
          onNavigate={handleViewerNavigate}
        />
      )}
    </div>
  )
}
