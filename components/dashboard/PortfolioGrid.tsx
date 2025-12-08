'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Lock, Eye, Search } from 'lucide-react'

interface Gallery {
  id: string
  title: string
  slug: string
  coverUrl?: string
  imageCount: number
  category?: string
  isPasswordProtected?: boolean
  isSneak?: boolean
  createdAt: string
}

interface PortfolioGridProps {
  galleries: Gallery[]
  photographerName?: string
  categories?: string[]
}

export function PortfolioGrid({ 
  galleries, 
  photographerName,
  categories = ['ALL', 'FAMILY', 'WEDDING', 'PORTRAITS', 'LIFESTYLE']
}: PortfolioGridProps) {
  const [activeCategory, setActiveCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filteredGalleries = useMemo(() => {
    return galleries.filter(gallery => {
      const matchesCategory = activeCategory === 'ALL' || gallery.category === activeCategory
      const matchesSearch = gallery.title.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [galleries, activeCategory, searchQuery])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="py-16 text-center border-b border-stone-100">
        {photographerName && (
          <h1 className="text-2xl font-light tracking-[0.2em] text-stone-900 uppercase">
            {photographerName}
          </h1>
        )}
      </header>

      {/* Category Filters */}
      <nav className="sticky top-0 z-40 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-center gap-8 h-14">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`
                  text-xs tracking-[0.15em] transition-colors relative
                  ${activeCategory === category 
                    ? 'text-stone-900' 
                    : 'text-stone-400 hover:text-stone-600'
                  }
                `}
              >
                {category}
                {activeCategory === category && (
                  <motion.div
                    layoutId="activeCategory"
                    className="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-stone-900"
                  />
                )}
              </button>
            ))}
            
            {/* Search */}
            <button 
              className="text-stone-400 hover:text-stone-600 transition-colors ml-4"
              onClick={() => {
                const input = document.getElementById('search-input')
                input?.focus()
              }}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Search Bar (hidden by default, could be toggled) */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search galleries..."
          className="w-full max-w-xs mx-auto block text-center text-sm border-0 border-b border-transparent focus:border-stone-200 focus:ring-0 bg-transparent placeholder:text-stone-300"
        />
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
          {filteredGalleries.map((gallery, index) => (
            <motion.div
              key={gallery.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <Link 
                href={`/gallery/${gallery.id}`}
                className="block group"
                onMouseEnter={() => setHoveredId(gallery.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Cover Image */}
                <div className="relative aspect-[4/5] bg-stone-100 mb-4 overflow-hidden">
                  {gallery.coverUrl ? (
                    <Image
                      src={gallery.coverUrl}
                      alt={gallery.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-stone-300 text-sm">No cover</span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {gallery.isPasswordProtected && (
                      <div className="px-2 py-1 bg-stone-900/80 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        LOGIN
                      </div>
                    )}
                    {gallery.isSneak && (
                      <div className="px-2 py-1 bg-stone-700/80 backdrop-blur-sm text-white text-[10px] uppercase tracking-wider">
                        A SNEAK PEEK
                      </div>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredId === gallery.id ? 1 : 0 }}
                    className="absolute inset-0 bg-black/10 flex items-center justify-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-stone-700" />
                    </div>
                  </motion.div>
                </div>

                {/* Gallery Info */}
                <div className="text-center">
                  <h3 className="text-sm font-light tracking-wide text-stone-900 uppercase">
                    {gallery.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Empty State */}
        {filteredGalleries.length === 0 && (
          <div className="text-center py-20">
            <p className="text-stone-400">No galleries found</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-stone-100">
        <p className="text-xs text-stone-400 tracking-wide">
          © {new Date().getFullYear()} {photographerName}
        </p>
      </footer>
    </div>
  )
}
