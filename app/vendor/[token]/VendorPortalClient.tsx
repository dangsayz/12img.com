'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Download, 
  Check, 
  X, 
  Instagram, 
  ExternalLink,
  FileText,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import {
  VendorPortalData,
  VendorPortalImage,
  VENDOR_CATEGORIES,
  getVendorInitials,
} from '@/lib/vendors/types'
import { acceptVendorTerms, trackVendorDownload } from '@/server/actions/vendor.actions'

interface VendorPortalClientProps {
  data: VendorPortalData
  token: string
}

export function VendorPortalClient({ data, token }: VendorPortalClientProps) {
  const [termsAccepted, setTermsAccepted] = useState(!!data.share.terms_accepted_at)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [acceptingTerms, setAcceptingTerms] = useState(false)
  const [selectedImage, setSelectedImage] = useState<VendorPortalImage | null>(null)
  const [downloadingAll, setDownloadingAll] = useState(false)

  const category = VENDOR_CATEGORIES[data.vendor.category]
  const initials = getVendorInitials(data.vendor.business_name)

  const handleAcceptTerms = async () => {
    setAcceptingTerms(true)
    try {
      await acceptVendorTerms(token)
      setTermsAccepted(true)
      setShowTermsModal(false)
    } catch (error) {
      console.error('Failed to accept terms:', error)
    } finally {
      setAcceptingTerms(false)
    }
  }

  const handleDownloadImage = async (image: VendorPortalImage) => {
    if (!termsAccepted) {
      setShowTermsModal(true)
      return
    }
    
    await trackVendorDownload(token)
    window.open(image.download_url, '_blank')
  }

  const handleDownloadAll = async () => {
    if (!termsAccepted) {
      setShowTermsModal(true)
      return
    }

    setDownloadingAll(true)
    await trackVendorDownload(token)
    
    // Download each image
    for (const image of data.images) {
      const link = document.createElement('a')
      link.href = image.download_url
      link.download = image.original_filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setDownloadingAll(false)
  }

  const openLightbox = (image: VendorPortalImage) => {
    setSelectedImage(image)
  }

  const closeLightbox = () => {
    setSelectedImage(null)
  }

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (!selectedImage) return
    const currentIndex = data.images.findIndex(img => img.id === selectedImage.id)
    const newIndex = direction === 'prev' 
      ? (currentIndex - 1 + data.images.length) % data.images.length
      : (currentIndex + 1) % data.images.length
    setSelectedImage(data.images[newIndex])
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Vendor Info */}
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-medium ${category.bgColor} ${category.color}`}
              >
                {initials}
              </div>
              <div>
                <p className="font-medium text-stone-900">{data.vendor.business_name}</p>
                <p className="text-xs text-stone-500">Viewing: {data.gallery.title}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {data.terms && !termsAccepted && (
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  View Terms
                </button>
              )}
              <button
                onClick={handleDownloadAll}
                disabled={downloadingAll}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download All ({data.images.length})
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Gallery Info */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif text-stone-900 mb-2">{data.gallery.title}</h1>
          {data.photographer.business_name && (
            <p className="text-stone-500">
              Photos by {data.photographer.business_name}
              {data.photographer.instagram_handle && (
                <a
                  href={`https://instagram.com/${data.photographer.instagram_handle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 ml-2 text-stone-600 hover:text-stone-900"
                >
                  <Instagram className="w-4 h-4" />
                  @{data.photographer.instagram_handle.replace('@', '')}
                </a>
              )}
            </p>
          )}
          <p className="text-sm text-stone-400 mt-2">{data.images.length} photos available</p>
        </div>

        {/* Terms Banner */}
        {data.terms && !termsAccepted && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-800 font-medium">
                  Please review and accept the usage terms before downloading
                </p>
                <button
                  onClick={() => setShowTermsModal(true)}
                  className="text-sm text-amber-700 hover:text-amber-900 underline mt-1"
                >
                  View Terms →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.images.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative aspect-[4/3] bg-stone-200 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => openLightbox(image)}
            >
              <Image
                src={image.thumbnail_url || image.preview_url}
                alt={image.original_filename}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownloadImage(image)
                  }}
                  className="p-3 bg-white rounded-full shadow-lg hover:bg-stone-100 transition-colors"
                >
                  <Download className="w-5 h-5 text-stone-900" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-white py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-stone-400">
            Powered by{' '}
            <a href="https://12img.com" className="text-stone-600 hover:text-stone-900">
              12img
            </a>
          </p>
        </div>
      </footer>

      {/* Terms Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="text-lg font-semibold text-stone-900">Media Usage Terms</h2>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm prose-stone max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-stone-700 bg-stone-50 p-4 rounded-lg">
                    {data.terms}
                  </pre>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50">
                {termsAccepted ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Terms Accepted</span>
                  </div>
                ) : (
                  <button
                    onClick={handleAcceptTerms}
                    disabled={acceptingTerms}
                    className="w-full py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {acceptingTerms ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    I Accept These Terms
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox('prev')
              }}
              className="absolute left-4 p-3 text-white/70 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigateLightbox('next')
              }}
              className="absolute right-4 p-3 text-white/70 hover:text-white transition-colors"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image */}
            <motion.div
              key={selectedImage.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.preview_url}
                alt={selectedImage.original_filename}
                width={selectedImage.width || 1920}
                height={selectedImage.height || 1080}
                className="max-w-full max-h-[90vh] object-contain"
                priority
              />
              
              {/* Download Button */}
              <button
                onClick={() => handleDownloadImage(selectedImage)}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
