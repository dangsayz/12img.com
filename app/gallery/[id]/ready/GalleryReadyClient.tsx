'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence, useSpring } from 'framer-motion'
import { 
  Settings2, 
  Copy, 
  Check,
  Mail,
  ArrowRight
} from 'lucide-react'

// Apple-style easing (typed as tuples for Framer Motion)
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1]

interface GalleryReadyClientProps {
  gallery: {
    id: string
    title: string
    slug: string
    imageCount: number
  }
  coverImage: {
    id: string
    thumbnailUrl: string
    previewUrl: string
    width?: number
    height?: number
  } | null
  previewImages: Array<{
    id: string
    thumbnailUrl: string
    previewUrl: string
  }>
  photographerName: string
}

export function GalleryReadyClient({ 
  gallery, 
  coverImage, 
  previewImages,
  photographerName 
}: GalleryReadyClientProps) {
  const router = useRouter()
  const [stage, setStage] = useState<'initial' | 'reveal' | 'complete'>('initial')
  const [copied, setCopied] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/view-reel/${gallery.slug}`

  // Determine if image is portrait or landscape
  const isPortrait = coverImage?.width && coverImage?.height 
    ? coverImage.height > coverImage.width 
    : true // Default to portrait treatment

  // Spring animations for smooth values
  const imageScale = useSpring(1.15, { stiffness: 100, damping: 30 })
  const imageOpacity = useSpring(0, { stiffness: 100, damping: 30 })

  // Orchestrate the reveal animation
  useEffect(() => {
    // Wait for image to load before starting reveal
    const startReveal = () => {
      // Stage 1: Initial pause
      const revealTimer = setTimeout(() => {
        setStage('reveal')
        imageScale.set(1)
        imageOpacity.set(1)
      }, 600)

      // Stage 2: Complete - show all UI
      const completeTimer = setTimeout(() => {
        setStage('complete')
      }, 1800)

      return () => {
        clearTimeout(revealTimer)
        clearTimeout(completeTimer)
      }
    }

    if (imageLoaded || !coverImage) {
      return startReveal()
    }
  }, [imageLoaded, coverImage, imageScale, imageOpacity])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewGallery = () => {
    router.push(`/view-reel/${gallery.slug}`)
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-white overflow-hidden"
    >
      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main content */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Initial loading state */}
        <AnimatePresence mode="wait">
          {stage === 'initial' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 48 }}
                  transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
                  className="h-[1px] bg-stone-300 mx-auto mb-6"
                />
                <p className="text-stone-400 text-[10px] tracking-[0.3em] uppercase font-light">
                  Preparing
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reveal content */}
        <AnimatePresence>
          {stage !== 'initial' && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="h-full flex flex-col items-center justify-center px-6 py-12"
            >
              {/* Hero Image Container */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
                className={`relative ${isPortrait ? 'w-full max-w-[320px] md:max-w-[380px]' : 'w-full max-w-[600px] md:max-w-[720px]'}`}
              >
                {/* Elegant frame */}
                <div className="relative">
                  {/* Outer shadow frame */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute -inset-4 md:-inset-6 border border-stone-100"
                  />
                  
                  {/* Image container with aspect ratio */}
                  <motion.div
                    className={`relative ${isPortrait ? 'aspect-[3/4]' : 'aspect-[4/3]'} bg-stone-50 overflow-hidden`}
                    style={{
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.08), 0 12px 24px -8px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    {coverImage && (
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          scale: imageScale,
                          opacity: imageOpacity,
                        }}
                      >
                        <Image
                          src={coverImage.previewUrl || coverImage.thumbnailUrl}
                          alt={gallery.title}
                          fill
                          className="object-cover"
                          priority
                          onLoad={() => setImageLoaded(true)}
                          sizes="(max-width: 768px) 320px, 380px"
                        />
                      </motion.div>
                    )}
                    
                    {/* Subtle vignette */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/[0.02] via-transparent to-black/[0.01]" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title & Meta */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8, ease: EASE_OUT_EXPO }}
                className="text-center mt-10 md:mt-12"
              >
                {/* Gallery title */}
                <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-900 tracking-[-0.02em] font-light">
                  {gallery.title}
                </h1>
                
                {/* Elegant divider */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: EASE_OUT_EXPO }}
                  className="w-12 h-[1px] bg-stone-200 mx-auto mt-6 mb-4"
                />
                
                {/* Meta info */}
                <p className="text-stone-400 text-[11px] tracking-[0.2em] uppercase font-light">
                  {gallery.imageCount} {gallery.imageCount === 1 ? 'photograph' : 'photographs'}
                </p>
              </motion.div>

              {/* Actions - appear after complete */}
              <AnimatePresence>
                {stage === 'complete' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
                    className="mt-10 md:mt-12 w-full max-w-md"
                  >
                    {/* Share URL */}
                    <div className="flex items-center gap-2 bg-stone-50 border border-stone-100 rounded-lg p-1.5 mb-6">
                      <div className="flex-1 px-3 py-2 text-stone-500 text-xs truncate font-mono">
                        {shareUrl}
                      </div>
                      <motion.button
                        onClick={handleCopyLink}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 hover:border-stone-300 rounded-md text-stone-700 text-xs font-medium transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-stone-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Primary CTA */}
                    <motion.button
                      onClick={handleViewGallery}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="group w-full flex items-center justify-center gap-3 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      <span>View Gallery</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </motion.button>

                    {/* Secondary actions */}
                    <div className="flex items-center justify-center gap-6 mt-6">
                      <Link
                        href={`/gallery/${gallery.id}`}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 text-xs font-medium transition-colors"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                        <span>Customize</span>
                      </Link>
                      
                      <div className="w-[1px] h-3 bg-stone-200" />
                      
                      <button
                        onClick={() => {
                          window.open(`mailto:?subject=${encodeURIComponent(gallery.title)}&body=${encodeURIComponent(`View the gallery: ${shareUrl}`)}`, '_blank')
                        }}
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-700 text-xs font-medium transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>Email</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Subtle branding */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: stage === 'complete' ? 1 : 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="absolute bottom-6 left-0 right-0 text-center"
              >
                <p className="text-stone-300 text-[9px] tracking-[0.25em] uppercase font-light">
                  12img
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
