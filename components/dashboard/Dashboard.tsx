'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, Grid3X3, List, Image, FolderOpen, Plus } from 'lucide-react'
import { GalleryCard } from '../gallery/GalleryCard'
import { Button } from '@/components/ui/button'

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

  // Calculate stats
  const stats = useMemo(() => ({
    totalGalleries: galleries.length,
    totalImages: galleries.reduce((acc, g) => acc + g.imageCount, 0),
    privateGalleries: galleries.filter(g => g.hasPassword).length,
  }), [galleries])

  // Filter and sort galleries
  const filteredGalleries = useMemo(() => {
    let result = [...galleries]
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(g => g.title.toLowerCase().includes(query))
    }
    
    // Sort
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

  return (
    <div className="space-y-8">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalGalleries}</p>
              <p className="text-xs text-gray-500">Galleries</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <Image className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalImages}</p>
              <p className="text-xs text-gray-500">Total Images</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-semibold text-gray-900">{stats.privateGalleries}</p>
              <p className="text-xs text-gray-500">Private</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search galleries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-10 px-3 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 appearance-none cursor-pointer pr-8"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
            <option value="images">Most Images</option>
          </select>

          {/* View Toggle */}
          <div className="flex bg-white border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Gallery Grid/List */}
      {filteredGalleries.length === 0 ? (
        <div className="text-center py-16">
          {searchQuery ? (
            <>
              <p className="text-gray-500">No galleries match "{searchQuery}"</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-2 text-sm text-gray-900 underline underline-offset-4"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 border border-gray-100">
                <Plus className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 mb-4">No galleries yet</p>
              <Link href="/upload">
                <Button className="rounded-full h-10 px-6">
                  Create Your First Gallery
                </Button>
              </Link>
            </>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGalleries.map((gallery) => (
            <GalleryCard key={gallery.id} gallery={gallery} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredGalleries.map((gallery) => (
            <GalleryCardList key={gallery.id} gallery={gallery} />
          ))}
        </div>
      )}
    </div>
  )
}

// Compact list view card
function GalleryCardList({ gallery }: { gallery: Gallery }) {
  const formattedDate = new Date(gallery.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <Link 
      href={`/gallery/${gallery.id}`}
      className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
    >
      <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
        {gallery.coverImageUrl ? (
          <img src={gallery.coverImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Image className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate group-hover:text-gray-700">{gallery.title}</h3>
        <p className="text-xs text-gray-400">{gallery.imageCount} images • {formattedDate}</p>
      </div>

      {gallery.hasPassword && (
        <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
      )}
    </Link>
  )
}
