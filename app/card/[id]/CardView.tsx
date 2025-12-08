'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Share2, Copy, Check, Download, Eye, ArrowRight } from 'lucide-react'

interface CardViewProps {
  card: {
    id: string
    title: string | null
    subtitle: string | null
    photographerName: string | null
    imageUrl: string
    viewCount: number
    createdAt: string
  }
}

export function CardView({ card }: CardViewProps) {
  const [copied, setCopied] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: card.title || 'Beautiful Photo',
          text: card.subtitle || 'Check out this photo',
          url: shareUrl,
        })
      } catch {
        // User cancelled or share failed, fall back to copy
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] selection:bg-stone-900 selection:text-white">
      {/* Subtle background texture */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-full shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-[8px]">12</span>
            </div>
            <span className="text-sm font-bold text-stone-900">img</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-full shadow-sm text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full shadow-sm text-sm font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative min-h-screen flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-4xl mx-auto">
          {/* The Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Card with print/paper effect */}
            <div 
              className="relative mx-auto"
              style={{ perspective: '2000px' }}
            >
              {/* Paper stack shadows */}
              <div className="absolute -bottom-2 left-4 right-4 h-full bg-white rounded-sm shadow-lg opacity-60" />
              <div className="absolute -bottom-4 left-8 right-8 h-full bg-white rounded-sm shadow-md opacity-40" />
              
              {/* Main card */}
              <motion.div
                initial={{ rotateX: 5 }}
                animate={{ rotateX: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="relative bg-white rounded-sm shadow-2xl overflow-hidden"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* White mat border */}
                <div className="p-4 sm:p-6 md:p-10 lg:p-12">
                  {/* Image container */}
                  <div className="relative aspect-[4/3] sm:aspect-[3/2] bg-stone-100 rounded-sm overflow-hidden">
                    <Image
                      src={card.imageUrl}
                      alt={card.title || 'Photo'}
                      fill
                      className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                      onLoad={() => setImageLoaded(true)}
                      priority
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
                    />
                    
                    {/* Loading skeleton */}
                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br from-stone-100 to-stone-200 animate-pulse" />
                    )}
                  </div>
                </div>

                {/* Card info footer */}
                <div className="px-4 sm:px-6 md:px-10 lg:px-12 pb-4 sm:pb-6 md:pb-8 flex items-end justify-between">
                  <div>
                    {card.title && (
                      <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-stone-900 mb-1">
                        {card.title}
                      </h1>
                    )}
                    {card.subtitle && (
                      <p className="text-sm sm:text-base text-stone-500">
                        {card.subtitle}
                      </p>
                    )}
                    {card.photographerName && (
                      <p className="text-xs text-stone-400 mt-2">
                        Photo by {card.photographerName}
                      </p>
                    )}
                  </div>
                  
                  {/* View count */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{card.viewCount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Subtle paper texture overlay */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                  <div className="w-full h-full" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                  }} />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 text-center"
          >
            <p className="text-stone-500 mb-4">
              Create your own beautiful photo cards for free
            </p>
            <Link
              href="/#features"
              className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full transition-colors"
            >
              Try it now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 px-4 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-center">
          <p className="text-xs text-stone-400">
            Made with{' '}
            <Link href="/" className="text-stone-600 hover:text-stone-900 font-medium">
              12img
            </Link>
            {' '}— Professional photo galleries for photographers
          </p>
        </div>
      </footer>
    </div>
  )
}
