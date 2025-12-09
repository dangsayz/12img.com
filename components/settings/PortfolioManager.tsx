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
  LayoutGrid,
  Layers
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
  thumbnailUrl: string
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
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
      setIsLoadingImages(true)
      try {
        const result = await getAvailableImagesForPortfolio(
          selectedGallery === 'all' ? undefined : selectedGallery
        )
        if (result.data) {
          setAvailableImages(result.data)
        } else if (result.error) {
          console.error('Failed to load images:', result.error)
        }
      } catch (e) {
        console.error('Exception loading images:', e)
      } finally {
        setIsLoadingImages(false)
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
            <ImageIcon className="w-8 h-8 text-stone-400" />
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
                src={image.thumbnailUrl || ''}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed inset-4 md:inset-8 lg:inset-12 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">Select Portfolio Images</h3>
                    <p className="text-sm text-stone-500">
                      <span className="font-medium text-stone-700">{portfolioImages.length}</span>
                      <span className="text-stone-400"> / {MAX_PORTFOLIO_IMAGES} selected</span>
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* Custom Gallery Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl text-sm font-medium text-stone-700 transition-colors min-w-[200px] justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4 text-stone-400" />
                        <span className="truncate max-w-[140px]">
                          {selectedGallery === 'all' 
                            ? 'All Galleries' 
                            : galleries.find(g => g.id === selectedGallery)?.title || 'Select Gallery'
                          }
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden z-10"
                        >
                          <div className="max-h-80 overflow-y-auto py-2">
                            {/* All Galleries Option */}
                            <button
                              onClick={() => {
                                setSelectedGallery('all')
                                setIsDropdownOpen(false)
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors ${
                                selectedGallery === 'all' ? 'bg-stone-50' : ''
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                selectedGallery === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
                              }`}>
                                <LayoutGrid className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-stone-900">All Galleries</p>
                                <p className="text-xs text-stone-500">
                                  {galleries.reduce((sum, g) => sum + g.imageCount, 0)} images total
                                </p>
                              </div>
                              {selectedGallery === 'all' && (
                                <Check className="w-4 h-4 text-stone-900" />
                              )}
                            </button>
                            
                            {/* Divider */}
                            <div className="h-px bg-stone-100 my-2" />
                            
                            {/* Gallery Options */}
                            {galleries.map(gallery => (
                              <button
                                key={gallery.id}
                                onClick={() => {
                                  setSelectedGallery(gallery.id)
                                  setIsDropdownOpen(false)
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors ${
                                  selectedGallery === gallery.id ? 'bg-stone-50' : ''
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                                  selectedGallery === gallery.id 
                                    ? 'bg-stone-900 text-white' 
                                    : 'bg-stone-100 text-stone-500'
                                }`}>
                                  {gallery.title.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-stone-900 truncate">{gallery.title}</p>
                                  <p className="text-xs text-stone-500">{gallery.imageCount} images</p>
                                </div>
                                {selectedGallery === gallery.id && (
                                  <Check className="w-4 h-4 text-stone-900" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <button
                    onClick={() => setIsPickerOpen(false)}
                    className="p-2.5 hover:bg-stone-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-stone-500" />
                  </button>
                </div>
              </div>
              
              {/* Click outside to close dropdown */}
              {isDropdownOpen && (
                <div 
                  className="fixed inset-0 z-[5]" 
                  onClick={() => setIsDropdownOpen(false)}
                />
              )}
              
              {/* Image Grid */}
              <div className="flex-1 overflow-y-auto p-6 bg-stone-50/50">
                {isLoadingImages ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-stone-400 animate-spin mb-4" />
                    <p className="text-sm text-stone-500">Loading images...</p>
                  </div>
                ) : availableImages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center mb-4">
                      <ImageIcon className="w-10 h-10 text-stone-300" />
                    </div>
                    <p className="text-stone-600 font-medium mb-1">No images found</p>
                    <p className="text-sm text-stone-400">This gallery doesn't have any images yet</p>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3"
                  >
                    {availableImages.map((image, index) => (
                      <motion.button
                        key={image.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.02, duration: 0.2 }}
                        onClick={() => {
                          if (image.isInPortfolio) {
                            handleRemove(image.id)
                          } else {
                            handleAdd(image.id)
                          }
                        }}
                        disabled={isPending || (!image.isInPortfolio && portfolioImages.length >= MAX_PORTFOLIO_IMAGES)}
                        className={`
                          relative aspect-square rounded-xl overflow-hidden group transition-all duration-200
                          ${image.isInPortfolio 
                            ? 'ring-2 ring-stone-900 ring-offset-2 ring-offset-stone-50' 
                            : 'hover:ring-2 hover:ring-stone-300 hover:ring-offset-2 hover:ring-offset-stone-50'
                          }
                          ${!image.isInPortfolio && portfolioImages.length >= MAX_PORTFOLIO_IMAGES 
                            ? 'opacity-40 cursor-not-allowed' 
                            : 'cursor-pointer'
                          }
                        `}
                      >
                        <Image
                          src={image.thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                        />
                        
                        {/* Selection overlay */}
                        <div className={`
                          absolute inset-0 flex items-center justify-center transition-all duration-200
                          ${image.isInPortfolio 
                            ? 'bg-stone-900/30' 
                            : 'bg-black/0 group-hover:bg-black/20'
                          }
                        `}>
                          {image.isInPortfolio ? (
                            <motion.div 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            </motion.div>
                          ) : (
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <Plus className="w-5 h-5 text-stone-700" />
                            </div>
                          )}
                        </div>
                        
                        {/* Gallery badge on hover */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white/90 truncate font-medium">
                            {image.galleryTitle}
                          </p>
                        </div>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-100 bg-white flex items-center justify-between">
                <p className="text-sm text-stone-500">
                  Click images to add or remove from your portfolio
                </p>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
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
