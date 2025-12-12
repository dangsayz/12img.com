'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FolderOpen, ChevronLeft, Check, Star, Image as ImageIcon, Loader2 } from 'lucide-react'
import { 
  getGalleriesForPortfolioPicker, 
  getGalleryImagesForPortfolioPicker,
  addMultipleToPortfolio 
} from '@/server/actions/profile.actions'

interface Gallery {
  id: string
  title: string
  imageCount: number
  coverUrl?: string
}

interface GalleryImage {
  id: string
  storage_path: string
  imageUrl: string
  isInPortfolio: boolean
}

interface AddFavoritesModalProps {
  isOpen: boolean
  onClose: () => void
  currentFavoritesCount: number
  maxFavorites?: number
}

type ModalView = 'main' | 'galleries' | 'gallery-images'

export function AddFavoritesModal({ 
  isOpen, 
  onClose,
  currentFavoritesCount,
  maxFavorites = 10
}: AddFavoritesModalProps) {
  const router = useRouter()
  const [view, setView] = useState<ModalView>('main')
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableSlots = maxFavorites - currentFavoritesCount

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView('main')
      setGalleries([])
      setSelectedGallery(null)
      setGalleryImages([])
      setSelectedImages(new Set())
      setError(null)
    }
  }, [isOpen])

  // Load galleries when switching to gallery view
  const loadGalleries = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getGalleriesForPortfolioPicker()
      if (result.error) {
        setError(result.error)
      } else {
        setGalleries(result.data || [])
      }
    } catch (e) {
      setError('Failed to load galleries')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load images for a specific gallery
  const loadGalleryImages = useCallback(async (galleryId: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getGalleryImagesForPortfolioPicker(galleryId)
      if (result.error) {
        setError(result.error)
      } else {
        setGalleryImages(result.data || [])
      }
    } catch (e) {
      setError('Failed to load images')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSelectGalleries = () => {
    setView('galleries')
    loadGalleries()
  }

  const handleGalleryClick = (gallery: Gallery) => {
    setSelectedGallery(gallery)
    setView('gallery-images')
    setSelectedImages(new Set())
    loadGalleryImages(gallery.id)
  }

  const handleBack = () => {
    if (view === 'gallery-images') {
      setView('galleries')
      setSelectedGallery(null)
      setGalleryImages([])
      setSelectedImages(new Set())
    } else {
      setView('main')
    }
  }

  const toggleImageSelection = (imageId: string, isInPortfolio: boolean) => {
    if (isInPortfolio) return // Can't select if already in portfolio
    
    setSelectedImages(prev => {
      const next = new Set(prev)
      if (next.has(imageId)) {
        next.delete(imageId)
      } else {
        // Check if we have room
        if (next.size >= availableSlots) {
          return prev // Don't add more than available slots
        }
        next.add(imageId)
      }
      return next
    })
  }

  const handleAddSelected = async () => {
    if (selectedImages.size === 0) return

    setIsSaving(true)
    setError(null)
    try {
      const result = await addMultipleToPortfolio(Array.from(selectedImages))
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
        onClose()
      }
    } catch (e) {
      setError('Failed to add images')
    } finally {
      setIsSaving(false)
    }
  }

  const getTitle = () => {
    switch (view) {
      case 'galleries': return 'Select Gallery'
      case 'gallery-images': return selectedGallery?.title || 'Select Photos'
      default: return 'Add to Favorites'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-3">
                  {view !== 'main' && (
                    <button
                      onClick={handleBack}
                      className="p-1.5 -ml-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-stone-500" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-base font-medium text-stone-900">{getTitle()}</h2>
                    {view === 'main' && (
                      <p className="text-xs text-stone-500 mt-0.5">
                        {availableSlots} of {maxFavorites} slots available
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Main View - Choose Method */}
                {view === 'main' && (
                  <div className="p-5 space-y-3">
                    {availableSlots <= 0 ? (
                      <div className="text-center py-8">
                        <Star className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                        <p className="text-stone-600 font-medium">Portfolio is full</p>
                        <p className="text-sm text-stone-400 mt-1">
                          Remove some favorites to add new ones
                        </p>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={handleSelectGalleries}
                          className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                            <FolderOpen className="w-6 h-6 text-stone-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-stone-900">Select from Galleries</p>
                            <p className="text-sm text-stone-500">Choose photos from your existing galleries</p>
                          </div>
                        </button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-200" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-white text-stone-400">or</span>
                          </div>
                        </div>

                        <a
                          href="/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-4 p-4 rounded-xl border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                            <Upload className="w-6 h-6 text-stone-600" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-stone-900">Upload New Photos</p>
                            <p className="text-sm text-stone-500">Create a gallery first, then add to favorites</p>
                          </div>
                        </a>
                      </>
                    )}
                  </div>
                )}

                {/* Galleries List */}
                {view === 'galleries' && (
                  <div className="p-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="text-center py-12">
                        <p className="text-stone-500">{error}</p>
                      </div>
                    ) : galleries.length === 0 ? (
                      <div className="text-center py-12">
                        <FolderOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                        <p className="text-stone-500">No galleries yet</p>
                        <a
                          href="/dashboard"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 text-sm text-stone-600 underline underline-offset-4"
                        >
                          Create your first gallery
                        </a>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {galleries.map(gallery => (
                          <button
                            key={gallery.id}
                            onClick={() => handleGalleryClick(gallery)}
                            className="group text-left"
                          >
                            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 relative">
                              {gallery.coverUrl ? (
                                <img
                                  src={gallery.coverUrl}
                                  alt={gallery.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-stone-300" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-[10px] text-white tabular-nums">
                                {gallery.imageCount}
                              </div>
                            </div>
                            <p className="mt-2 text-sm font-medium text-stone-700 truncate group-hover:text-stone-900">
                              {gallery.title}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Gallery Images Selection */}
                {view === 'gallery-images' && (
                  <div className="p-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                      </div>
                    ) : error ? (
                      <div className="text-center py-12">
                        <p className="text-stone-500">{error}</p>
                      </div>
                    ) : galleryImages.length === 0 ? (
                      <div className="text-center py-12">
                        <ImageIcon className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                        <p className="text-stone-500">No images in this gallery</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-stone-500 mb-3">
                          {selectedImages.size > 0 
                            ? `${selectedImages.size} selected · ${availableSlots - selectedImages.size} slots remaining`
                            : `Select up to ${availableSlots} photos`
                          }
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {galleryImages.map(image => {
                            const isSelected = selectedImages.has(image.id)
                            const isDisabled = image.isInPortfolio || (!isSelected && selectedImages.size >= availableSlots)
                            
                            return (
                              <button
                                key={image.id}
                                onClick={() => toggleImageSelection(image.id, image.isInPortfolio)}
                                disabled={image.isInPortfolio}
                                className={`aspect-square rounded-lg overflow-hidden relative group ${
                                  isDisabled && !image.isInPortfolio ? 'opacity-50' : ''
                                }`}
                              >
                                <img
                                  src={image.imageUrl}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                                
                                {/* Selection overlay */}
                                <div className={`absolute inset-0 transition-colors ${
                                  isSelected 
                                    ? 'bg-amber-500/30' 
                                    : image.isInPortfolio 
                                      ? 'bg-black/30' 
                                      : 'bg-black/0 group-hover:bg-black/20'
                                }`} />
                                
                                {/* Selection indicator */}
                                {isSelected && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                )}
                                
                                {/* Already in portfolio indicator */}
                                {image.isInPortfolio && (
                                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                  </div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer - Show only when images are selected */}
              {view === 'gallery-images' && selectedImages.size > 0 && (
                <div className="shrink-0 border-t border-stone-100 px-5 py-4 bg-stone-50">
                  <button
                    onClick={handleAddSelected}
                    disabled={isSaving}
                    className="w-full py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4" />
                        Add {selectedImages.size} to Favorites
                      </>
                    )}
                  </button>
                  {error && (
                    <p className="text-xs text-red-500 mt-2 text-center">{error}</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
