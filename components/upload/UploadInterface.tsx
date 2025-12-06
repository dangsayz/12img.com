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
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {/* Header / Nav Area */}
      <div className="container mx-auto px-4 pt-28 pb-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{gallery.title}</h1>
              <p className="text-sm text-gray-500">Manage gallery content</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`/view-reel/${gallery.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="rounded-full h-10 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 font-medium px-6">
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live
              </Button>
            </a>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[600px]">
            
            {/* Left Pane: Upload Staging */}
            <div className="lg:w-[480px] flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 bg-white p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-medium text-gray-900">Upload Studio</h2>
                <div className="px-3 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                  Ready
                </div>
              </div>
              
              <div className="flex-1 min-h-0 flex flex-col">
                <UploadZone 
                  galleryId={gallery.id} 
                  onUploadComplete={() => {}} 
                />
              </div>
            </div>

            {/* Right Pane: Gallery Preview */}
            <div className="flex-1 p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">
                  Highlights
                  <span className="ml-2 text-gray-400 font-normal text-sm">({images.length})</span>
                </h2>
              </div>
              
              {images.length > 0 ? (
                <div className="animate-in fade-in duration-500">
                   <MasonryGrid images={images} editable />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center rounded-2xl bg-gray-50/50 border border-dashed border-gray-200">
                  <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm mb-4 border border-gray-100">
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">Collection Empty</p>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs">
                    Photos will appear here after upload.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
