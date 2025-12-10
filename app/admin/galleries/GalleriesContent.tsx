'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Trash2,
  ExternalLink,
  MoreHorizontal,
  X,
  TrendingUp,
  Users,
  HardDrive,
  Loader2,
  ArrowUpRight,
  Mail,
  Lock,
  Globe,
} from 'lucide-react'
import type { GalleryAnalytics, GallerySearchResult, GallerySearchFilters } from '@/server/admin/galleries'

interface ConversionCandidate {
  userId: string
  email: string
  plan: string
  businessName: string | null
  storagePercent: number
  galleryCount: number
  totalImages: number
  daysActive: number
  conversionScore: number
  recommendedAction: string
  recommendedPlan: string
}

interface Props {
  galleries: GallerySearchResult
  stats: {
    totalGalleries: number
    publicGalleries: number
    privateGalleries: number
    galleriesThisWeek: number
    totalImages: number
  }
  conversionCandidates: ConversionCandidate[]
  currentFilters: GallerySearchFilters
  currentPage: number
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatCard({ 
  title, 
  value, 
  icon: Icon,
  subtitle,
}: { 
  title: string
  value: string | number
  icon: React.ElementType
  subtitle?: string
}) {
  return (
    <div className="bg-white border border-[#E5E5E5] p-4 lg:p-5 hover:border-[#141414] transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[#525252] uppercase tracking-wider">{title}</p>
          <p className="mt-1 text-2xl lg:text-3xl font-serif text-[#141414]">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-[#737373]">{subtitle}</p>}
        </div>
        <div className="p-2 border border-[#E5E5E5]">
          <Icon className="w-4 h-4 text-[#525252]" />
        </div>
      </div>
    </div>
  )
}

export function GalleriesContent({
  galleries,
  stats,
  conversionCandidates,
  currentFilters,
  currentPage,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  
  const [searchInput, setSearchInput] = useState(currentFilters.search || '')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedGalleries, setSelectedGalleries] = useState<Set<string>>(new Set())
  const [showConversionPanel, setShowConversionPanel] = useState(false)
  
  // Update URL with filters
  const updateFilters = (updates: Partial<GallerySearchFilters & { page?: number }>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, String(value))
      }
    })
    
    // Reset to page 1 when filters change (except for page changes)
    if (!('page' in updates)) {
      params.delete('page')
    }
    
    startTransition(() => {
      router.push(`/admin/galleries?${params.toString()}`)
    })
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search: searchInput })
  }
  
  const toggleSelectAll = () => {
    if (selectedGalleries.size === galleries.data.length) {
      setSelectedGalleries(new Set())
    } else {
      setSelectedGalleries(new Set(galleries.data.map(g => g.id)))
    }
  }
  
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedGalleries)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedGalleries(newSet)
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <StatCard 
          title="Total Galleries" 
          value={stats.totalGalleries.toLocaleString()} 
          icon={ImageIcon}
        />
        <StatCard 
          title="Public" 
          value={stats.publicGalleries.toLocaleString()} 
          icon={Globe}
        />
        <StatCard 
          title="Private" 
          value={stats.privateGalleries.toLocaleString()} 
          icon={Lock}
        />
        <StatCard 
          title="This Week" 
          value={stats.galleriesThisWeek.toLocaleString()} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Total Images" 
          value={stats.totalImages.toLocaleString()} 
          icon={HardDrive}
        />
      </div>
      
      {/* Conversion Candidates Alert */}
      {conversionCandidates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] text-white p-4 lg:p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">
                {conversionCandidates.length} Hot Conversion Candidates
              </p>
              <p className="text-sm text-white/60">
                Free users with high engagement ready to upgrade
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowConversionPanel(!showConversionPanel)}
            className="px-4 py-2 bg-white text-[#141414] text-sm font-medium hover:bg-white/90 transition-colors"
          >
            {showConversionPanel ? 'Hide' : 'View Leads'}
          </button>
        </motion.div>
      )}
      
      {/* Conversion Panel */}
      <AnimatePresence>
        {showConversionPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[#E5E5E5] p-4 lg:p-6">
              <h3 className="font-medium text-[#141414] mb-4">Conversion Candidates</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {conversionCandidates.map((candidate) => (
                  <div
                    key={candidate.userId}
                    className="flex items-center justify-between p-3 border border-[#E5E5E5] hover:border-[#141414] transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#141414] truncate">
                        {candidate.businessName || candidate.email}
                      </p>
                      <p className="text-xs text-[#737373]">
                        {candidate.galleryCount} galleries · {candidate.totalImages} images · Score: {candidate.conversionScore}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider border border-[#E5E5E5]">
                        → {candidate.recommendedPlan}
                      </span>
                      <Link
                        href={`/admin/users?search=${encodeURIComponent(candidate.email)}`}
                        className="p-2 hover:bg-[#F5F5F7] transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-[#525252]" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search & Filters */}
      <div className="bg-white border border-[#E5E5E5] p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title, slug, or user email..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414] transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('')
                    updateFilters({ search: '' })
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-[#F5F5F7] rounded"
                >
                  <X className="w-3 h-3 text-[#737373]" />
                </button>
              )}
            </div>
          </form>
          
          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <select
              value={currentFilters.visibility || 'all'}
              onChange={(e) => updateFilters({ visibility: e.target.value as any })}
              className="px-3 py-2.5 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
            >
              <option value="all">All Visibility</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>
            
            <select
              value={currentFilters.plan || ''}
              onChange={(e) => updateFilters({ plan: e.target.value })}
              className="px-3 py-2.5 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
            >
              <option value="">All Plans</option>
              <option value="free">Free</option>
              <option value="essential">Essential</option>
              <option value="pro">Pro</option>
              <option value="studio">Studio</option>
              <option value="elite">Elite</option>
            </select>
            
            <select
              value={`${currentFilters.sortBy || 'created_at'}-${currentFilters.sortOrder || 'desc'}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-')
                updateFilters({ sortBy: sort as any, sortOrder: order as any })
              }}
              className="px-3 py-2.5 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="image_count-desc">Most Images</option>
              <option value="total_bytes-desc">Largest Size</option>
              <option value="conversion_score-desc">Highest Score</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 border transition-colors ${
                showFilters ? 'border-[#141414] bg-[#141414] text-white' : 'border-[#E5E5E5] hover:border-[#141414]'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-[#E5E5E5] grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-[#525252] mb-1">Min Images</label>
                  <input
                    type="number"
                    value={currentFilters.minImages || ''}
                    onChange={(e) => updateFilters({ minImages: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#525252] mb-1">Max Images</label>
                  <input
                    type="number"
                    value={currentFilters.maxImages || ''}
                    onChange={(e) => updateFilters({ maxImages: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="∞"
                    className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Results Summary */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-4 text-sm text-[#525252]">
            <span>{galleries.total.toLocaleString()} galleries found</span>
            {galleries.aggregates && (
              <>
                <span>·</span>
                <span>{galleries.aggregates.totalImages.toLocaleString()} images</span>
                <span>·</span>
                <span>{formatBytes(galleries.aggregates.totalStorage)}</span>
              </>
            )}
          </div>
          {selectedGalleries.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#525252]">{selectedGalleries.size} selected</span>
              <button className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                Delete Selected
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
        </div>
      )}
      
      {/* Galleries Table */}
      <div className="bg-white border border-[#E5E5E5] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedGalleries.size === galleries.data.length && galleries.data.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[#E5E5E5]"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Gallery
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Owner
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Images
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Size
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Score
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                  Created
                </th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E5]">
              {galleries.data.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#525252]">
                    No galleries found matching your criteria
                  </td>
                </tr>
              ) : (
                galleries.data.map((gallery) => (
                  <tr 
                    key={gallery.id} 
                    className={`hover:bg-[#FAFAFA] transition-colors ${
                      gallery.upgradeCandidate ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedGalleries.has(gallery.id)}
                        onChange={() => toggleSelect(gallery.id)}
                        className="rounded border-[#E5E5E5]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-[#525252]" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/galleries/${gallery.id}`}
                            className="font-medium text-[#141414] hover:underline truncate block"
                          >
                            {gallery.title || 'Untitled'}
                          </Link>
                          <p className="text-xs text-[#737373] truncate">
                            /{gallery.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[#141414] truncate">
                          {gallery.userBusinessName || gallery.userEmail}
                        </p>
                        <p className="text-xs text-[#737373]">
                          <span className="uppercase">{gallery.userPlan}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-medium text-[#141414]">{gallery.imageCount}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[#525252]">{gallery.storageMB} MB</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium ${
                        gallery.conversionScore >= 70 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : gallery.conversionScore >= 50
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#F5F5F7] text-[#525252]'
                      }`}>
                        {gallery.conversionScore}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {gallery.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Globe className="w-3 h-3" />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-[#525252]">
                          <Lock className="w-3 h-3" />
                          Private
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#525252]">
                      {formatDate(gallery.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <a
                          href={`/view-reel/${gallery.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-[#F5F5F7] transition-colors"
                          title="View Gallery"
                        >
                          <ExternalLink className="w-4 h-4 text-[#525252]" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {galleries.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <div className="text-sm text-[#525252]">
              Page {galleries.page} of {galleries.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilters({ page: currentPage - 1 })}
                disabled={currentPage <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#525252] hover:text-[#141414] bg-white border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => updateFilters({ page: currentPage + 1 })}
                disabled={currentPage >= galleries.totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#525252] hover:text-[#141414] bg-white border border-[#E5E5E5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
