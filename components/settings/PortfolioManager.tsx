'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { 
  Plus, 
  X, 
  GripVertical, 
  Image as ImageIcon,
  Check,
  Loader2,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import {
  getPortfolioImages,
  getAvailableImagesForPortfolio,
  getGalleriesForPortfolioPicker,
  addToPortfolio,
  removeFromPortfolio,
  reorderPortfolioImages,
  type PortfolioImageData,
} from '@/server/actions/profile.actions'

const MAX_PORTFOLIO_IMAGES = 10

interface AvailableImage {
  id: string
  storagePath: string
  galleryId: string
  galleryTitle: string
  isInPortfolio: boolean
  thumbnailUrl?: string
}

interface Gallery {
  id: string
  title: string
  imageCount: number
}

export function PortfolioManager() {
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImageData[]>([])
  const [availableImages, setAvailableImages] = useState<AvailableImage[]>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [selectedGallery, setSelectedGallery] = useState<string>('all')
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [portfolioResult, galleriesResult] = await Promise.all([
          getPortfolioImages(),
          getGalleriesForPortfolioPicker(),
        ])

        if (portfolioResult.data) {
          setPortfolioImages(portfolioResult.data)
        }
        if (galleriesResult.data) {
          setGalleries(galleriesResult.data)
        }
      } catch (e) {
        setError('Failed to load portfolio data')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Load available images when picker opens or gallery changes
  useEffect(() => {
    if (!isPickerOpen) return

    async function loadAvailable() {
      const result = await getAvailableImagesForPortfolio(
        selectedGallery === 'all' ? undefined : selectedGallery
      )
      if (result.data) {
        setAvailableImages(result.data)
      }
    }
    loadAvailable()
  }, [isPickerOpen, selectedGallery])

  const handleAdd = useCallback((imageId: string) => {
    if (portfolioImages.length >= MAX_PORTFOLIO_IMAGES) {
      setError(`Portfolio is limited to ${MAX_PORTFOLIO_IMAGES} images`)
      return
    }

    startTransition(async () => {
      const result = await addToPortfolio(imageId)
      if (result.error) {
        setError(result.error)
        return
      }

      // Refresh portfolio
      const portfolioResult = await getPortfolioImages()
      if (portfolioResult.data) {
        setPortfolioImages(portfolioResult.data)
      }

      // Update available images
      setAvailableImages(prev => 
        prev.map(img => img.id === imageId ? { ...img, isInPortfolio: true } : img)
      )
    })
  }, [portfolioImages.length])

  const handleRemove = useCallback((imageId: string) => {
    startTransition(async () => {
      const result = await removeFromPortfolio(imageId)
      if (result.error) {
        setError(result.error)
        return
      }

      setPortfolioImages(prev => prev.filter(img => img.imageId !== imageId))
      setAvailableImages(prev => 
        prev.map(img => img.id === imageId ? { ...img, isInPortfolio: false } : img)
      )
    })
  }, [])

  const handleReorder = useCallback((newOrder: PortfolioImageData[]) => {
    setPortfolioImages(newOrder)
    
    // Debounce the save
    startTransition(async () => {
      await reorderPortfolioImages(newOrder.map(img => img.imageId))
    })
  }, [])

  const getImageUrl = (storagePath: string) => {
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/gallery-images/${storagePath}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-stone-900">Portfolio Wall</h3>
          <p className="text-sm text-stone-500 mt-1">
            Select up to {MAX_PORTFOLIO_IMAGES} of your best images to showcase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-400">
            {portfolioImages.length}/{MAX_PORTFOLIO_IMAGES}
          </span>
          <button
            onClick={() => setIsPickerOpen(true)}
            disabled={portfolioImages.length >= MAX_PORTFOLIO_IMAGES}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Images
          </button>
        </div>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center justify-between"
          >
            {error}
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Portfolio Grid */}
      {portfolioImages.length === 0 ? (
        <div className="border-2 border-dashed border-stone-200 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-stone-400" />
          </div>
          <h4 className="text-lg font-medium text-stone-900 mb-2">Curate your best work</h4>
          <p className="text-sm text-stone-500 mb-6 max-w-md mx-auto">
            Select your top {MAX_PORTFOLIO_IMAGES} images to showcase on your public portfolio. 
            These will be the first thing visitors see.
          </p>
          <button
            onClick={() => setIsPickerOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Select Images
          </button>
        </div>
      ) : (
        <Reorder.Group
          axis="x"
          values={portfolioImages}
          onReorder={handleReorder}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
        >
          {portfolioImages.map((image) => (
            <Reorder.Item
              key={image.imageId}
              value={image}
              className="relative aspect-[3/4] rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing"
            >
              <Image
                src={getImageUrl(image.storagePath)}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Drag handle */}
              <div className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-stone-600" />
              </div>
              
              {/* Remove button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(image.imageId)
                }}
                className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-500 hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              
              {/* Gallery title */}
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-white/80 truncate">{image.galleryTitle}</p>
              </div>
              
              {/* Position indicator */}
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs font-medium text-stone-700">{image.position + 1}</span>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      {portfolioImages.length > 0 && (
        <p className="text-xs text-stone-400 text-center">
          Drag to reorder • Click × to remove
        </p>
      )}

      {/* Image Picker Modal */}
      <AnimatePresence>
        {isPickerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPickerOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-10 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <div>
                  <h3 className="text-lg font-medium text-stone-900">Select Portfolio Images</h3>
                  <p className="text-sm text-stone-500">
                    {portfolioImages.length}/{MAX_PORTFOLIO_IMAGES} selected
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Gallery filter */}
                  <div className="relative">
                    <select
                      value={selectedGallery}
                      onChange={(e) => setSelectedGallery(e.target.value)}
                      className="appearance-none pl-4 pr-10 py-2 bg-stone-100 border-0 rounded-lg text-sm font-medium text-stone-700 focus:ring-2 focus:ring-stone-900"
                    >
                      <option value="all">All Galleries</option>
                      {galleries.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title} ({g.imageCount})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                  </div>
                  
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-600" />
                  </button>
                </div>
              </div>
              
              {/* Image Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                {availableImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <ImageIcon className="w-12 h-12 text-stone-300 mb-4" />
                    <p className="text-stone-500">No images found in this gallery</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                    {availableImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => {
                          if (image.isInPortfolio) {
                            handleRemove(image.id)
                          } else {
                            handleAdd(image.id)
                          }
                        }}
                        disabled={isPending || (!image.isInPortfolio && portfolioImages.length >= MAX_PORTFOLIO_IMAGES)}
                        className={`
                          relative aspect-square rounded-lg overflow-hidden group
                          ${image.isInPortfolio ? 'ring-2 ring-emerald-500' : ''}
                          ${!image.isInPortfolio && portfolioImages.length >= MAX_PORTFOLIO_IMAGES ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <Image
                          src={getImageUrl(image.storagePath)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 12.5vw"
                        />
                        
                        {/* Selection overlay */}
                        <div className={`
                          absolute inset-0 flex items-center justify-center transition-all
                          ${image.isInPortfolio 
                            ? 'bg-emerald-500/20' 
                            : 'bg-black/0 group-hover:bg-black/30'
                          }
                        `}>
                          {image.isInPortfolio ? (
                            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="w-5 h-5 text-stone-700" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
                <p className="text-sm text-stone-500">
                  Click images to add or remove from your portfolio
                </p>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="px-6 py-2 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
