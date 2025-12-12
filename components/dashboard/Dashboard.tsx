'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Grid3X3, 
  LayoutList, 
  Image as ImageIcon, 
  Plus,
  Calendar,
  Lock,
  ExternalLink,
  MoreHorizontal,
  Trash2,
  Copy,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteGallery } from '@/server/actions/gallery.actions'

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
}

interface DashboardProps {
  galleries: Gallery[]
}

type SortOption = 'newest' | 'oldest' | 'name' | 'images'

export function Dashboard({ galleries }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and sort galleries
  const filteredGalleries = useMemo(() => {
    let result = [...galleries]
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(g => g.title.toLowerCase().includes(query))
    }
    
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        break
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        break
      case 'name':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'images':
        result.sort((a, b) => b.imageCount - a.imageCount)
        break
    }
    
    return result
  }, [galleries, searchQuery, sortBy])

  const totalImages = galleries.reduce((acc, g) => acc + g.imageCount, 0)

  return (
    <div className="min-h-[calc(100vh-120px)]">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl text-neutral-900 font-extralight tracking-[-0.02em] mb-2">
          Collections
        </h1>
        <p className="text-neutral-500">
          {galleries.length} {galleries.length === 1 ? 'gallery' : 'galleries'} · {totalImages} images
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-300 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 px-4 text-sm bg-white border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all appearance-none cursor-pointer pr-10 text-neutral-700"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23737373'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, 
              backgroundRepeat: 'no-repeat', 
              backgroundPosition: 'right 12px center', 
              backgroundSize: '16px' 
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">By Name</option>
            <option value="images">Most Images</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-white border border-neutral-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-all ${
                viewMode === 'grid' 
                  ? 'bg-neutral-900 text-white' 
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-all ${
                viewMode === 'list' 
                  ? 'bg-neutral-900 text-white' 
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid/List */}
      <AnimatePresence mode="wait">
        {filteredGalleries.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center py-24"
          >
            {searchQuery ? (
              <>
                <div className="h-16 w-16 bg-neutral-100 flex items-center justify-center mb-6">
                  <Search className="w-7 h-7 text-neutral-300" />
                </div>
                <p className="text-neutral-500 mb-2">No collections match "{searchQuery}"</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-neutral-900 font-medium hover:underline underline-offset-4"
                >
                  Clear search
                </button>
              </>
            ) : (
              <div className="w-full max-w-2xl mx-auto">
                {/* Hero illustration */}
                <div className="relative mb-8">
                  {/* Decorative elements */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-amber-100/40 via-rose-100/30 to-violet-100/40 blur-3xl" />
                  
                  {/* Stacked gallery preview cards */}
                  <div className="relative flex justify-center items-end gap-3 h-48">
                    {/* Left card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20, rotate: -6 }}
                      animate={{ opacity: 1, y: 0, rotate: -6 }}
                      transition={{ delay: 0.1 }}
                      className="w-32 h-40 bg-gradient-to-br from-stone-200 to-stone-300 shadow-lg transform -rotate-6 border border-white/50"
                    >
                      <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-amber-400/60" />
                      </div>
                    </motion.div>
                    
                    {/* Center card (main) */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="w-40 h-48 bg-white shadow-2xl border border-neutral-100 z-10 overflow-hidden"
                    >
                      <div className="w-full h-32 bg-gradient-to-br from-violet-100 via-purple-100 to-fuchsia-100" />
                      <div className="p-3">
                        <div className="h-2 w-20 bg-neutral-200 mb-2" />
                        <div className="h-2 w-12 bg-neutral-100" />
                      </div>
                    </motion.div>
                    
                    {/* Right card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20, rotate: 6 }}
                      animate={{ opacity: 1, y: 0, rotate: 6 }}
                      transition={{ delay: 0.3 }}
                      className="w-32 h-40 bg-gradient-to-br from-emerald-100 to-teal-200 shadow-lg transform rotate-6 border border-white/50 flex items-center justify-center"
                    >
                      <ImageIcon className="w-8 h-8 text-emerald-400/60" />
                    </motion.div>
                  </div>
                </div>
                
                {/* Content */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center"
                >
                  <h3 className="text-2xl md:text-3xl text-neutral-900 font-light tracking-tight mb-3">
                    Your gallery awaits
                  </h3>
                  <p className="text-neutral-500 mb-8 text-base max-w-md mx-auto leading-relaxed">
                    Create beautiful, password-protected galleries to share your work with clients
                  </p>
                  
                  <Link href="/upload">
                    <Button className="h-12 bg-[#1C1917] px-8 text-base font-medium text-white hover:bg-[#292524] hover:scale-105 transition-all shadow-lg shadow-neutral-900/10">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Gallery
                    </Button>
                  </Link>
                </motion.div>
                
                {/* Feature hints */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-neutral-400"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Password protection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>Unlimited uploads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    <span>Easy sharing</span>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        ) : viewMode === 'grid' ? (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredGalleries.map((gallery, index) => (
              <GalleryCardGrid key={gallery.id} gallery={gallery} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredGalleries.map((gallery, index) => (
              <GalleryCardList key={gallery.id} gallery={gallery} index={index} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Breathtaking Grid Card
function GalleryCardGrid({ gallery, index }: { gallery: Gallery; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleted, setIsDeleted] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Build share URL on client only to avoid hydration mismatch
  const relativePath = `/view-reel/${gallery.slug}`
  const [shareUrl, setShareUrl] = useState(relativePath)
  
  useEffect(() => {
    setShareUrl(`${window.location.origin}${relativePath}`)
  }, [relativePath])

  const formattedDate = new Date(gallery.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openDeleteModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowMenu(false)
    setShowDeleteModal(true)
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link 
        href={`/gallery/${gallery.slug}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
      >
        {/* Image Container with Title Overlay */}
        <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100">
          {gallery.coverImageUrl && !imageError ? (
            <motion.img
              src={gallery.coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
              <ImageIcon className="w-10 h-10 text-neutral-600" />
            </div>
          )}
          
          {/* Permanent Gradient Overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Title & Info Overlay - Always visible on image */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 
              className="font-bold text-white text-xl leading-tight mb-2 drop-shadow-lg"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
            >
              {gallery.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span className="w-1.5 h-1.5 bg-emerald-400" />
              <span>{gallery.imageCount} {gallery.imageCount === 1 ? 'item' : 'items'}</span>
              <span className="text-white/40">·</span>
              <span>{formattedDate}</span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {gallery.hasPassword && (
              <div className="h-8 w-8 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <Lock className="w-3.5 h-3.5 text-neutral-600" />
              </div>
            )}
            
            {/* Menu Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="h-8 w-8 bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-neutral-600" />
            </motion.button>
          </div>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-14 right-3 bg-white shadow-xl border border-neutral-100 py-1.5 min-w-[160px] z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    window.open(`/view-reel/${gallery.slug}`, '_blank')
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live
                </button>
                <div className="border-t border-neutral-100 my-1.5" />
                <button
                  onClick={openDeleteModal}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hover Action Button */}
          <motion.div
            className="absolute bottom-20 left-0 right-0 flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                window.open(relativePath, '_blank')
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm text-sm font-medium text-neutral-900 hover:bg-white transition-colors shadow-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Gallery
            </button>
          </motion.div>
        </div>
      </Link>

      {/* Delete Confirmation Modal - Portal to body to escape transform context */}
      {showDeleteModal && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white p-6 max-w-sm w-full shadow-2xl border border-neutral-100"
            >
              {/* Icon */}
              <div className="w-12 h-12 bg-red-50 flex items-center justify-center mb-4 mx-auto">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              
              <h3 className="text-lg font-semibold text-neutral-900 text-center mb-2">
                Delete "{gallery.title}"?
              </h3>
              <p className="text-sm text-neutral-500 text-center mb-6">
                This will permanently delete the gallery and all {gallery.imageCount} {gallery.imageCount === 1 ? 'image' : 'images'}. This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  )
}

// Elegant List Card
function GalleryCardList({ gallery, index }: { gallery: Gallery; index: number }) {
  const [copied, setCopied] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Build share URL on client only to avoid hydration mismatch
  const relativePath = `/view-reel/${gallery.slug}`
  const [shareUrl, setShareUrl] = useState(relativePath)
  
  useEffect(() => {
    setShareUrl(`${window.location.origin}${relativePath}`)
  }, [relativePath])

  const formattedDate = new Date(gallery.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
    >
      <Link 
        href={`/gallery/${gallery.slug}`}
        className="flex items-center gap-5 p-4 bg-white border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all group"
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 bg-neutral-100 overflow-hidden flex-shrink-0">
          {gallery.coverImageUrl && !imageError ? (
            <img 
              src={gallery.coverImageUrl} 
              alt="" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-neutral-300" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-neutral-900 text-lg truncate group-hover:text-neutral-700 transition-colors">
            {gallery.title}
          </h3>
          <div className="flex items-center gap-3 mt-1 text-sm">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-2 h-2 bg-emerald-400" />
              {gallery.imageCount} items
            </span>
            <span className="flex items-center gap-1.5 text-neutral-400">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            {gallery.hasPassword && (
              <span className="flex items-center gap-1.5 text-neutral-400">
                <Lock className="w-3.5 h-3.5" />
                Private
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="h-9 px-4 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="h-9 w-9 flex items-center justify-center text-neutral-600 bg-neutral-100 hover:bg-neutral-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </Link>
    </motion.div>
  )
}
