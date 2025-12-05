'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UploadZone } from './UploadZone'
import { MasonryGrid } from '@/components/gallery/MasonryGrid'
import { AnimatePresence, motion } from 'framer-motion'

interface UploadInterfaceProps {
  gallery: {
    id: string
    title: string
    slug: string
  }
  images: any[]
}

export function UploadInterface({ gallery, images }: UploadInterfaceProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Auto-scroll to new items logic could be added here if we track previous image count

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header / Nav Area */}
      <div className="container mx-auto px-4 pt-28 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{gallery.title}</h1>
              <p className="text-sm text-gray-500">Manage your gallery content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="hidden lg:flex"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 mr-2" /> : <PanelLeftOpen className="w-4 h-4 mr-2" />}
              {isSidebarOpen ? 'Hide Upload' : 'Show Upload'}
            </Button>
            
            <a
              href={`/g/${gallery.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="rounded-full h-10 shadow-sm bg-white hover:bg-gray-50 border-gray-200">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Pane: Upload Staging */}
          <AnimatePresence initial={false} mode="wait">
            {isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: '100%' }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="lg:w-[400px] lg:sticky lg:top-24 flex-shrink-0 w-full"
              >
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 overflow-hidden h-[calc(100vh-180px)] flex flex-col">
                  <div className="flex items-center justify-between mb-6 flex-none">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-indigo-500" />
                      Upload Studio
                    </h2>
                    <div className="px-2 py-1 rounded-full bg-gray-50 text-xs font-medium text-gray-600 border border-gray-100">
                      Ready
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    <UploadZone 
                      galleryId={gallery.id} 
                      onUploadComplete={() => {
                        // Optional: toast or other feedback
                      }} 
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Pane: Gallery Preview */}
          <motion.div 
            layout
            className="flex-1 w-full min-w-0"
          >
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200 min-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">
                  Gallery Grid
                  <span className="ml-2 text-gray-400 font-normal text-base">({images.length} items)</span>
                </h2>
              </div>
              
              {images.length > 0 ? (
                <div className="animate-in fade-in duration-500">
                   <MasonryGrid images={images} editable />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                  <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 rotate-3 transition-transform hover:rotate-6">
                    <ExternalLink className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-900 font-medium text-lg">Canvas Empty</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs">
                    Uploaded images will appear here instantly in a mosaic grid.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
