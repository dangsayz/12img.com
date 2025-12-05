'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { 
  Heart, 
  Download, 
  Grid3X3, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight, 
  X,
  Check,
  Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'

// Demo image data with categories
const demoImages = [
  { id: 1, src: '/images/showcase/modern-wedding-gallery-01.jpg', category: 'Ceremony', title: 'Grand Exit' },
  { id: 2, src: '/images/showcase/modern-wedding-gallery-02.jpg', category: 'Reception', title: 'First Dance' },
  { id: 3, src: '/images/showcase/modern-wedding-gallery-03.jpg', category: 'Details', title: 'Ring Shot' },
  { id: 4, src: '/images/showcase/modern-wedding-gallery-04.jpg', category: 'Ceremony', title: 'Vows' },
  { id: 5, src: '/images/showcase/modern-wedding-gallery-05.jpg', category: 'Portraits', title: 'Couple Portrait' },
  { id: 6, src: '/images/showcase/modern-wedding-gallery-06.jpg', category: 'Reception', title: 'Cake Cutting' },
  { id: 7, src: '/images/showcase/modern-wedding-gallery-07.jpg', category: 'Details', title: 'Bouquet' },
  { id: 8, src: '/images/showcase/modern-wedding-gallery-08.jpg', category: 'Portraits', title: 'Golden Hour' },
  { id: 9, src: '/images/showcase/modern-wedding-gallery-09.jpg', category: 'Ceremony', title: 'Walking Down' },
]

const categories = ['All photos', 'Ceremony', 'Reception', 'Portraits', 'Details']

export function DemoGallery() {
  const [selectedCategory, setSelectedCategory] = useState('All photos')
  const [favorites, setFavorites] = useState<number[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid')
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFavorites, setShowFavorites] = useState(false)

  const filteredImages = demoImages.filter(img => {
    if (showFavorites) return favorites.includes(img.id)
    if (selectedCategory === 'All photos') return true
    return img.category === selectedCategory
  })

  const toggleFavorite = useCallback((id: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    )
  }, [])

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    setCurrentImageIndex(prev => (prev + 1) % filteredImages.length)
  }

  const prevImage = () => {
    setCurrentImageIndex(prev => (prev - 1 + filteredImages.length) % filteredImages.length)
  }

  return (
    <section id="demo-gallery" className="py-20 lg:py-28 bg-gradient-to-b from-white to-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-medium text-emerald-800">Live Demo · No signup required</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
            Try the gallery as if you were a client
          </h2>
          <p className="text-[#78716C] max-w-2xl mx-auto">
            Click around, open images, favorite your picks — this is exactly how your clients experience 12img.
          </p>
        </motion.div>

        {/* Gallery Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[#A8A29E] mr-1" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setShowFavorites(false) }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat && !showFavorites
                    ? 'bg-[#1C1917] text-white'
                    : 'bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                showFavorites
                  ? 'bg-rose-500 text-white'
                  : 'bg-[#F5F5F4] text-[#78716C] hover:bg-[#E7E5E4]'
              }`}
            >
              <Heart className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
              Favorites ({favorites.length})
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#F5F5F4] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="w-4 h-4 text-[#78716C]" />
              </button>
              <button
                onClick={() => setViewMode('masonry')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'masonry' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
                aria-label="Masonry view"
              >
                <LayoutGrid className="w-4 h-4 text-[#78716C]" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className={`grid gap-3 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
          }`}
        >
          <AnimatePresence mode="popLayout">
            {filteredImages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-16 text-center"
              >
                <Heart className="w-12 h-12 text-[#E7E5E4] mx-auto mb-4" />
                <p className="text-[#78716C]">No favorites yet. Click the heart icon on any image to add it.</p>
              </motion.div>
            ) : (
              filteredImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative group cursor-pointer overflow-hidden rounded-xl bg-[#F5F5F4] ${
                    viewMode === 'masonry' && index % 3 === 0 ? 'row-span-2' : ''
                  }`}
                  onClick={() => openLightbox(index)}
                >
                  <div className={`relative ${
                    viewMode === 'masonry' && index % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'
                  }`}>
                    <Image
                      src={image.src}
                      alt={image.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Image Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                      <p className="text-white text-sm font-medium">{image.title}</p>
                      <p className="text-white/70 text-xs">{image.category}</p>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => toggleFavorite(image.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                      aria-label={favorites.includes(image.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart 
                        className={`w-4 h-4 transition-colors ${
                          favorites.includes(image.id) 
                            ? 'fill-rose-500 text-rose-500' 
                            : 'text-[#78716C]'
                        }`} 
                      />
                    </button>

                    {/* Favorited Badge */}
                    {favorites.includes(image.id) && (
                      <div className="absolute top-3 left-3">
                        <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Gallery Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 flex items-center justify-center gap-6 text-sm text-[#A8A29E]"
        >
          <span>{demoImages.length} photos</span>
          <span className="w-1 h-1 rounded-full bg-[#D6D3D1]" />
          <span>{favorites.length} favorited</span>
          <span className="w-1 h-1 rounded-full bg-[#D6D3D1]" />
          <span className="text-[#78716C]">Demo only</span>
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && filteredImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage() }}
              className="absolute left-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextImage() }}
              className="absolute right-4 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Image */}
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl max-h-[85vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src={filteredImages[currentImageIndex].src}
                  alt={filteredImages[currentImageIndex].title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Lightbox Controls */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(filteredImages[currentImageIndex].id) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors"
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      favorites.includes(filteredImages[currentImageIndex].id) 
                        ? 'fill-rose-500 text-rose-500' 
                        : ''
                    }`} 
                  />
                  {favorites.includes(filteredImages[currentImageIndex].id) ? 'Favorited' : 'Favorite'}
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>

              {/* Image Counter */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm">
                {currentImageIndex + 1} / {filteredImages.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
