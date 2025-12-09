'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ExternalLink, 
  Share2, 
  Settings2, 
  Copy, 
  Check,
  Mail,
  Eye
} from 'lucide-react'

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
  const [stage, setStage] = useState<'loading' | 'reveal' | 'ready'>('loading')
  const [copied, setCopied] = useState(false)
  
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/view-reel/${gallery.slug}`

  // Orchestrate the reveal animation
  useEffect(() => {
    // Stage 1: Loading animation
    const revealTimer = setTimeout(() => {
      setStage('reveal')
    }, 800)

    // Stage 2: Full reveal
    const readyTimer = setTimeout(() => {
      setStage('ready')
    }, 2000)

    return () => {
      clearTimeout(revealTimer)
      clearTimeout(readyTimer)
    }
  }, [])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewGallery = () => {
    router.push(`/view-reel/${gallery.slug}`)
  }

  return (
    <div className="fixed inset-0 bg-stone-950 overflow-hidden">
      {/* Background - Blurred cover image */}
      <AnimatePresence>
        {coverImage && stage !== 'loading' && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image
              src={coverImage.previewUrl || coverImage.thumbnailUrl}
              alt=""
              fill
              className="object-cover blur-2xl"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/60 to-stone-950/90" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        
        {/* Stage 1: Loading */}
        <AnimatePresence mode="wait">
          {stage === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-2 border-white/20 border-t-white/80 rounded-full mx-auto mb-6"
              />
              <p className="text-white/60 text-sm tracking-[0.2em] uppercase">
                Preparing your gallery
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage 2 & 3: Reveal & Ready */}
        <AnimatePresence>
          {(stage === 'reveal' || stage === 'ready') && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-full max-w-4xl"
            >
              {/* Success checkmark */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.2 
                }}
                className="flex justify-center mb-8"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
                  >
                    <Check className="w-8 h-8 text-emerald-400" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-center mb-12"
              >
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">
                  {gallery.title}
                </h1>
                <p className="text-white/50 text-lg">
                  {gallery.imageCount} photos • Ready to share
                </p>
              </motion.div>

              {/* Preview Grid */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="mb-12"
              >
                <div className="grid grid-cols-3 gap-2 max-w-2xl mx-auto">
                  {previewImages.slice(0, 6).map((img, index) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ 
                        delay: 0.6 + index * 0.1,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className="relative aspect-square rounded-lg overflow-hidden bg-white/5"
                    >
                      {img.thumbnailUrl && (
                        <Image
                          src={img.thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 33vw, 200px"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {gallery.imageCount > 6 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-center text-white/40 text-sm mt-4"
                  >
                    +{gallery.imageCount - 6} more photos
                  </motion.p>
                )}
              </motion.div>

              {/* Share URL */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="max-w-xl mx-auto mb-10"
              >
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
                  <div className="flex-1 px-4 py-2 text-white/70 text-sm truncate font-mono">
                    {shareUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                {/* Primary: View Gallery */}
                <button
                  onClick={handleViewGallery}
                  className="group flex items-center gap-3 px-8 py-4 bg-white text-stone-900 rounded-xl font-medium hover:bg-white/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Eye className="w-5 h-5" />
                  <span>View Gallery</span>
                  <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Secondary Actions */}
                <div className="flex items-center gap-3">
                  <Link
                    href={`/gallery/${gallery.id}`}
                    className="flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                  >
                    <Settings2 className="w-5 h-5" />
                    <span>Customize</span>
                  </Link>
                  
                  <button
                    onClick={() => {
                      // Could open a share modal or email composer
                      window.open(`mailto:?subject=${encodeURIComponent(gallery.title)}&body=${encodeURIComponent(`View the gallery: ${shareUrl}`)}`, '_blank')
                    }}
                    className="flex items-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Email</span>
                  </button>
                </div>
              </motion.div>

              {/* Subtle branding */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-center text-white/20 text-xs mt-16 tracking-[0.3em] uppercase"
              >
                Powered by 12img
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
