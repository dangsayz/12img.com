'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Camera, Lock, Image as ImageIcon, Mail, Globe, Star } from 'lucide-react'
import { CountryFlag, hasCustomFlag } from '@/components/ui/CountryFlag'
import { VisibilityBadge, LockIndicator, PrivateOverlay } from '@/components/ui/VisibilityBadge'
import { SocialShareButtons } from '@/components/ui/SocialShareButtons'
import { LazyImage, HeroImage } from '@/components/ui/LazyImage'
import { PublicHeader } from '@/components/profile/PublicHeader'
import { PINEntryModal } from '@/components/profile/PINEntryModal'
import { checkGalleryUnlocked } from '@/server/actions/profile.actions'
import { toggleImageFavorite } from '@/server/actions/gallery.actions'

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
  socialSharingEnabled?: boolean
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
  const [removedFavorites, setRemovedFavorites] = useState<Set<string>>(new Set())
  const [pendingUnstar, setPendingUnstar] = useState<string | null>(null)

  // Filter out removed favorites for optimistic UI
  const visibleFavorites = useMemo(() => 
    (profile.portfolioImages || []).filter(img => !removedFavorites.has(img.id)),
    [profile.portfolioImages, removedFavorites]
  )

  const handleUnstar = useCallback(async (imageId: string) => {
    if (pendingUnstar) return // Prevent rapid clicks
    
    setPendingUnstar(imageId)
    // Optimistic removal
    setRemovedFavorites(prev => new Set([...prev, imageId]))
    
    try {
      const result = await toggleImageFavorite(imageId, false)
      if (result.error) {
        // Revert on error
        setRemovedFavorites(prev => {
          const next = new Set(prev)
          next.delete(imageId)
          return next
        })
        console.error('Failed to unstar:', result.error)
      }
    } catch (e) {
      // Revert on error
      setRemovedFavorites(prev => {
        const next = new Set(prev)
        next.delete(imageId)
        return next
      })
      console.error('Failed to unstar:', e)
    } finally {
      setPendingUnstar(null)
    }
  }, [pendingUnstar])

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
          /* Favorites Grid - Simple masonry layout */
          visibleFavorites.length > 0 ? (
            <div className="max-w-7xl mx-auto px-6">
              {/* Section header */}
              <div className="text-center mb-16">
                <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-4">Favorites</p>
                <div className="w-12 h-px bg-stone-300 mx-auto" />
              </div>
              
              {/* Masonry grid */}
              <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {visibleFavorites.map((image, index) => (
                    <motion.div
                      key={image.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      className="mb-4 break-inside-avoid group relative"
                    >
                      <div className="relative overflow-hidden rounded-sm">
                        <LazyImage
                          src={image.imageUrl}
                          alt={image.gallery_title || 'Favorite photo'}
                          aspectRatio={
                            image.width && image.height 
                              ? `aspect-[${image.width}/${image.height}]`
                              : 'aspect-[4/5]'
                          }
                          objectPosition={`${image.focal_x ?? 50}% ${image.focal_y ?? 50}%`}
                        />
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                        
                        {/* Owner: Unstar button */}
                        {profile.isOwner && (
                          <button
                            onClick={() => handleUnstar(image.id)}
                            disabled={pendingUnstar === image.id}
                            className="absolute top-3 left-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                            title="Remove from favorites"
                          >
                            <Star className={`w-4 h-4 text-amber-400 fill-amber-400 ${pendingUnstar === image.id ? 'animate-pulse' : ''}`} />
                          </button>
                        )}
                        
                        {/* Share buttons */}
                        {profile.socialSharingEnabled && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <SocialShareButtons
                              imageUrl={image.imageUrl}
                              description={`${image.gallery_title || 'Photo'} by ${profile.display_name || 'Photographer'} | 12img`}
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="text-center py-32">
              <Star className="w-12 h-12 text-stone-300 mx-auto mb-6" />
              <p className="font-serif text-xl text-stone-400">No favorites yet</p>
              <p className="text-sm text-stone-400 mt-2">Star your best photos to showcase them here</p>
            </div>
          )
        ) : (
          /* Galleries - Clean Grid Layout (scales to 100s of albums) */
          profile.galleries.length > 0 ? (
            <div className="max-w-7xl mx-auto px-6">
              {/* Section header with count */}
              <div className="text-center mb-12">
                <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase mb-2">
                  {profile.galleries.length} {profile.galleries.length === 1 ? 'Gallery' : 'Galleries'}
                </p>
                <div className="w-12 h-px bg-stone-300 mx-auto" />
              </div>
              
              {/* Responsive Grid - 2 cols mobile, 3 cols tablet, 4 cols desktop */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {profile.galleries.map((gallery, index) => {
                  const isUnlocked = unlockedGalleries.has(gallery.id)
                  
                  return (
                    <motion.div
                      key={gallery.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-50px' }}
                      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
                      className="group"
                    >
                      <button
                        onClick={() => handleGalleryClick(gallery)}
                        className="w-full text-left"
                      >
                        {/* Cover Image */}
                        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-stone-100">
                          {gallery.coverImageUrl ? (
                            <LazyImage
                              src={gallery.coverImageUrl}
                              alt={gallery.title}
                              aspectRatio="aspect-[4/5]"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-stone-900 flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-stone-700" />
                            </div>
                          )}
                          
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                          
                          {/* Lock indicator */}
                          {gallery.is_locked && !isUnlocked && (
                            <div className="absolute top-2 right-2">
                              <div className="w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                                <Lock className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>
                          )}
                          
                          {/* Private badge for owner */}
                          {!gallery.is_public && profile.isOwner && (
                            <div className="absolute top-2 left-2">
                              <div className="px-2 py-1 rounded bg-black/50 text-[9px] text-white/80 tracking-wider uppercase">
                                Private
                              </div>
                            </div>
                          )}
                          
                          {/* Image count badge */}
                          <div className="absolute bottom-2 right-2">
                            <div className="px-2 py-1 rounded bg-black/50 text-[10px] text-white/90 tabular-nums">
                              {gallery.imageCount}
                            </div>
                          </div>
                        </div>
                        
                        {/* Title & Meta */}
                        <div className="mt-3">
                          <h3 className="text-sm font-medium text-stone-800 group-hover:text-stone-600 transition-colors line-clamp-1">
                            {gallery.title}
                          </h3>
                          <p className="text-[10px] text-stone-400 mt-1">
                            {new Date(gallery.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </button>
                    </motion.div>
                  )
                })}
              </div>
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
