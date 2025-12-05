'use client'

import { useState, useMemo } from 'react'
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
import { useTransition } from 'react'

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
        <h1 className="font-serif text-4xl md:text-5xl text-neutral-900 font-light tracking-tight mb-2">
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
            className="w-full h-11 pl-11 pr-4 text-sm bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-300 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 px-4 text-sm bg-white border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-neutral-900/5 transition-all appearance-none cursor-pointer pr-10 text-neutral-700"
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
          <div className="flex bg-white border border-neutral-200 rounded-full p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-full transition-all ${
                viewMode === 'grid' 
                  ? 'bg-neutral-900 text-white' 
                  : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-full transition-all ${
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
                <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
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
              <>
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center mb-6 border border-neutral-200">
                  <Plus className="h-8 w-8 text-neutral-400" />
                </div>
                <h3 className="font-serif text-2xl text-neutral-900 mb-2">Start your collection</h3>
                <p className="text-neutral-500 mb-6 text-center max-w-sm">
                  Create your first gallery to showcase your photography
                </p>
                <Link href="/gallery/create">
                  <Button className="rounded-full h-11 px-8 bg-neutral-900 hover:bg-neutral-800">
                    <Plus className="w-4 h-4 mr-2" />
                    New Gallery
                  </Button>
                </Link>
              </>
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
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleted, setIsDeleted] = useState(false)

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/g/${gallery.slug}`
    : `/g/${gallery.slug}`

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

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm(`Delete "${gallery.title}"? This cannot be undone.`)) {
      setIsDeleted(true)
      startTransition(async () => {
        const result = await deleteGallery(gallery.id)
        if (result.error) setIsDeleted(false)
      })
    }
    setShowMenu(false)
  }

  if (isDeleted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link 
        href={`/gallery/${gallery.id}`}
        className="group block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setShowMenu(false) }}
      >
        {/* Image Container */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 mb-4">
          {gallery.coverImageUrl ? (
            <motion.img
              src={gallery.coverImageUrl}
              alt=""
              className="w-full h-full object-cover"
              animate={{ scale: isHovered ? 1.05 : 1 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
              <ImageIcon className="w-10 h-10 text-neutral-300" />
            </div>
          )}
          
          {/* Gradient Overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Top Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {gallery.hasPassword && (
              <div className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm">
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
              className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors"
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
                className="absolute top-14 right-3 bg-white rounded-xl shadow-xl border border-neutral-100 py-1.5 min-w-[160px] z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-3"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Live
                </a>
                <div className="border-t border-neutral-100 my-1.5" />
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {isPending ? 'Deleting...' : 'Delete'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Info Overlay (on hover) */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.3 }}
          >
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-neutral-900 hover:bg-white transition-colors shadow-lg"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Gallery
            </a>
          </motion.div>
        </div>
        
        {/* Card Info */}
        <div className="space-y-1.5">
          <h3 className="font-medium text-neutral-900 text-lg truncate group-hover:text-neutral-700 transition-colors">
            {gallery.title}
          </h3>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {gallery.imageCount} {gallery.imageCount === 1 ? 'item' : 'items'}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="text-neutral-400">{formattedDate}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

// Elegant List Card
function GalleryCardList({ gallery, index }: { gallery: Gallery; index: number }) {
  const [copied, setCopied] = useState(false)
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/g/${gallery.slug}`
    : `/g/${gallery.slug}`

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
        href={`/gallery/${gallery.id}`}
        className="flex items-center gap-5 p-4 bg-white rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-md transition-all group"
      >
        {/* Thumbnail */}
        <div className="w-20 h-20 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0">
          {gallery.coverImageUrl ? (
            <img 
              src={gallery.coverImageUrl} 
              alt="" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
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
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
            className="h-9 px-4 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors flex items-center gap-2"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="h-9 w-9 flex items-center justify-center text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </Link>
    </motion.div>
  )
}
