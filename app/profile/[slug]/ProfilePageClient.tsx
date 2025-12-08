'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Camera, Lock, Image as ImageIcon, Mail, Instagram, Globe, MapPin } from 'lucide-react'
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

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero Section - Full viewport height */}
      <section className="relative h-screen">
        {/* Background Image */}
        {heroImage ? (
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt={profile.display_name || 'Portfolio'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-800 to-stone-900" />
        )}

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          {/* Avatar */}
          {profile.avatar_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="w-24 h-24 rounded-full border-4 border-white/20 overflow-hidden mb-6 shadow-2xl"
            >
              <img
                src={profile.avatar_url}
                alt={profile.display_name || 'Photographer'}
                className="w-full h-full object-cover"
              />
            </motion.div>
          )}

          {/* Name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-light text-white tracking-tight"
          >
            {profile.display_name || 'Photographer'}
          </motion.h1>

          {/* Bio */}
          {profile.bio && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 text-lg text-white/80 max-w-xl"
            >
              {profile.bio}
            </motion.p>
          )}

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center gap-8 text-white/60"
          >
            <div className="text-center">
              <div className="text-2xl font-light text-white">{profile.galleries.length}</div>
              <div className="text-xs uppercase tracking-wider">Galleries</div>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <div className="text-2xl font-light text-white">{totalImages}</div>
              <div className="text-xs uppercase tracking-wider">Images</div>
            </div>
          </motion.div>

          {/* Contact Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex items-center gap-4"
          >
            {profile.contactEmail && (
              <a
                href={`mailto:${profile.contactEmail}`}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Mail className="w-5 h-5 text-white" />
              </a>
            )}
            {profile.websiteUrl && (
              <a
                href={profile.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <Globe className="w-5 h-5 text-white" />
              </a>
            )}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-white/60"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation */}
      <nav className="sticky top-0 z-40 bg-white border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 h-14">
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`text-sm font-medium transition-colors relative ${
                activeTab === 'portfolio' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Portfolio
              {activeTab === 'portfolio' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-stone-900"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('galleries')}
              className={`text-sm font-medium transition-colors relative ${
                activeTab === 'galleries' ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              Galleries
              {activeTab === 'galleries' && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-stone-900"
                />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {activeTab === 'portfolio' ? (
          /* Portfolio Grid - Masonry-style */
          displayImages.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {displayImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="break-inside-avoid group cursor-pointer"
                  onClick={() => {
                    const gallery = profile.galleries.find(g => g.id === image.gallery_id)
                    if (gallery) handleGalleryClick(gallery)
                  }}
                >
                  <div className="relative overflow-hidden bg-stone-100">
                    <img
                      src={image.imageUrl}
                      alt={image.gallery_title}
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{
                        objectPosition: `${image.focal_x ?? 50}% ${image.focal_y ?? 50}%`
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-sm font-medium">{image.gallery_title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <Camera className="w-16 h-16 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400">No portfolio images yet</p>
            </div>
          )
        ) : (
          /* Galleries Grid */
          profile.galleries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.galleries.map((gallery, index) => {
                const isUnlocked = unlockedGalleries.has(gallery.id)
                
                return (
                  <motion.button
                    key={gallery.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    onClick={() => handleGalleryClick(gallery)}
                    className="group text-left"
                  >
                    {/* Cover Image - Tall vertical */}
                    <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                      {gallery.coverImageUrl ? (
                        <img
                          src={gallery.coverImageUrl}
                          alt={gallery.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-stone-300" />
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Lock Overlay */}
                      {gallery.is_locked && !isUnlocked && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                            <Lock className="w-6 h-6 text-stone-700" />
                          </div>
                        </div>
                      )}

                      {/* Content Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-lg font-medium text-white mb-1">
                          {gallery.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{gallery.imageCount} images</span>
                          {gallery.is_locked && !isUnlocked && (
                            <>
                              <span>·</span>
                              <Lock className="w-3 h-3" />
                              <span>PIN Required</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-24">
              <ImageIcon className="w-16 h-16 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400">No galleries yet</p>
            </div>
          )
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-stone-400">
            © {new Date().getFullYear()} {profile.display_name || 'Photographer'} · Powered by{' '}
            <a href="/" className="hover:text-stone-600 transition-colors">12img</a>
          </p>
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
