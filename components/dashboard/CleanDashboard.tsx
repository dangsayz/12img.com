'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Lock,
  MoreHorizontal,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Plus,
  Globe,
  EyeOff,
  Shield,
  ChevronDown,
  Users,
  FileText,
  MessageSquare,
  X,
  Trophy,
  Settings,
  Pencil,
  Archive,
  Sparkles
} from 'lucide-react'
import { deleteGallery, toggleGalleryVisibility } from '@/server/actions/gallery.actions'
import { updateProfileVisibility } from '@/server/actions/profile.actions'
import { VisibilityBadgeOverlay } from '@/components/ui/VisibilityBadge'
import type { ProfileVisibilityMode } from '@/types/database'
import { OnboardingHint, FeatureBanner } from '@/components/onboarding'
import { CountryFlag, hasCustomFlag } from '@/components/ui/CountryFlag'
import { PromoBanner } from './PromoBanner'
import { PromoReminder } from './PromoReminder'

interface Gallery {
  id: string
  title: string
  slug: string
  hasPassword: boolean
  downloadEnabled: boolean
  coverImageUrl: string | null
  imageCount: number
  createdAt: string
  updatedAt: string
  category?: string
  isPublic: boolean
}

// Format relative time like "2 days ago", "3 weeks ago"
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 14) return '1 week ago'
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 60) return '1 month ago'
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`
}

interface ActiveContest {
  id: string
  name: string
  theme: string | null
  status: 'submissions_open' | 'voting'
}

interface CleanDashboardProps {
  galleries: Gallery[]
  photographerName?: string
  country?: string | null
  visibilityMode?: ProfileVisibilityMode
  profileSlug?: string | null
  activeContest?: ActiveContest | null
  userPlan?: string
}

const CATEGORIES = ['ALL', 'WEDDING', 'FAMILY', 'PORTRAITS', 'LIFESTYLE', 'EVENTS']
const GALLERIES_PER_PAGE = 20

export function CleanDashboard({ galleries, photographerName, country, visibilityMode = 'PRIVATE', profileSlug, activeContest, userPlan = 'free' }: CleanDashboardProps) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [currentVisibility, setCurrentVisibility] = useState<ProfileVisibilityMode>(visibilityMode)
  const [isPending, startTransition] = useTransition()
  const [showFeatureHint, setShowFeatureHint] = useState(true)
  const [visibleCount, setVisibleCount] = useState(GALLERIES_PER_PAGE)
  
  // Check if feature hint was dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('12img_clients_hint_dismissed')
    if (dismissed) setShowFeatureHint(false)
  }, [])
  
  const dismissFeatureHint = () => {
    setShowFeatureHint(false)
    localStorage.setItem('12img_clients_hint_dismissed', 'true')
  }

  const filteredGalleries = useMemo(() => {
    return galleries.filter(gallery => {
      const matchesCategory = activeCategory === 'ALL' || gallery.category === activeCategory
      const matchesSearch = gallery.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [galleries, activeCategory, searchQuery])

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(GALLERIES_PER_PAGE)
  }, [activeCategory, searchQuery])

  const visibleGalleries = filteredGalleries.slice(0, visibleCount)
  const hasMore = visibleCount < filteredGalleries.length
  const remainingCount = filteredGalleries.length - visibleCount

  const totalImages = galleries.reduce((acc, g) => acc + g.imageCount, 0)

  const handleVisibilityChange = (mode: ProfileVisibilityMode) => {
    if (mode === currentVisibility) {
      setShowVisibilityMenu(false)
      return
    }
    
    // For PUBLIC_LOCKED, redirect to settings to set PIN
    if (mode === 'PUBLIC_LOCKED') {
      window.location.href = '/settings#profile-visibility'
      return
    }

    startTransition(async () => {
      const result = await updateProfileVisibility({ mode })
      if (!result.error) {
        setCurrentVisibility(mode)
      }
      setShowVisibilityMenu(false)
    })
  }

  const visibilityConfig = {
    PRIVATE: { icon: EyeOff, label: 'Private', color: 'text-stone-500', bg: 'bg-stone-100' },
    PUBLIC: { icon: Globe, label: 'Public', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    PUBLIC_LOCKED: { icon: Shield, label: 'PIN Protected', color: 'text-amber-600', bg: 'bg-amber-50' },
  }

  const currentConfig = visibilityConfig[currentVisibility]
  const CurrentIcon = currentConfig.icon

  const profileUrl = profileSlug 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/profile/${profileSlug}`
    : null

  return (
    <div className="min-h-screen bg-white">
      {/* Onboarding Tour */}
      <OnboardingHint section="dashboard" />

      {/* Hero Header - Apple inspired */}
      <header className="min-h-[40vh] flex flex-col items-center justify-center px-6" data-onboarding="dashboard-header">
        <motion.h1 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1, 
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="font-sans text-[clamp(2rem,8vw,5rem)] font-medium tracking-[-0.02em] text-stone-900 text-center leading-[1.1] flex items-center justify-center gap-4"
        >
          {photographerName || 'My Galleries'}
          {country && hasCustomFlag(country) && (
            <CountryFlag country={country} size="lg" />
          )}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-base text-stone-400 mt-6"
        >
          {galleries.length} galleries · {totalImages} images
        </motion.p>

        {/* Visibility Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative mt-6 flex items-center gap-3"
        >
          <button
            onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
            disabled={isPending}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${currentConfig.bg} ${currentConfig.color} border-current/20 hover:border-current/40`}
          >
            <CurrentIcon className="w-4 h-4" />
            <span className="text-sm font-medium">{currentConfig.label}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showVisibilityMenu ? 'rotate-180' : ''}`} />
          </button>
          
          {/* View Profile Link */}
          {currentVisibility !== 'PRIVATE' && profileSlug && (
            <a
              href={`/profile/${profileSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Profile</span>
            </a>
          )}

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showVisibilityMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-xl border border-stone-200 py-2 min-w-[200px] z-50"
              >
                {(Object.entries(visibilityConfig) as [ProfileVisibilityMode, typeof currentConfig][]).map(([mode, config]) => {
                  const Icon = config.icon
                  const isActive = mode === currentVisibility
                  return (
                    <button
                      key={mode}
                      onClick={() => handleVisibilityChange(mode)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-stone-50 transition-colors ${isActive ? 'bg-stone-50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="text-left flex-1">
                        <div className={`text-sm font-medium ${isActive ? 'text-stone-900' : 'text-stone-700'}`}>
                          {config.label}
                        </div>
                        <div className="text-xs text-stone-400">
                          {mode === 'PRIVATE' && 'Only you can see'}
                          {mode === 'PUBLIC' && 'Anyone can view'}
                          {mode === 'PUBLIC_LOCKED' && 'PIN for galleries'}
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-emerald-500" />}
                    </button>
                  )
                })}
                
                {/* View Profile Link */}
                {currentVisibility !== 'PRIVATE' && profileSlug && (
                  <>
                    <div className="border-t border-stone-100 my-2" />
                    <a
                      href={profileUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-stone-50 transition-colors text-stone-600"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">View Public Profile</span>
                    </a>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      {/* Category Filters */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 h-12 overflow-x-auto">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  text-[11px] tracking-[0.2em] transition-colors relative whitespace-nowrap
                  ${activeCategory === category 
                    ? 'text-stone-900' 
                    : 'text-stone-400 hover:text-stone-600'
                  }
                `}
              >
                {category}
                {activeCategory === category && (
                  <motion.div
                    layoutId="activeCategoryDash"
                    className="absolute -bottom-[13px] left-0 right-0 h-px bg-stone-900"
                  />
                )}
              </button>
            ))}
            
            {/* Search */}
            <div className="relative ml-4">
              <Search className="w-4 h-4 text-stone-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Search Input (subtle) */}
      {searchQuery && (
        <div className="max-w-7xl mx-auto px-6 py-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full max-w-xs mx-auto block text-center text-sm border-0 border-b border-stone-200 focus:border-stone-400 focus:ring-0 bg-transparent placeholder:text-stone-300 pb-2"
            autoFocus
          />
        </div>
      )}

      {/* Feature Hints Container - Handles single or multiple banners elegantly */}
      <div className="max-w-7xl mx-auto">
        <FeatureHintsContainer
          showClientPortal={showFeatureHint}
          onDismissClientPortal={dismissFeatureHint}
          contest={activeContest || null}
          userPlan={userPlan}
        />
      </div>

      {/* First-time user hint */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <FeatureBanner
          id="dashboard-welcome"
          title="Welcome to 12img"
          description="Create galleries to share with clients, manage contracts and messaging in the Clients section, and customize your public profile in Settings."
          icon={<Plus className="w-5 h-5 text-white" />}
        />
      </div>

      {/* Gallery List */}
      <div className="max-w-7xl mx-auto px-6 py-8" data-onboarding="dashboard-galleries">
        {filteredGalleries.length === 0 ? (
          <EmptyState hasSearch={!!searchQuery} onClearSearch={() => setSearchQuery('')} userPlan={userPlan} />
        ) : (
          /* Premium minimal layout */
          <div>
            {visibleGalleries.map((gallery, index) => (
              <GalleryCard 
                key={gallery.id} 
                gallery={gallery} 
                index={index}
                isHovered={hoveredId === gallery.id}
                onHover={() => setHoveredId(gallery.id)}
                onLeave={() => setHoveredId(null)}
              />
            ))}
            
            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center py-12">
                <button
                  onClick={() => setVisibleCount(prev => prev + GALLERIES_PER_PAGE)}
                  className="group flex flex-col items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <span className="text-[10px] tracking-[0.2em] uppercase">Load More</span>
                  <span className="text-xs text-stone-300 group-hover:text-stone-400 transition-colors">
                    {remainingCount} more {remainingCount === 1 ? 'gallery' : 'galleries'}
                  </span>
                  <ChevronDown className="w-4 h-4 mt-1" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// FEATURE HINTS CONTAINER
// Handles single or multiple promotional banners elegantly
// - Single banner: Full width, centered
// - Multiple banners: Side-by-side on desktop, stacked on mobile
// ============================================================================

const PAID_PLANS = ['essential', 'pro', 'studio', 'elite']

function FeatureHintsContainer({
  showClientPortal,
  onDismissClientPortal,
  contest,
  userPlan = 'free'
}: {
  showClientPortal: boolean
  onDismissClientPortal: () => void
  contest: {
    id: string
    name: string
    theme: string | null
    status: 'submissions_open' | 'voting'
  } | null
  userPlan?: string
}) {
  const isPaidUser = PAID_PLANS.includes(userPlan.toLowerCase())
  const [spotlightDismissed, setSpotlightDismissed] = useState(true)
  
  // Check if spotlight was dismissed
  useEffect(() => {
    if (!contest) return
    const dismissedContests = localStorage.getItem('12img_spotlight_dismissed')
    const dismissedIds = dismissedContests ? JSON.parse(dismissedContests) : []
    setSpotlightDismissed(dismissedIds.includes(contest.id))
  }, [contest])
  
  const handleDismissSpotlight = () => {
    setSpotlightDismissed(true)
    if (!contest) return
    const dismissedContests = localStorage.getItem('12img_spotlight_dismissed')
    const dismissedIds = dismissedContests ? JSON.parse(dismissedContests) : []
    dismissedIds.push(contest.id)
    localStorage.setItem('12img_spotlight_dismissed', JSON.stringify(dismissedIds))
  }
  
  const showSpotlight = isPaidUser && contest && !spotlightDismissed
  const bothVisible = showClientPortal && showSpotlight
  
  // Nothing to show
  if (!showClientPortal && !showSpotlight) return null
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 pt-6"
    >
      <div className={`flex gap-3 ${bothVisible ? 'flex-col sm:flex-row' : ''}`}>
        {/* Client Portal Hint */}
        <AnimatePresence>
          {showClientPortal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={bothVisible ? 'flex-1' : 'w-full'}
            >
              <div className="flex items-center justify-between py-3 px-4 bg-stone-50 rounded-full border border-stone-100 h-full">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-stone-900 whitespace-nowrap">Client Portal</span>
                    <span className="text-[10px] font-medium text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">New</span>
                  </div>
                  {!bothVisible && (
                    <>
                      <span className="hidden sm:inline text-sm text-stone-500">·</span>
                      <span className="hidden sm:inline text-sm text-stone-500 truncate">Contracts, messaging & more</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href="/dashboard/clients"
                    className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors whitespace-nowrap"
                  >
                    Get Started →
                  </Link>
                  <button
                    onClick={onDismissClientPortal}
                    className="p-1.5 rounded-full hover:bg-stone-200 transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Spotlight Contest Hint */}
        <AnimatePresence>
          {showSpotlight && contest && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={bothVisible ? 'flex-1' : 'w-full'}
            >
              <div className="flex items-center justify-between py-3 px-4 bg-stone-50 rounded-full border border-stone-100 h-full">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-stone-900 whitespace-nowrap">
                      {contest.status === 'submissions_open' ? 'Spotlight' : 'Voting Open'}
                    </span>
                    <span className="text-[10px] font-medium text-stone-500 bg-stone-200 px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0">
                      {contest.status === 'submissions_open' ? 'Open' : 'Live'}
                    </span>
                  </div>
                  {!bothVisible && (
                    <>
                      <span className="hidden sm:inline text-sm text-stone-500">·</span>
                      <span className="hidden sm:inline text-sm text-stone-500 truncate">
                        {contest.theme || (contest.status === 'submissions_open' ? 'Submit your best shot' : "Pick this month's winner")}
                      </span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={contest.status === 'submissions_open' ? '/contest/submit' : '/contest'}
                    className="text-sm font-medium text-stone-900 hover:text-stone-600 transition-colors whitespace-nowrap"
                  >
                    {contest.status === 'submissions_open' ? 'Enter →' : 'Vote →'}
                  </Link>
                  <button
                    onClick={handleDismissSpotlight}
                    className="p-1.5 rounded-full hover:bg-stone-200 transition-colors ml-1"
                  >
                    <X className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

function GalleryCard({ 
  gallery, 
  index,
  isHovered,
  onHover,
  onLeave
}: { 
  gallery: Gallery
  index: number
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleted, setIsDeleted] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isPublic, setIsPublic] = useState(gallery.isPublic)

  const relativePath = `/view-reel/${gallery.slug}`
  const [shareUrl, setShareUrl] = useState(relativePath)
  
  useEffect(() => {
    setShareUrl(`${window.location.origin}${relativePath}`)
  }, [relativePath])

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newValue = !isPublic
    setIsPublic(newValue) // Optimistic update - instant
    
    // Server sync in background (don't block UI)
    const result = await toggleGalleryVisibility(gallery.id, newValue)
    if (result.error) setIsPublic(!newValue) // Revert on error
  }

  const handleDelete = () => {
    setIsDeleted(true)
    setShowDeleteModal(false)
    startTransition(async () => {
      const result = await deleteGallery(gallery.id)
      if (result.error) setIsDeleted(false)
    })
  }

  if (isDeleted) return null

  // Premium gallery card - Apple-inspired minimal design
  return (
    <div
      className="group/card animate-slide-in-bottom"
      style={{ animationDelay: `${Math.min(index * 50, 250)}ms`, animationFillMode: 'backwards' }}
    >
      <div 
        className="relative"
        onMouseEnter={onHover}
        onMouseLeave={() => { if (!showMenu) onLeave() }}
      >
        <Link 
          href={`/gallery/${gallery.slug}`}
          className="block group"
        >
          {/* Card Container */}
          <div className="flex gap-8 py-8 border-b border-stone-100 group-hover:border-stone-200 transition-colors">
            {/* Thumbnail - Large and prominent with micro-details */}
            <div className="w-40 h-40 sm:w-48 sm:h-48 overflow-hidden bg-stone-100 flex-shrink-0 relative group-hover:shadow-2xl transition-all duration-500">
              {gallery.coverImageUrl ? (
                <img
                  src={gallery.coverImageUrl}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-stone-50 to-stone-100">
                  <div className="w-12 h-12 border-2 border-dashed border-stone-200 rounded-xl" />
                  <span className="text-xs text-stone-300 uppercase tracking-[0.2em]">Empty</span>
                </div>
              )}
              
              {/* Micro-writing corner details with gradient for readability */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Subtle gradient overlays for text visibility */}
                <div className="absolute top-0 left-0 w-16 h-8 bg-gradient-to-br from-black/30 to-transparent" />
                <div className="absolute top-0 right-0 w-16 h-8 bg-gradient-to-bl from-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-16 h-8 bg-gradient-to-tr from-black/30 to-transparent" />
                <div className="absolute bottom-0 right-0 w-16 h-8 bg-gradient-to-tl from-black/30 to-transparent" />
                
                {/* Top-left: Image count */}
                <span className="absolute top-2.5 left-3 text-[9px] font-medium tracking-[0.12em] text-white/90">
                  {String(gallery.imageCount).padStart(3, '0')}
                </span>
                
                {/* Top-right: Category initial */}
                {gallery.category && (
                  <span className="absolute top-2.5 right-3 text-[9px] font-medium tracking-[0.12em] text-white/90 uppercase">
                    {gallery.category.slice(0, 3)}
                  </span>
                )}
                
                {/* Bottom-left: Year */}
                <span className="absolute bottom-2.5 left-3 text-[9px] font-medium tracking-[0.12em] text-white/90">
                  {new Date(gallery.createdAt).getFullYear()}
                </span>
                
                {/* Bottom-right: Lock indicator */}
                {gallery.hasPassword && (
                  <Lock className="absolute bottom-2.5 right-3 w-3 h-3 text-white/90" />
                )}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {/* Title - Large elegant typography */}
              <h3 className="text-2xl sm:text-3xl font-medium text-stone-900 leading-tight tracking-[-0.02em] mb-3">
                {gallery.title}
              </h3>
              
              {/* Meta Row - Subtle */}
              <p className="text-base text-stone-400 mb-6">
                {gallery.imageCount} {gallery.imageCount === 1 ? 'photo' : 'photos'}
                <span className="mx-2">·</span>
                {formatRelativeTime(gallery.updatedAt)}
                {gallery.hasPassword && (
                  <>
                    <span className="mx-2">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      Protected
                    </span>
                  </>
                )}
              </p>
              
              {/* Actions - Clean pill buttons */}
              <div className="flex items-center gap-3" onClick={(e) => e.preventDefault()}>
                {/* Visibility Toggle Switch */}
                <button
                  onClick={handleToggleVisibility}
                  disabled={isPending}
                  className="inline-flex items-center gap-3 group/toggle disabled:opacity-50"
                >
                  {/* Toggle Track */}
                  <div className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    isPublic ? 'bg-stone-900' : 'bg-stone-300'
                  }`}>
                    {/* Toggle Knob */}
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      isPublic ? 'left-[22px]' : 'left-0.5'
                    }`} />
                  </div>
                  {/* Label */}
                  <span className="text-sm font-medium text-stone-600 group-hover/toggle:text-stone-900 transition-colors">
                    {isPublic ? 'Public' : 'Private'}
                  </span>
                </button>
                
                {/* Copy Link */}
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-all duration-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-stone-900" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                
                {/* Preview */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(relativePath, '_blank')
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-stone-900 text-white hover:bg-stone-800 transition-all duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </button>
              </div>
            </div>
          </div>
        </Link>

        {/* Menu Button + Dropdown Container */}
        <div className={`absolute right-0 top-1/2 -translate-y-1/2 ${isHovered || showMenu ? 'opacity-100' : 'opacity-0'} transition-all duration-200`}>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-stone-600" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              {/* Invisible backdrop to close menu on click outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => { setShowMenu(false); onLeave() }}
              />
              <div
                className="absolute top-full right-0 mt-1 bg-white shadow-2xl border border-stone-200 rounded-lg py-1.5 min-w-[180px] z-50 animate-zoom-in max-h-[300px] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
            <Link
              href={`/gallery/${gallery.slug}`}
              className="block px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Edit
            </Link>
            <Link
              href={`/gallery/${gallery.slug}/settings`}
              className="block px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Settings
            </Link>
            
            <div className="border-t border-stone-100 my-1" />
            
            <Link
              href={`/contest/submit?gallery=${gallery.id}`}
              className="block px-4 py-2.5 text-sm text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Submit to Spotlight
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMenu(false)
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-stone-900 hover:bg-stone-50 transition-colors"
            >
              Archive
            </button>
            
            <div className="border-t border-stone-100 my-1" />
            
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMenu(false)
                setShowDeleteModal(true)
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
              </div>
            </>
          )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 max-w-sm w-full shadow-2xl rounded-xl animate-zoom-in"
          >
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-stone-900 text-center mb-2">
              Delete Gallery?
            </h3>
            <p className="text-sm text-stone-500 text-center mb-6">
              "{gallery.title}" and all {gallery.imageCount} images will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function EmptyState({ hasSearch, onClearSearch, userPlan }: { hasSearch: boolean; onClearSearch: () => void; userPlan: string }) {
  if (hasSearch) {
    return (
      <div className="text-center py-24">
        <p className="text-stone-400 mb-4">No galleries match your search</p>
        <button 
          onClick={onClearSearch}
          className="text-sm text-stone-900 underline underline-offset-4"
        >
          Clear search
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      {/* Simple centered card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12"
      >
        <Link href="/gallery/create">
          <motion.div
            whileHover={{ y: -4 }}
            className="w-48 h-56 bg-white border border-stone-200 rounded-sm flex flex-col items-center justify-center cursor-pointer group hover:border-stone-200 hover:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-all"
          >
            <div className="relative w-10 h-10 mb-3">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-px bg-stone-300 group-hover:bg-stone-400 transition-colors" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-5 bg-stone-300 group-hover:bg-stone-400 transition-colors" />
            </div>
            <span className="text-[9px] tracking-[0.25em] text-stone-400 uppercase group-hover:text-stone-500 transition-colors">
              New Gallery
            </span>
          </motion.div>
        </Link>
      </motion.div>

      {/* Typography */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="text-center max-w-xs"
      >
        <h3 className="text-xl font-light text-stone-900 tracking-[-0.01em] mb-2">
          Begin your collection
        </h3>
        <p className="text-sm text-stone-400 font-light leading-relaxed mb-6">
          Every great portfolio starts with a single gallery.
        </p>
        
        <Link href="/gallery/create">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white text-sm hover:bg-stone-800 transition-colors"
          >
            Create Gallery
            <span>→</span>
          </motion.button>
        </Link>
      </motion.div>

      {/* Promo hint - ultra subtle, at the bottom */}
      <PromoBanner userPlan={userPlan} />
    </div>
  )
}
