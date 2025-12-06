
'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Share2, Download, Check, Heart, ArrowRight, ChevronLeft, ChevronRight, ImageDown } from 'lucide-react'
import Link from 'next/link'

interface ReelImage {
  id: string
  url: string
  width: number
  height: number
}

interface ReelPlayerProps {
  images: ReelImage[]
  title: string
  photographerName?: string
  galleryId: string
  gallerySlug?: string
  totalImageCount?: number
  totalFileSizeBytes?: number
  downloadEnabled?: boolean
}

// Format bytes to human-readable size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export function ReelPlayer({ 
  images, 
  title, 
  photographerName, 
  galleryId, 
  gallerySlug,
  totalImageCount,
  totalFileSizeBytes,
  downloadEnabled = true
}: ReelPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [showCopied, setShowCopied] = useState(false)
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false)
  const progressRef = useRef(0)
  const startTimeRef = useRef(Date.now())
  const router = useRouter()
  
  const closeHref = `/gallery/${gallerySlug || galleryId}`
  
  // Instant close handler
  const handleClose = useCallback(() => {
    router.push(closeHref)
  }, [router, closeHref])
  
  // Escape key handler for instant exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose])
  const fullAlbumCount = totalImageCount || images.length
  
  // Reel settings
  const DURATION_PER_SLIDE = 3000 // 3 seconds per slide for more immersive feel
  const TOTAL_SLIDES = Math.min(images.length, 12)
  const reelImages = images.slice(0, TOTAL_SLIDES)
  
  // Curated captions for an emotional journey
  const getCaptionForIndex = (idx: number) => {
    const captions = [
      "A story begins...",
      "Every detail matters",
      "Moments frozen in time",
      "The joy in between",
      "Love, captured",
      "Memories to cherish",
      "Pure magic",
      "Timeless beauty",
      "The little things",
      "Forever starts here",
      "Your story",
      "...to be continued"
    ]
    return captions[idx % captions.length]
  }

  // Timer logic
  useEffect(() => {
    if (!isPlaying || currentIndex >= reelImages.length) return

    startTimeRef.current = Date.now() - (progressRef.current / 100) * DURATION_PER_SLIDE
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / DURATION_PER_SLIDE) * 100, 100)
      progressRef.current = newProgress
      setProgress(newProgress)
      
      if (newProgress >= 100) {
        progressRef.current = 0
        if (currentIndex < reelImages.length - 1) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setIsPlaying(false)
        }
      }
    }, 16)

    return () => clearInterval(interval)
  }, [currentIndex, isPlaying, reelImages.length])

  // Reset progress when index changes
  useEffect(() => {
    progressRef.current = 0
    setProgress(0)
    startTimeRef.current = Date.now()
  }, [currentIndex])

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      await navigator.clipboard.writeText(url)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch {}
  }

  const handleDownloadClick = () => {
    setShowDownloadPrompt(true)
    setIsPlaying(false)
  }

  const confirmDownload = () => {
    setShowDownloadPrompt(false)
    window.location.href = `/api/gallery/${galleryId}/download`
  }

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  const goNext = useCallback(() => {
    if (currentIndex < reelImages.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setIsPlaying(false)
    }
  }, [currentIndex, reelImages.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  // Handle tap zones: left 30% = prev, right 70% = next
  const handleImageClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    
    if (x < width * 0.3) {
      goPrev()
    } else {
      goNext()
    }
  }

  const isEnded = currentIndex >= reelImages.length - 1 && !isPlaying

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-hidden">
      
      {/* Heaven White Background */}
      {reelImages[currentIndex] && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={reelImages[currentIndex].url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-125 blur-[120px] opacity-25 saturate-50"
          />
          <div className="absolute inset-0 bg-white/90 backdrop-blur-3xl" />
        </div>
      )}
      
      {/* Mobile Container (9:16 Aspect Ratio) */}
      <div className="relative w-full h-full md:w-[400px] md:h-[85vh] md:rounded-3xl overflow-hidden shadow-2xl md:border md:border-black/10 md:ring-1 md:ring-white/50">
        
        {/* Progress Bars */}
        <div className="absolute top-4 left-3 right-3 flex gap-1.5 z-30">
          {reelImages.map((_, idx) => (
            <div key={idx} className="h-[3px] flex-1 bg-white/20 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-white rounded-full"
                style={{ 
                  width: idx < currentIndex ? "100%" : 
                         idx === currentIndex ? `${progress}%` : "0%" 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-10 left-4 right-4 z-30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-xs font-bold text-white">12</span>
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold drop-shadow-lg">{title}</p>
              <p className="text-[11px] opacity-70">{photographerName || 'Curated for you'}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2.5 bg-black/30 backdrop-blur-xl rounded-full text-white/80 hover:text-white hover:bg-black/50 transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Counter */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute top-24 left-4 z-30"
        >
          <div className="px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-xl text-xs font-medium text-white/90 border border-white/10">
            {currentIndex + 1} / {fullAlbumCount}
          </div>
        </motion.div>

        {/* Main Image Area - Tap to navigate */}
        <div 
          className="absolute inset-0 bg-black cursor-pointer select-none"
          onClick={handleImageClick}
        >
          <AnimatePresence mode="popLayout">
            {currentIndex < reelImages.length && !isEnded && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 w-full h-full"
              >
                <motion.img
                  src={reelImages[currentIndex].url}
                  alt=""
                  className="w-full h-full object-cover"
                  initial={{ scale: 1 }}
                  animate={{ scale: 1.1 }}
                  transition={{ duration: DURATION_PER_SLIDE / 1000 + 1, ease: "linear" }}
                  draggable={false}
                />
                {/* Cinematic Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap Hints (subtle) */}
          <div className="absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-4 opacity-0 hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-8 h-8 text-white/50" />
          </div>
          <div className="absolute inset-y-0 right-0 w-2/3 flex items-center justify-end pr-4 opacity-0 hover:opacity-100 transition-opacity">
            <ChevronRight className="w-8 h-8 text-white/50" />
          </div>

          {/* End Screen */}
          {isEnded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center text-white z-20 p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-500 via-pink-500 to-fuchsia-600 flex items-center justify-center mb-8 shadow-2xl"
              >
                <Heart className="w-10 h-10 text-white fill-white" />
              </motion.div>

              <motion.h3 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-serif text-4xl mb-3 font-light"
              >
                {title}
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-white/50 text-lg mb-2"
              >
                That was just a taste
              </motion.p>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/30 text-sm mb-10"
              >
                {fullAlbumCount} photos waiting in your full album
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link 
                  href={closeHref}
                  className="group flex items-center gap-3 px-10 py-5 bg-white text-black rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-2xl"
                >
                  <span>View Full Album</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex gap-4 mt-8"
              >
                <button 
                  onClick={() => { setCurrentIndex(0); setIsPlaying(true); }}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Watch Again
                </button>
                
                <button 
                  onClick={handleShare}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-full text-sm font-medium hover:bg-white/20 transition-colors border border-white/10"
                >
                  {showCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  {showCopied ? 'Copied!' : 'Share'}
                </button>
              </motion.div>
              
              <p className="text-[10px] text-white/20 mt-12 uppercase tracking-[0.3em]">
                Crafted with 12img
              </p>
            </motion.div>
          )}
        </div>

        {/* Footer Controls */}
        {!isEnded && (
          <div className="absolute bottom-10 left-6 right-6 z-30 flex justify-between items-end">
            <div className="max-w-[200px]">
              <motion.p 
                key={currentIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-white font-serif text-xl italic drop-shadow-xl leading-tight"
              >
                {getCaptionForIndex(currentIndex)}
              </motion.p>
              <p className="text-white/40 text-xs mt-2 font-medium tracking-wide">
                Tap to skip →
              </p>
            </div>
            
            {/* Side Action Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
              >
                {showCopied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              </button>
              
              {downloadEnabled && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownloadClick(); }}
                  className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
                  title="View Full Album"
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-lg"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Download Prompt Modal */}
      <AnimatePresence>
        {showDownloadPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            onClick={() => setShowDownloadPrompt(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm bg-gradient-to-b from-zinc-900 to-black rounded-3xl p-8 text-center border border-white/10 shadow-2xl"
            >
              {/* Icon */}
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <ImageDown className="w-8 h-8 text-white" />
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-2">
                Download Full Album
              </h3>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                This will download all <span className="text-white font-medium">{fullAlbumCount} photos</span>{totalFileSizeBytes ? <> (<span className="text-white font-medium">{formatFileSize(totalFileSizeBytes)}</span>)</> : ''} as a ZIP file — not the video reel.
              </p>
              
              {/* Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDownload}
                  className="w-full py-4 px-6 bg-white text-black rounded-2xl font-semibold text-sm hover:bg-white/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download {fullAlbumCount} Photos
                </button>
                <button
                  onClick={() => setShowDownloadPrompt(false)}
                  className="w-full py-3 px-6 text-white/60 hover:text-white text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
              
              {/* Subtle hint */}
              <p className="text-[10px] text-white/30 mt-6">
                Tip: Use screen recording to save the reel as video
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
