'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Camera, Lock, Image as ImageIcon, Mail, Globe } from 'lucide-react'
import { CountryFlag, hasCustomFlag } from '@/components/ui/CountryFlag'
import { VisibilityBadge, LockIndicator, PrivateOverlay } from '@/components/ui/VisibilityBadge'
import { SocialShareButtons } from '@/components/ui/SocialShareButtons'
import { LazyImage, HeroImage } from '@/components/ui/LazyImage'
import { PublicHeader } from '@/components/profile/PublicHeader'
import { PINEntryModal } from '@/components/profile/PINEntryModal'
import { checkGalleryUnlocked } from '@/server/actions/profile.actions'

interface PortfolioImage {
  id: string
  storage_path: string
  imageUrl: string
  gallery_id: string
  gallery_title: string
  width: number | null
  height: number | null
  focal_x: number | null
  focal_y: number | null
}

interface Gallery {
  id: string
  title: string
  slug: string
  is_public: boolean
  is_locked: boolean
  cover_image_id: string | null
  imageCount: number
  coverImagePath?: string | null
  coverImageUrl?: string | null
  created_at: string
}

interface Profile {
  id: string
  display_name: string | null
  bio: string | null
  profile_slug: string | null
  avatar_url: string | null
  cover_image_url: string | null
  visibility_mode: string
  created_at: string
  galleries: Gallery[]
  portfolioImages?: PortfolioImage[]
  contactEmail?: string | null
  websiteUrl?: string | null
  location?: string | null
  country?: string | null
  isOwner?: boolean
}

interface ProfilePageClientProps {
  profile: Profile
}

export function ProfilePageClient({ profile }: ProfilePageClientProps) {
  const router = useRouter()
  const [pinModalOpen, setPinModalOpen] = useState(false)
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [unlockedGalleries, setUnlockedGalleries] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'portfolio' | 'galleries'>('portfolio')

  const handleGalleryClick = useCallback(async (gallery: Gallery) => {
    if (!gallery.is_locked) {
      router.push(`/view-reel/${gallery.slug}`)
      return
    }

    if (unlockedGalleries.has(gallery.id)) {
      router.push(`/view-reel/${gallery.slug}`)
      return
    }

    const isUnlocked = await checkGalleryUnlocked(gallery.id)
    if (isUnlocked) {
      setUnlockedGalleries(prev => new Set([...prev, gallery.id]))
      router.push(`/view-reel/${gallery.slug}`)
      return
    }

    setSelectedGallery(gallery)
    setPinModalOpen(true)
  }, [router, unlockedGalleries])

  const handlePinSuccess = useCallback(() => {
    if (selectedGallery) {
      setUnlockedGalleries(prev => new Set([...prev, selectedGallery.id]))
      setPinModalOpen(false)
      router.push(`/view-reel/${selectedGallery.slug}`)
    }
  }, [selectedGallery, router])

  const totalImages = profile.galleries.reduce((sum, g) => sum + g.imageCount, 0)
  
  // Get hero image from first portfolio image or gallery cover
  // URLs are pre-built on the server side
  const heroImage = (() => {
    // First try portfolio images
    if (profile.portfolioImages?.[0]?.imageUrl) {
      return profile.portfolioImages[0].imageUrl
    }
    // Then try gallery cover images
    if (profile.galleries[0]?.coverImageUrl) {
      return profile.galleries[0].coverImageUrl
    }
    // Finally try user-uploaded cover (if valid URL)
    if (profile.cover_image_url && profile.cover_image_url.startsWith('http')) {
      return profile.cover_image_url
    }
    return null
  })()

  // Get all portfolio images (from galleries if not specified)
  const displayImages = profile.portfolioImages?.length 
    ? profile.portfolioImages 
    : profile.galleries.flatMap(g => 
        g.coverImageUrl ? [{
          id: g.id,
          storage_path: g.coverImagePath || '',
          imageUrl: g.coverImageUrl,
          gallery_id: g.id,
          gallery_title: g.title,
          width: null,
          height: null,
          focal_x: null,
          focal_y: null,
        }] : []
      )

  // Editorial caption generator - creates varied, magazine-style captions
  const getEditorialCaption = useCallback((title: string, index: number, spreadType: string): {
    text: string | null
    style: 'full' | 'short' | 'minimal' | 'date' | 'number' | 'none'
    position: 'below' | 'overlay' | 'side'
  } => {
    // Parse title for creative variations
    const words = title.split(/[|\-–—,]/).map(s => s.trim()).filter(Boolean)
    const firstWord = words[0]?.split(' ')[0] || ''
    const lastWord = words[words.length - 1]?.split(' ').pop() || ''
    const shortTitle = words[0]?.split(' ').slice(0, 2).join(' ') || title
    
    // Create deterministic but varied pattern based on index
    const patterns = [
      { text: null, style: 'none' as const, position: 'below' as const }, // No caption - let image speak
      { text: firstWord, style: 'minimal' as const, position: 'below' as const }, // Just "Christmas"
      { text: null, style: 'none' as const, position: 'below' as const }, // No caption
      { text: shortTitle, style: 'short' as const, position: 'below' as const }, // "The Establishment"
      { text: null, style: 'none' as const, position: 'below' as const }, // No caption
      { text: `№${String(index + 1).padStart(2, '0')}`, style: 'number' as const, position: 'overlay' as const }, // "№01"
      { text: lastWord, style: 'minimal' as const, position: 'below' as const }, // "photos"
      { text: null, style: 'none' as const, position: 'below' as const }, // No caption
      { text: title, style: 'full' as const, position: 'below' as const }, // Full title (rare)
      { text: null, style: 'none' as const, position: 'below' as const }, // No caption
      { text: words[0] || title, style: 'short' as const, position: 'side' as const }, // Side caption
      { text: null, style: 'none' as const, position: 'below' as const }, // No caption
    ]
    
    // Spread type influences caption choice
    if (spreadType === 'trio') {
      // Trio: only first image gets caption
      return index === 0 
        ? { text: shortTitle, style: 'short', position: 'below' }
        : { text: null, style: 'none', position: 'below' }
    }
    
    if (spreadType === 'split') {
      // Split: alternate - one has caption, one doesn't
      return index % 2 === 0
        ? { text: firstWord, style: 'minimal', position: 'below' }
        : { text: null, style: 'none', position: 'below' }
    }
    
    if (spreadType === 'duo-stacked') {
      // Stacked: only bottom image gets subtle number
      return index === 1
        ? { text: `№${String(index + 1).padStart(2, '0')}`, style: 'number', position: 'overlay' }
        : { text: null, style: 'none', position: 'below' }
    }
    
    // For single images, use the pattern array
    return patterns[index % patterns.length]
  }, [])

  // Generate editorial layout spreads from images
  const editorialSpreads = useMemo(() => {
    if (!displayImages.length) return []
    
    const spreads: Array<{
      type: 'hero' | 'split' | 'offset-left' | 'offset-right' | 'trio' | 'single-centered' | 'duo-stacked'
      images: typeof displayImages
    }> = []
    
    let i = 0
    const images = [...displayImages]
    
    // First image is always hero
    if (images.length > 0) {
      spreads.push({ type: 'hero', images: [images[i++]] })
    }
    
    // Distribute remaining images in editorial patterns
    while (i < images.length) {
      const remaining = images.length - i
      const spreadIndex = spreads.length
      
      if (remaining >= 3 && spreadIndex % 4 === 1) {
        // Trio layout
        spreads.push({ type: 'trio', images: images.slice(i, i + 3) })
        i += 3
      } else if (remaining >= 2 && spreadIndex % 3 === 0) {
        // Split layout
        spreads.push({ type: 'split', images: images.slice(i, i + 2) })
        i += 2
      } else if (remaining >= 2 && spreadIndex % 5 === 2) {
        // Duo stacked
        spreads.push({ type: 'duo-stacked', images: images.slice(i, i + 2) })
        i += 2
      } else if (remaining >= 1 && spreadIndex % 2 === 0) {
        // Offset layouts alternate
        spreads.push({ type: spreadIndex % 4 === 0 ? 'offset-left' : 'offset-right', images: [images[i++]] })
      } else {
        // Single centered
        spreads.push({ type: 'single-centered', images: [images[i++]] })
      }
    }
    
    return spreads
  }, [displayImages])

  // Responsive scroll thresholds - mobile screens need shorter distances
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Scroll-based parallax for hero - delayed fade for better UX
  const { scrollY } = useScroll()
  // Mobile: shorter scroll distances, Desktop: longer for more dramatic effect
  const heroY = useTransform(scrollY, [0, isMobile ? 400 : 600], [0, isMobile ? 50 : 80])
  const heroOpacity = useTransform(scrollY, [isMobile ? 150 : 300, isMobile ? 500 : 800], [1, 0])
  const titleY = useTransform(scrollY, [0, isMobile ? 250 : 400], [0, isMobile ? -15 : -20])
  const smoothHeroY = useSpring(heroY, { stiffness: 80, damping: 25 })
  const smoothTitleY = useSpring(titleY, { stiffness: 80, damping: 25 })

  // Track if page has loaded for staggered entrance
  const [hasLoaded, setHasLoaded] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#faf9f7] overflow-x-hidden">
      <PublicHeader />

      {/* Editorial Hero - Ultra minimal, magazine-style */}
      <motion.section 
        className="relative min-h-screen flex flex-col"
        style={{ opacity: heroOpacity }}
      >
        {/* Top bar with name - refined entrance */}
        <motion.div 
          className="pt-12 pb-8 text-center"
          style={{ y: smoothTitleY }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-serif text-2xl sm:text-3xl tracking-[0.25em] text-stone-800 uppercase font-light flex items-center justify-center gap-3">
              {profile.display_name || 'Photographer'}
              {profile.country && hasCustomFlag(profile.country) && (
                <CountryFlag country={profile.country} size="md" />
              )}
            </h1>
            <motion.div 
              className="w-8 h-px bg-stone-300 mx-auto mt-4"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.div>
        </motion.div>

        {/* Hero Image - Editorial asymmetric layout with parallax */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-24 pb-16">
          <div className="grid grid-cols-12 gap-8 lg:gap-16 w-full max-w-7xl items-center">
            {/* Image - Takes 7 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 lg:col-span-7"
              style={{ y: smoothHeroY }}
            >
              {heroImage ? (
                <HeroImage
                  src={heroImage}
                  alt={profile.display_name || 'Portfolio'}
                  className="aspect-[4/5] lg:aspect-[3/4]"
                />
              ) : (
                <div className="aspect-[4/5] lg:aspect-[3/4] bg-stone-900 flex items-center justify-center">
                  <Camera className="w-12 h-12 text-stone-700" />
                </div>
              )}
            </motion.div>

            {/* Text content - Takes 5 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 lg:col-span-5 lg:pl-8"
            >
              {/* Vertical text accent - refined */}
              <div className="hidden lg:block mb-12 h-24 overflow-visible">
                <p className="text-[9px] tracking-[0.4em] text-stone-400/70 uppercase transform -rotate-90 origin-top-left translate-y-24 font-light whitespace-nowrap">
                  Photos by {profile.display_name || 'Artist'}
                </p>
              </div>

              {/* Featured gallery title - editorial typography */}
              {profile.galleries[0] && (
                <motion.div 
                  className="mb-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.9 }}
                >
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] text-stone-800 leading-[1.15] tracking-[-0.01em]">
                    {profile.galleries[0].title}
                  </h2>
                  <motion.div 
                    className="mt-6 w-16 h-px bg-stone-300"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                  />
                  <p className="mt-5 text-[11px] tracking-[0.2em] text-stone-400 uppercase font-light">
                    {new Date(profile.galleries[0].created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </motion.div>
              )}

              {/* Bio - refined */}
              {profile.bio && (
                <motion.p 
                  className="text-stone-500 leading-[1.8] max-w-md font-light text-[15px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.1 }}
                >
                  {profile.bio}
                </motion.p>
              )}

              {/* Contact - minimal */}
              <motion.div 
                className="mt-10 flex items-center gap-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.3 }}
              >
                {profile.contactEmail && (
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="text-[10px] tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors duration-500 uppercase"
                  >
                    Contact
                  </a>
                )}
                {profile.contactEmail && profile.websiteUrl && (
                  <span className="w-1 h-1 rounded-full bg-stone-300" />
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors duration-500 uppercase"
                  >
                    Website
                  </a>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator - ultra minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <motion.div
            className="w-px h-12 bg-gradient-to-b from-stone-300 to-transparent"
            animate={{ scaleY: [1, 0.6, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.section>

      {/* Tab Navigation - Ultra minimal editorial */}
      <nav className="sticky top-0 z-40 bg-[#faf9f7]/98 backdrop-blur-md border-b border-stone-200/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-16 h-14">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`text-[10px] tracking-[0.25em] uppercase transition-all duration-500 relative py-5 ${
                activeTab === 'portfolio' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Portfolio
              {activeTab === 'portfolio' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-800"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('galleries')}
              className={`text-[10px] tracking-[0.25em] uppercase transition-all duration-500 relative py-5 ${
                activeTab === 'galleries' ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Galleries
              {activeTab === 'galleries' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-stone-800"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="py-32 lg:py-40"
        >
        {activeTab === 'portfolio' ? (
          /* Editorial Portfolio Layout */
          displayImages.length > 0 ? (
            <div className="space-y-32 lg:space-y-48">
              {/* Opening editorial text block - refined */}
              {profile.bio && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                  className="max-w-2xl mx-auto px-6 text-center"
                >
                  <motion.div 
                    className="w-px h-16 bg-gradient-to-b from-transparent via-stone-300 to-transparent mx-auto mb-10"
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                  <p className="font-serif text-xl lg:text-2xl text-stone-600 leading-[1.8] italic font-light">
                    "{profile.bio}"
                  </p>
                  <p className="mt-8 text-[10px] tracking-[0.3em] text-stone-400 uppercase font-light">
                    — {profile.display_name}
                  </p>
                </motion.div>
              )}

              {editorialSpreads.slice(1).map((spread, spreadIndex) => {
                // Inject editorial typography between spreads
                const shouldInjectQuote = spreadIndex === 2 && profile.galleries.length > 0
                const shouldInjectStats = spreadIndex === 4 && (profile.galleries.length > 1 || displayImages.length > 5)
                const shouldInjectDivider = spreadIndex > 0 && spreadIndex % 3 === 0 && !shouldInjectQuote && !shouldInjectStats

                const renderImage = (image: typeof displayImages[0], className: string = '', aspectClass: string = 'aspect-[4/5]', imageIndex: number = 0) => {
                  const caption = getEditorialCaption(image.gallery_title, spreadIndex * 3 + imageIndex, spread.type)
                  
                  return (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 50 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-80px' }}
                      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      className={`${className} group`}
                    >
                      <div className="relative">
                        <LazyImage
                          src={image.imageUrl}
                          alt={image.gallery_title}
                          aspectRatio={aspectClass}
                          objectPosition={`${image.focal_x ?? 50}% ${image.focal_y ?? 50}%`}
                        />
                        
                        {/* Social share on hover */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                          <SocialShareButtons
                            imageUrl={image.imageUrl}
                            description={`${image.gallery_title} by ${profile.display_name || 'Photographer'} | 12img`}
                            size="sm"
                          />
                        </div>
                        
                        {/* Overlay caption (number style) */}
                        {caption.style === 'number' && caption.text && (
                          <div className="absolute bottom-4 left-4">
                            <span className="text-[10px] tracking-[0.3em] text-white/70 font-light">
                              {caption.text}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Editorial Caption - Refined typography */}
                      {caption.style !== 'none' && caption.style !== 'number' && caption.text && (
                        <motion.div 
                          className="mt-5"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: 0.2 }}
                        >
                          {caption.style === 'full' && (
                            <p className="font-serif text-lg text-stone-700 tracking-tight">{caption.text}</p>
                          )}
                          {caption.style === 'short' && (
                            <p className="font-serif text-base text-stone-500 italic font-light">{caption.text}</p>
                          )}
                          {caption.style === 'minimal' && (
                            <p className="text-[10px] tracking-[0.25em] text-stone-400/70 uppercase font-light">{caption.text}</p>
                          )}
                          {caption.style === 'date' && (
                            <p className="text-[9px] tracking-[0.2em] text-stone-400/60 font-light">{caption.text}</p>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )
                }

                // Editorial typography injection component
                const EditorialInjection = () => {
                  if (shouldInjectQuote) {
                    // Pull quote from gallery title
                    const featuredGallery = profile.galleries[0]
                    const words = featuredGallery?.title.split(/[|\-–—]/).map(s => s.trim()).filter(Boolean) || []
                    const pullQuote = words[0] || featuredGallery?.title
                    
                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="max-w-4xl mx-auto px-6 py-16 lg:py-24"
                      >
                        <div className="grid grid-cols-12 gap-6 items-center">
                          <div className="col-span-12 lg:col-span-2">
                            <div className="w-full h-px bg-stone-200 lg:w-px lg:h-24" />
                          </div>
                          <div className="col-span-12 lg:col-span-8">
                            <p className="font-serif text-3xl lg:text-5xl text-stone-800 leading-tight tracking-tight">
                              {pullQuote}
                            </p>
                            {words[1] && (
                              <p className="mt-4 text-sm text-stone-500 italic">
                                {words[1]}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                  
                  if (shouldInjectStats) {
                    return (
                      <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="max-w-3xl mx-auto px-6 py-16 lg:py-24"
                      >
                        <div className="flex items-center justify-center gap-12 lg:gap-24 text-center">
                          <div>
                            <p className="font-serif text-4xl lg:text-6xl text-stone-800">{profile.galleries.length}</p>
                            <p className="mt-2 text-xs tracking-[0.2em] text-stone-400 uppercase">
                              {profile.galleries.length === 1 ? 'Gallery' : 'Galleries'}
                            </p>
                          </div>
                          <div className="w-px h-16 bg-stone-200" />
                          <div>
                            <p className="font-serif text-4xl lg:text-6xl text-stone-800">{displayImages.length}</p>
                            <p className="mt-2 text-xs tracking-[0.2em] text-stone-400 uppercase">Images</p>
                          </div>
                        </div>
                      </motion.div>
                    )
                  }
                  
                  if (shouldInjectDivider) {
                    return (
                      <div className="flex items-center justify-center py-8">
                        <div className="w-px h-16 bg-stone-200" />
                      </div>
                    )
                  }
                  
                  return null
                }

                // Render different spread types
                const spreadContent = (() => {
                  switch (spread.type) {
                    case 'hero':
                      return (
                        <div className="max-w-5xl mx-auto px-6">
                          {renderImage(spread.images[0], '', 'aspect-[16/10]')}
                        </div>
                      )

                    case 'split':
                      return (
                        <div className="max-w-7xl mx-auto px-6 lg:px-12">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                            {spread.images.map((img, i) => 
                              renderImage(img, i === 1 ? 'lg:mt-24' : '', 'aspect-[3/4]', i)
                            )}
                          </div>
                        </div>
                      )

                  case 'offset-left':
                      return (
                        <div className="max-w-7xl mx-auto px-6 lg:px-12">
                          <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-8 lg:col-start-1">
                              {renderImage(spread.images[0], '', 'aspect-[4/3]')}
                            </div>
                          </div>
                        </div>
                      )

                    case 'offset-right':
                      return (
                        <div className="max-w-7xl mx-auto px-6 lg:px-12">
                          <div className="grid grid-cols-12 gap-6">
                            <div className="col-span-12 lg:col-span-7 lg:col-start-6">
                              {renderImage(spread.images[0], '', 'aspect-[3/4]')}
                            </div>
                          </div>
                        </div>
                      )

                    case 'trio':
                      return (
                        <div className="max-w-7xl mx-auto px-6 lg:px-12">
                          <div className="grid grid-cols-12 gap-4 lg:gap-6">
                            <div className="col-span-12 lg:col-span-5">
                              {renderImage(spread.images[0], '', 'aspect-[3/4]', 0)}
                            </div>
                            <div className="col-span-6 lg:col-span-4 lg:mt-16">
                              {renderImage(spread.images[1], '', 'aspect-[4/5]', 1)}
                            </div>
                            <div className="col-span-6 lg:col-span-3 lg:mt-32">
                              {renderImage(spread.images[2], '', 'aspect-square', 2)}
                            </div>
                          </div>
                        </div>
                      )

                    case 'duo-stacked':
                      return (
                        <div className="max-w-4xl mx-auto px-6">
                          <div className="space-y-6">
                            {spread.images.map((img, i) => 
                              renderImage(img, '', i === 0 ? 'aspect-[16/9]' : 'aspect-[21/9]', i)
                            )}
                          </div>
                        </div>
                      )

                    case 'single-centered':
                    default:
                      return (
                        <div className="max-w-3xl mx-auto px-6">
                          {renderImage(spread.images[0], '', 'aspect-[4/5]')}
                        </div>
                      )
                  }
                })()

                // Return the spread with optional editorial injection before it
                return (
                  <div key={spreadIndex}>
                    <EditorialInjection />
                    {spreadContent}
                  </div>
                )
              })}

              {/* Editorial divider */}
              <div className="flex items-center justify-center py-12">
                <div className="w-px h-16 bg-stone-200" />
              </div>
            </div>
          ) : (
            <div className="text-center py-32">
              <Camera className="w-12 h-12 text-stone-300 mx-auto mb-6" />
              <p className="font-serif text-xl text-stone-400">No portfolio images yet</p>
            </div>
          )
        ) : (
          /* Galleries - Editorial Cards with varied titles */
          profile.galleries.length > 0 ? (
            <div className="max-w-6xl mx-auto px-6 space-y-16 lg:space-y-24">
              {profile.galleries.map((gallery, index) => {
                const isUnlocked = unlockedGalleries.has(gallery.id)
                const isEven = index % 2 === 0
                
                // Editorial title variations for galleries
                const getGalleryTitle = () => {
                  const words = gallery.title.split(/[|\-–—,]/).map(s => s.trim()).filter(Boolean)
                  const patterns = [
                    // Full title with date
                    { title: gallery.title, subtitle: null, style: 'full' as const },
                    // Just first part, italicized
                    { title: words[0] || gallery.title, subtitle: words[1] || null, style: 'split' as const },
                    // Short + number
                    { title: words[0]?.split(' ').slice(0, 2).join(' ') || gallery.title, subtitle: `№${String(index + 1).padStart(2, '0')}`, style: 'numbered' as const },
                    // Single word, large
                    { title: words[0]?.split(' ')[0] || gallery.title, subtitle: null, style: 'minimal' as const },
                    // Full title
                    { title: gallery.title, subtitle: null, style: 'full' as const },
                  ]
                  return patterns[index % patterns.length]
                }
                
                const titleInfo = getGalleryTitle()
                
                return (
                  <motion.button
                    key={gallery.id}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => handleGalleryClick(gallery)}
                    className="group text-left w-full"
                  >
                    <div className={`grid grid-cols-12 gap-6 lg:gap-12 items-center ${isEven ? '' : 'direction-rtl'}`}>
                      {/* Image */}
                      <div className={`col-span-12 lg:col-span-7 ${isEven ? '' : 'lg:col-start-6 lg:order-2'}`}>
                        <div className="relative">
                          {gallery.coverImageUrl ? (
                            <LazyImage
                              src={gallery.coverImageUrl}
                              alt={gallery.title}
                              aspectRatio="aspect-[4/3]"
                            />
                          ) : (
                            <div className="aspect-[4/3] bg-stone-900 flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-stone-700" />
                            </div>
                          )}

                          {/* Subtle hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />

                          {/* Visibility Badge - for private galleries (owner viewing) */}
                          {!gallery.is_public && profile.isOwner && (
                            <div className="absolute top-3 left-3 z-10">
                              <VisibilityBadge 
                                isPublic={false} 
                                variant="badge" 
                                size="md" 
                              />
                            </div>
                          )}

                          {/* Lock Overlay - for PIN-protected galleries */}
                          {gallery.is_locked && !isUnlocked && (
                            <PrivateOverlay type="protected" size="md" />
                          )}
                          
                          {/* Overlay number for numbered style */}
                          {titleInfo.style === 'numbered' && (
                            <div className="absolute bottom-4 right-4">
                              <span className="text-[10px] tracking-[0.3em] text-white/60 font-light">
                                {titleInfo.subtitle}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Content - Varied editorial styles */}
                      <div className={`col-span-12 lg:col-span-5 ${isEven ? '' : 'lg:col-start-1 lg:order-1 text-right'}`}>
                        <div className={`${isEven ? '' : 'lg:text-right'}`}>
                          {/* Date - only show on some */}
                          {(titleInfo.style === 'full' || titleInfo.style === 'split') && (
                            <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase mb-4">
                              {new Date(gallery.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                          
                          {/* Title - varied styles */}
                          {titleInfo.style === 'full' && (
                            <h3 className="font-serif text-2xl lg:text-3xl text-stone-800 mb-3 group-hover:text-stone-600 transition-colors">
                              {titleInfo.title}
                            </h3>
                          )}
                          {titleInfo.style === 'split' && (
                            <>
                              <h3 className="font-serif text-2xl lg:text-3xl text-stone-800 mb-2 group-hover:text-stone-600 transition-colors">
                                {titleInfo.title}
                              </h3>
                              {titleInfo.subtitle && (
                                <p className="font-serif text-lg text-stone-500 italic mb-3">{titleInfo.subtitle}</p>
                              )}
                            </>
                          )}
                          {titleInfo.style === 'numbered' && (
                            <h3 className="font-serif text-xl lg:text-2xl text-stone-700 mb-3 group-hover:text-stone-600 transition-colors">
                              {titleInfo.title}
                            </h3>
                          )}
                          {titleInfo.style === 'minimal' && (
                            <h3 className="text-[11px] tracking-[0.25em] text-stone-500 uppercase mb-3 group-hover:text-stone-700 transition-colors">
                              {titleInfo.title}
                            </h3>
                          )}
                          
                          <div className={`w-12 h-px bg-stone-300 mb-4 ${isEven ? '' : 'lg:ml-auto'}`} />
                          
                          {/* Meta - simplified for some styles */}
                          <div className={`flex items-center gap-3 text-xs text-stone-500 ${isEven ? '' : 'lg:justify-end'}`}>
                            {titleInfo.style !== 'minimal' && (
                              <span>{gallery.imageCount} images</span>
                            )}
                            {/* Show visibility status */}
                            {(!gallery.is_public || (gallery.is_locked && !isUnlocked)) && (
                              <>
                                {titleInfo.style !== 'minimal' && <span className="text-stone-300">·</span>}
                                <VisibilityBadge 
                                  isPublic={gallery.is_public}
                                  hasPassword={gallery.is_locked}
                                  isUnlocked={isUnlocked}
                                  variant="minimal"
                                  size="sm"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-32">
              <ImageIcon className="w-12 h-12 text-stone-300 mx-auto mb-6" />
              <p className="font-serif text-xl text-stone-400">No galleries yet</p>
            </div>
          )
        )}
        </motion.main>
      </AnimatePresence>

      {/* Footer - Ultra minimal editorial */}
      <footer className="py-24 lg:py-40 border-t border-stone-200/30">
        <motion.div 
          className="max-w-6xl mx-auto px-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Photographer mark */}
            <div className="mb-10">
              <p className="font-serif text-2xl text-stone-800 tracking-tight">
                {profile.display_name || 'Photographer'}
              </p>
              <motion.div 
                className="w-8 h-px bg-stone-300 mx-auto mt-4"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              />
            </div>

            {/* Contact links - refined */}
            <div className="flex items-center gap-8 mb-16">
              {profile.contactEmail && (
                <motion.a
                  href={`mailto:${profile.contactEmail}`}
                  className="w-11 h-11 rounded-full border border-stone-200 hover:border-stone-400 hover:bg-stone-50 flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Mail className="w-4 h-4 text-stone-400" />
                </motion.a>
              )}
              {profile.websiteUrl && (
                <motion.a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full border border-stone-200 hover:border-stone-400 hover:bg-stone-50 flex items-center justify-center transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Globe className="w-4 h-4 text-stone-400" />
                </motion.a>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-16 bg-gradient-to-b from-stone-200 to-transparent mb-10" />

            {/* Credits - ultra minimal */}
            <p className="text-[9px] tracking-[0.3em] text-stone-400/70 uppercase font-light">
              Powered by{' '}
              <a href="/" className="hover:text-stone-600 transition-colors duration-300">12img</a>
            </p>
          </div>
        </motion.div>
      </footer>

      {/* PIN Entry Modal */}
      {selectedGallery && (
        <PINEntryModal
          isOpen={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          onSuccess={handlePinSuccess}
          galleryId={selectedGallery.id}
          galleryTitle={selectedGallery.title}
        />
      )}
    </div>
  )
}
