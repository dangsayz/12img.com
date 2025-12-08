'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, Lock, Image as ImageIcon, Mail, Globe, ArrowDown } from 'lucide-react'
import { VisibilityBadge, LockIndicator, PrivateOverlay } from '@/components/ui/VisibilityBadge'
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
      router.push(`/view-reel/${gallery.id}`)
      return
    }

    if (unlockedGalleries.has(gallery.id)) {
      router.push(`/view-reel/${gallery.id}`)
      return
    }

    const isUnlocked = await checkGalleryUnlocked(gallery.id)
    if (isUnlocked) {
      setUnlockedGalleries(prev => new Set([...prev, gallery.id]))
      router.push(`/view-reel/${gallery.id}`)
      return
    }

    setSelectedGallery(gallery)
    setPinModalOpen(true)
  }, [router, unlockedGalleries])

  const handlePinSuccess = useCallback(() => {
    if (selectedGallery) {
      setUnlockedGalleries(prev => new Set([...prev, selectedGallery.id]))
      setPinModalOpen(false)
      router.push(`/view-reel/${selectedGallery.id}`)
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

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <PublicHeader />

      {/* Editorial Hero - Clean, minimal, magazine-style */}
      <section className="relative min-h-screen flex flex-col">
        {/* Top bar with name */}
        <div className="pt-8 pb-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-2xl sm:text-3xl tracking-[0.2em] text-stone-800 uppercase"
          >
            {profile.display_name || 'Photographer'}
          </motion.h1>
        </div>

        {/* Hero Image - Editorial asymmetric layout */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-24 pb-12">
          <div className="grid grid-cols-12 gap-6 lg:gap-12 w-full max-w-7xl items-center">
            {/* Image - Takes 7 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 lg:col-span-7"
            >
              {heroImage ? (
                <div className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden bg-stone-100">
                  <img
                    src={heroImage}
                    alt={profile.display_name || 'Portfolio'}
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle paper texture overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="aspect-[4/5] lg:aspect-[3/4] bg-stone-200 flex items-center justify-center">
                  <Camera className="w-16 h-16 text-stone-300" />
                </div>
              )}
            </motion.div>

            {/* Text content - Takes 5 columns on desktop */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 lg:col-span-5 lg:pl-8"
            >
              {/* Vertical text accent */}
              <div className="hidden lg:block mb-8">
                <p className="text-[10px] tracking-[0.3em] text-stone-400 uppercase transform -rotate-90 origin-left translate-y-24">
                  Photos by {profile.display_name || 'Artist'}
                </p>
              </div>

              {/* Featured gallery title */}
              {profile.galleries[0] && (
                <div className="mb-8">
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-stone-800 leading-tight tracking-tight">
                    {profile.galleries[0].title}
                  </h2>
                  <div className="mt-4 w-12 h-px bg-stone-300" />
                  <p className="mt-4 text-sm text-stone-500 tracking-wide">
                    {new Date(profile.galleries[0].created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {/* Bio */}
              {profile.bio && (
                <p className="text-stone-600 leading-relaxed max-w-md font-light">
                  {profile.bio}
                </p>
              )}

              {/* Contact */}
              <div className="mt-8 flex items-center gap-4">
                {profile.contactEmail && (
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="text-xs tracking-[0.15em] text-stone-500 hover:text-stone-800 transition-colors uppercase"
                  >
                    Contact
                  </a>
                )}
                {profile.contactEmail && profile.websiteUrl && (
                  <span className="text-stone-300">·</span>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs tracking-[0.15em] text-stone-500 hover:text-stone-800 transition-colors uppercase"
                  >
                    Website
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-4 h-4 text-stone-400" />
          </motion.div>
        </motion.div>
      </section>

      {/* Tab Navigation - Editorial style */}
      <nav className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-12 h-16">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`text-xs tracking-[0.2em] uppercase transition-colors relative py-6 ${
                activeTab === 'portfolio' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Portfolio
              {activeTab === 'portfolio' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-stone-900"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('galleries')}
              className={`text-xs tracking-[0.2em] uppercase transition-colors relative py-6 ${
                activeTab === 'galleries' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Galleries
              {activeTab === 'galleries' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-stone-900"
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="py-24 lg:py-32">
        {activeTab === 'portfolio' ? (
          /* Editorial Portfolio Layout */
          displayImages.length > 0 ? (
            <div className="space-y-24 lg:space-y-40">
              {/* Opening editorial text block */}
              {profile.bio && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="max-w-2xl mx-auto px-6 text-center"
                >
                  <div className="w-px h-12 bg-stone-300 mx-auto mb-8" />
                  <p className="font-serif text-xl lg:text-2xl text-stone-700 leading-relaxed italic">
                    "{profile.bio}"
                  </p>
                  <p className="mt-6 text-xs tracking-[0.2em] text-stone-400 uppercase">
                    — {profile.display_name}
                  </p>
                </motion.div>
              )}

              {editorialSpreads.slice(1).map((spread, spreadIndex) => {
                // Inject editorial typography between spreads
                const shouldInjectQuote = spreadIndex === 2 && profile.galleries.length > 0
                const shouldInjectStats = spreadIndex === 4 && (profile.galleries.length > 1 || displayImages.length > 5)
                const shouldInjectDivider = spreadIndex > 0 && spreadIndex % 3 === 0 && !shouldInjectQuote && !shouldInjectStats
                const handleImageClick = (image: typeof displayImages[0]) => {
                  const gallery = profile.galleries.find(g => g.id === image.gallery_id)
                  if (gallery) handleGalleryClick(gallery)
                }

                const renderImage = (image: typeof displayImages[0], className: string = '', aspectClass: string = 'aspect-[4/5]', imageIndex: number = 0) => {
                  const gallery = profile.galleries.find(g => g.id === image.gallery_id)
                  const isLocked = gallery?.is_locked && !unlockedGalleries.has(gallery.id)
                  const caption = getEditorialCaption(image.gallery_title, spreadIndex * 3 + imageIndex, spread.type)
                  
                  return (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, y: 40 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-100px' }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className={`group cursor-pointer ${className}`}
                      onClick={() => handleImageClick(image)}
                    >
                      <div className={`relative ${aspectClass} overflow-hidden bg-stone-100`}>
                        <img
                          src={image.imageUrl}
                          alt={image.gallery_title}
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.02]"
                          style={{
                            objectPosition: `${image.focal_x ?? 50}% ${image.focal_y ?? 50}%`
                          }}
                        />
                        
                        {/* Subtle hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                        
                        {/* Visibility indicator - private or locked */}
                        {(isLocked || (gallery && !gallery.is_public)) && (
                          <div className="absolute top-4 right-4">
                            <LockIndicator isLocked={true} size="md" />
                          </div>
                        )}
                        
                        {/* Overlay caption (number style) */}
                        {caption.style === 'number' && caption.text && (
                          <div className="absolute bottom-4 left-4">
                            <span className="text-[10px] tracking-[0.3em] text-white/70 font-light">
                              {caption.text}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Editorial Caption - Varied styles */}
                      {caption.style !== 'none' && caption.style !== 'number' && caption.text && (
                        <div className="mt-4">
                          {caption.style === 'full' && (
                            <>
                              <p className="font-serif text-lg text-stone-800">{caption.text}</p>
                              <p className="text-xs text-stone-400 tracking-wide mt-1">
                                {gallery ? `${gallery.imageCount} images` : ''}
                              </p>
                            </>
                          )}
                          {caption.style === 'short' && (
                            <p className="font-serif text-base text-stone-600 italic">{caption.text}</p>
                          )}
                          {caption.style === 'minimal' && (
                            <p className="text-[11px] tracking-[0.2em] text-stone-400 uppercase">{caption.text}</p>
                          )}
                          {caption.style === 'date' && (
                            <p className="text-[10px] tracking-[0.15em] text-stone-400">{caption.text}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Visibility badge - only show when no caption */}
                      {(isLocked || (gallery && !gallery.is_public)) && caption.style === 'none' && (
                        <div className="mt-3">
                          <VisibilityBadge 
                            isPublic={gallery?.is_public ?? true}
                            hasPassword={isLocked}
                            variant="minimal"
                            size="sm"
                          />
                        </div>
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
                        <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                          {gallery.coverImageUrl ? (
                            <img
                              src={gallery.coverImageUrl}
                              alt={gallery.title}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-stone-300" />
                            </div>
                          )}

                          {/* Subtle hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

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
      </main>

      {/* Footer - Minimal editorial */}
      <footer className="py-20 lg:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            {/* Photographer mark */}
            <div className="mb-8">
              <p className="font-serif text-xl text-stone-800">
                {profile.display_name || 'Photographer'}
              </p>
            </div>

            {/* Contact links */}
            <div className="flex items-center gap-6 mb-12">
              {profile.contactEmail && (
                <a
                  href={`mailto:${profile.contactEmail}`}
                  className="w-10 h-10 rounded-full border border-stone-200 hover:border-stone-400 flex items-center justify-center transition-colors"
                >
                  <Mail className="w-4 h-4 text-stone-500" />
                </a>
              )}
              {profile.websiteUrl && (
                <a
                  href={profile.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full border border-stone-200 hover:border-stone-400 flex items-center justify-center transition-colors"
                >
                  <Globe className="w-4 h-4 text-stone-500" />
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-stone-200 mb-8" />

            {/* Credits */}
            <p className="text-[10px] tracking-[0.2em] text-stone-400 uppercase">
              Powered by{' '}
              <a href="/" className="hover:text-stone-600 transition-colors">12img</a>
            </p>
          </div>
        </div>
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
