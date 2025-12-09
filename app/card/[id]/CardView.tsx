'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Share2, Copy, Check, Eye, ArrowRight, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

// Social share icons
const FacebookIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const XIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const PinterestIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
)

const WhatsAppIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

const LinkedInIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TelegramIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
)

const EmailIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

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
  const [showSharePanel, setShowSharePanel] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.href : ''
  const shareTitle = card.title || 'Beautiful Photo'
  const shareText = card.subtitle || 'Check out this beautiful photo'

  // Social share URLs
  const socialLinks = [
    {
      name: 'Facebook',
      icon: FacebookIcon,
      color: 'hover:text-[#1877F2] hover:bg-[#1877F2]/10',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'X',
      icon: XIcon,
      color: 'hover:text-black hover:bg-black/10',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Pinterest',
      icon: PinterestIcon,
      color: 'hover:text-[#E60023] hover:bg-[#E60023]/10',
      url: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(card.imageUrl)}&description=${encodeURIComponent(shareTitle + ' | 12img')}`,
    },
    {
      name: 'WhatsApp',
      icon: WhatsAppIcon,
      color: 'hover:text-[#25D366] hover:bg-[#25D366]/10',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
    },
    {
      name: 'LinkedIn',
      icon: LinkedInIcon,
      color: 'hover:text-[#0A66C2] hover:bg-[#0A66C2]/10',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      name: 'Telegram',
      icon: TelegramIcon,
      color: 'hover:text-[#0088cc] hover:bg-[#0088cc]/10',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    },
    {
      name: 'Email',
      icon: EmailIcon,
      color: 'hover:text-stone-700 hover:bg-stone-100',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`,
    },
  ]

  const openShareLink = (url: string) => {
    window.open(url, '_blank', 'width=600,height=500')
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
              onClick={() => setShowSharePanel(true)}
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

      {/* Share Panel Modal */}
      <AnimatePresence>
        {showSharePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSharePanel(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-stone-200 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 pb-4 border-b border-stone-100">
                <h3 className="text-lg font-semibold text-stone-900">Share this photo</h3>
                <button
                  onClick={() => setShowSharePanel(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>
              
              {/* Social Icons Grid */}
              <div className="p-6">
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-4">
                  {socialLinks.map((social) => (
                    <button
                      key={social.name}
                      onClick={() => openShareLink(social.url)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl text-stone-500 transition-all duration-200 ${social.color}`}
                    >
                      <div className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-50 transition-colors">
                        <social.icon />
                      </div>
                      <span className="text-xs font-medium">{social.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Copy Link Section */}
                <div className="mt-6 pt-6 border-t border-stone-100">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">Or copy link</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-4 py-3 bg-stone-50 rounded-xl text-sm text-stone-600 truncate">
                      {shareUrl}
                    </div>
                    <button
                      onClick={() => {
                        copyToClipboard()
                        setTimeout(() => setShowSharePanel(false), 500)
                      }}
                      className="px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Safe area for mobile */}
              <div className="h-6" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
